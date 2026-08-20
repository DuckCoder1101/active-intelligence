import { logger } from "firebase-functions";

import type { FacebookAdsDailyInsightDocument, FacebookAdsSyncErrorCode } from "functions-shared";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import { FacebookAdsInsightsRepository } from "../repositories/facebook-ads-insights.repository";
import { MetaSecretRepository } from "../repositories/meta-secret.repository";
import { FacebookGraphService } from "./facebook-graph.service";
import { logUnrecognizedActionTypes, sumLeadActions } from "../utils/facebook-lead-actions.util";

/** Quanto de série diária mantemos em cache, independente da janela de cada sync. */
const RETENTION_DAYS = 90;

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function classifySyncError(err: unknown): {
  code: FacebookAdsSyncErrorCode;
  message: string;
} {
  const message = err instanceof Error ? err.message : String(err);

  const jsonMatch = message.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        error?: { type?: string; code?: number };
      };
      const type = parsed.error?.type;
      const code = parsed.error?.code;

      if (type === "OAuthException" || code === 190) {
        return { code: "token_invalid", message };
      }
      if (code === 10 || (code !== undefined && code >= 200 && code <= 299)) {
        return { code: "permission_denied", message };
      }
      if (code === 4 || code === 17 || code === 32 || code === 613) {
        return { code: "rate_limited", message };
      }
    } catch {
      // corpo do erro não era JSON — cai no fallback "unknown" abaixo.
    }
  }

  return { code: "unknown", message };
}

/**
 * Busca dados da Meta pra uma empresa e grava no cache do Firestore. Usado
 * tanto pelo backfill (90 dias, disparado ao conectar/selecionar conta) quanto
 * pelo sync periódico (30 dias, disparado pelo scheduler) — a atribuição de
 * cliques da Meta se consolida em ~28 dias, então refazer os 90 dias inteiros
 * a cada ciclo seria desperdício sem ganho de correção.
 */
export class FacebookAdsSyncService {
  static async syncCompany(companyId: string, windowDays: number): Promise<void> {
    const integration = await FacebookAdsIntegrationRepository.getRaw(companyId);
    if (!integration?.connected || !integration.selectedAdAccountId) return;

    const adAccountId = integration.selectedAdAccountId;

    try {
      const token = await MetaSecretRepository.getToken(integration.secretRef);

      // "Ontem" porque o dia corrente ainda não fechou na Meta.
      const until = addDays(new Date(), -1);
      const since = addDays(until, -(windowDays - 1));

      const [summary, campaigns, insightRows] = await Promise.all([
        FacebookGraphService.getAdAccountSummary(adAccountId, token),
        FacebookGraphService.listCampaigns(adAccountId, token),
        FacebookGraphService.getDailyInsights(
          adAccountId,
          token,
          toDateStr(since),
          toDateStr(until),
        ),
      ]);

      const dailyByDate = new Map<string, FacebookAdsDailyInsightDocument>();
      for (const row of insightRows) {
        logUnrecognizedActionTypes(row.actions, {
          companyId,
          campaignId: row.campaign_id,
        });
        const leads = sumLeadActions(row.actions);
        const spend = Number(row.spend) || 0;

        const dayDoc = dailyByDate.get(row.date_start) ?? {
          date: row.date_start,
          campaigns: [],
        };
        dayDoc.campaigns.push({ campaignId: row.campaign_id, spend, leads });
        dailyByDate.set(row.date_start, dayDoc);
      }

      await FacebookAdsInsightsRepository.saveDailyInsights(
        companyId,
        Array.from(dailyByDate.values()),
      );

      await FacebookAdsInsightsRepository.saveSnapshot(companyId, {
        adAccountId,
        currency: summary.currency,
        balance: summary.balance,
        spendCap: summary.spendCap ?? undefined,
        campaigns: campaigns.map((c) => ({
          campaignId: c.id,
          campaignName: c.name,
          status: c.status,
          effectiveStatus: c.effective_status,
          objective: c.objective,
        })),
      });

      const cutoff = addDays(until, -(RETENTION_DAYS - 1));
      await FacebookAdsInsightsRepository.pruneOldDailyInsights(
        companyId,
        toDateStr(cutoff),
      );
    } catch (err) {
      const { code, message } = classifySyncError(err);
      logger.error("FacebookAdsSyncService.syncCompany falhou", {
        companyId,
        adAccountId,
        code,
        message,
      });
      await FacebookAdsInsightsRepository.saveSyncError(companyId, code, message);
    }
  }
}
