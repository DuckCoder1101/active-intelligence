import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import type {
  FacebookAdsDailyInsightDocument,
  FacebookAdsInsightsSnapshotDocument,
  FacebookAdsSyncErrorCode,
  FacebookCampaignInsight,
} from "functions-shared";

/** Máximo de operações por batch do Firestore. */
const BATCH_CHUNK_SIZE = 450;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Firestore: `companies/{companyId}/integration_settings/facebookAdsInsights` (snapshot fixo) + `companies/{companyId}/marketing_daily_insights/{yyyy-mm-dd}` (série diária, id = date_start da Graph API). */
export class FacebookAdsInsightsRepository {
  private static snapshotDoc(companyId: string) {
    return database
      .collection("companies")
      .doc(companyId)
      .collection("integration_settings")
      .doc("facebookAdsInsights");
  }

  private static dailyCollection(companyId: string) {
    return database
      .collection("companies")
      .doc(companyId)
      .collection("marketing_daily_insights");
  }

  static async getSnapshot(
    companyId: string,
  ): Promise<FacebookAdsInsightsSnapshotDocument | null> {
    const snap = await this.snapshotDoc(companyId).get();
    if (!snap.exists) return null;
    return snap.data() as FacebookAdsInsightsSnapshotDocument;
  }

  /** Sucesso: grava o snapshot e limpa qualquer erro anterior (senão sobrevive pra sempre num merge). */
  static async saveSnapshot(
    companyId: string,
    data: {
      adAccountId: string;
      currency: string;
      balance: number | null;
      spendCap?: number | null;
      campaigns: FacebookCampaignInsight[];
    },
  ): Promise<void> {
    await this.snapshotDoc(companyId).set(
      {
        companyId,
        adAccountId: data.adAccountId,
        currency: data.currency,
        balance: data.balance,
        spendCap: data.spendCap ?? FieldValue.delete(),
        campaigns: data.campaigns,
        updatedAt: FieldValue.serverTimestamp(),
        lastSyncError: FieldValue.delete(),
        lastSyncErrorCode: FieldValue.delete(),
      },
      { merge: true },
    );
  }

  /** Falha: só toca os campos de erro — nunca apaga o último snapshot bom conhecido (campaigns/balance). */
  static async saveSyncError(
    companyId: string,
    code: FacebookAdsSyncErrorCode,
    message: string,
  ): Promise<void> {
    await this.snapshotDoc(companyId).set(
      {
        companyId,
        lastSyncError: message,
        lastSyncErrorCode: code,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  static async saveDailyInsights(
    companyId: string,
    rows: FacebookAdsDailyInsightDocument[],
  ): Promise<void> {
    const collection = this.dailyCollection(companyId);
    for (const rowsChunk of chunk(rows, BATCH_CHUNK_SIZE)) {
      const batch = database.batch();
      for (const row of rowsChunk) {
        batch.set(collection.doc(row.date), row, { merge: true });
      }
      await batch.commit();
    }
  }

  static async getDailyInsights(
    companyId: string,
    sinceDateStr: string,
  ): Promise<FacebookAdsDailyInsightDocument[]> {
    const snap = await this.dailyCollection(companyId)
      .where("date", ">=", sinceDateStr)
      .orderBy("date", "asc")
      .get();
    return snap.docs.map((doc) => doc.data() as FacebookAdsDailyInsightDocument);
  }

  static async pruneOldDailyInsights(
    companyId: string,
    cutoffDateStr: string,
  ): Promise<void> {
    const snap = await this.dailyCollection(companyId)
      .where("date", "<", cutoffDateStr)
      .get();
    if (snap.empty) return;

    for (const docsChunk of chunk(snap.docs, BATCH_CHUNK_SIZE)) {
      const batch = database.batch();
      for (const doc of docsChunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  }

  static async deleteAll(companyId: string): Promise<void> {
    const snap = await this.dailyCollection(companyId).get();
    for (const docsChunk of chunk(snap.docs, BATCH_CHUNK_SIZE)) {
      const batch = database.batch();
      for (const doc of docsChunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
    await this.snapshotDoc(companyId).delete();
  }
}
