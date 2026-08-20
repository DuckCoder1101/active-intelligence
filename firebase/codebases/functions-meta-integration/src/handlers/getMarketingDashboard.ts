import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import { FacebookAdsInsightsRepository } from "../repositories/facebook-ads-insights.repository";
import type { MarketingDashboardDTO } from "../types/marketing-dashboard.dto";

/** Tem que bater com a retenção do FacebookAdsSyncService/scheduler. */
const RETENTION_DAYS = 90;

const schema = z.object({
  companyId: z.string().min(1),
});

function sinceDateStr(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (RETENTION_DAYS - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Lê o cache do dashboard de marketing — nunca chama a Graph API diretamente
 * (isso é responsabilidade do scheduler/backfill). Retorna um union
 * discriminado por status pra frontend nunca ter que inferir o estado.
 * Auth: requireCompanyAccess(req, data.companyId, "ao dashboard de marketing").
 */
export const getMarketingDashboardHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(
    req,
    data.companyId,
    "ao dashboard de marketing",
  );

  const integration = await FacebookAdsIntegrationRepository.get(companyId);
  if (!integration || !integration.connected) {
    return { status: "not_connected" } satisfies MarketingDashboardDTO;
  }

  if (integration.adAccountsFetchFailed) {
    return { status: "no_ads_permission" } satisfies MarketingDashboardDTO;
  }

  if (!integration.selectedAdAccountId) {
    return {
      status: "no_account_selected",
      adAccounts: integration.adAccounts,
    } satisfies MarketingDashboardDTO;
  }

  const [snapshot, dailyInsights] = await Promise.all([
    FacebookAdsInsightsRepository.getSnapshot(companyId),
    FacebookAdsInsightsRepository.getDailyInsights(companyId, sinceDateStr()),
  ]);

  if (!snapshot) {
    // Selecionado, mas o backfill inicial ainda não rodou/terminou.
    return {
      status: "no_account_selected",
      adAccounts: integration.adAccounts,
    } satisfies MarketingDashboardDTO;
  }

  const adAccountName =
    integration.adAccounts.find((a) => a.adAccountId === integration.selectedAdAccountId)
      ?.adAccountName ?? "";

  return {
    status: "ok",
    adAccountName,
    currency: snapshot.currency,
    balance: snapshot.balance,
    campaigns: snapshot.campaigns,
    dailyInsights: dailyInsights.map((d) => ({ date: d.date, campaigns: d.campaigns })),
    updatedAt: snapshot.updatedAt?.toMillis() ?? 0,
    lastSyncError: snapshot.lastSyncError,
  } satisfies MarketingDashboardDTO;
});
