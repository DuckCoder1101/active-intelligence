import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import type {
  FacebookAdAccount,
  FacebookAdsIntegrationDocument,
  FacebookPageIntegration,
} from "functions-shared";
import type { FacebookAdsIntegrationDTO } from "../types/facebook-ads-integration.dto";

function toDTO(
  data: FacebookAdsIntegrationDocument,
): FacebookAdsIntegrationDTO {
  return {
    connected: data.connected,
    fbUserId: data.fbUserId,
    fbUserName: data.fbUserName,
    pages: data.pages,
    adAccounts: data.adAccounts ?? [],
    selectedAdAccountId: data.selectedAdAccountId ?? null,
    adAccountsFetchFailed: data.adAccountsFetchFailed ?? false,
    connectedBy: data.connectedBy,
    connectedAt: data.connectedAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

/** Firestore: `companies/{companyId}/integration_settings/facebookAds` (documento fixo) + `facebook_page_links/{pageId}` (top-level, resolve webhook -> companyId). */
export class FacebookAdsIntegrationRepository {
  private static doc(companyId: string) {
    return database
      .collection("companies")
      .doc(companyId)
      .collection("integration_settings")
      .doc("facebookAds");
  }

  static async get(
    companyId: string,
  ): Promise<FacebookAdsIntegrationDTO | null> {
    const snap = await this.doc(companyId).get();
    if (!snap.exists) return null;
    return toDTO(snap.data() as FacebookAdsIntegrationDocument);
  }

  /** Documento cru, com `secretRef` — uso interno (sync service/scheduler). Nunca expor via DTO/callable. */
  static async getRaw(
    companyId: string,
  ): Promise<FacebookAdsIntegrationDocument | null> {
    const snap = await this.doc(companyId).get();
    if (!snap.exists) return null;
    return snap.data() as FacebookAdsIntegrationDocument;
  }

  static async save(
    companyId: string,
    uid: string,
    data: {
      fbUserId: string;
      fbUserName: string;
      secretRef: string;
      pages: FacebookPageIntegration[];
      adAccounts?: FacebookAdAccount[];
      selectedAdAccountId?: string | null;
      adAccountsFetchFailed?: boolean;
    },
  ): Promise<FacebookAdsIntegrationDTO> {
    const ref = this.doc(companyId);
    const now = FieldValue.serverTimestamp();

    await ref.set(
      {
        companyId,
        connected: true,
        fbUserId: data.fbUserId,
        fbUserName: data.fbUserName,
        secretRef: data.secretRef,
        pages: data.pages,
        adAccounts: data.adAccounts ?? [],
        selectedAdAccountId: data.selectedAdAccountId ?? null,
        adAccountsFetchFailed: data.adAccountsFetchFailed ?? false,
        connectedBy: uid,
        connectedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    await this.linkPages(
      companyId,
      data.pages.map((p) => p.pageId),
    );

    const snap = await ref.get();
    return toDTO(snap.data() as FacebookAdsIntegrationDocument);
  }

  static async selectAdAccount(
    companyId: string,
    adAccountId: string,
  ): Promise<FacebookAdsIntegrationDTO> {
    const ref = this.doc(companyId);
    await ref.set(
      { selectedAdAccountId: adAccountId, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    const snap = await ref.get();
    return toDTO(snap.data() as FacebookAdsIntegrationDocument);
  }

  static async disconnect(companyId: string): Promise<string | null> {
    const ref = this.doc(companyId);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const data = snap.data() as FacebookAdsIntegrationDocument;

    await this.unlinkPages(data.pages.map((p) => p.pageId));
    await ref.delete();

    return data.secretRef;
  }

  private static async linkPages(
    companyId: string,
    pageIds: string[],
  ): Promise<void> {
    if (pageIds.length === 0) return;

    const batch = database.batch();
    for (const pageId of pageIds) {
      batch.set(database.collection("facebook_page_links").doc(pageId), {
        companyId,
      });
    }
    await batch.commit();
  }

  private static async unlinkPages(pageIds: string[]): Promise<void> {
    if (pageIds.length === 0) return;

    const batch = database.batch();
    for (const pageId of pageIds) {
      batch.delete(database.collection("facebook_page_links").doc(pageId));
    }
    await batch.commit();
  }
}
