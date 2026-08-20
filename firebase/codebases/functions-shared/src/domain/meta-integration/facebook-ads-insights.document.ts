import { Timestamp } from "firebase-admin/firestore";

export type FacebookAdsSyncErrorCode =
  | "token_invalid"
  | "permission_denied"
  | "rate_limited"
  | "unknown";

/**
 * Tabela de dimensão (nome/status), sem números de gasto/leads — esses vêm
 * sempre de FacebookAdsDailyInsightDocument, agregados no período escolhido
 * pelo cliente. Evita ter dois lugares "meio certos" pra spend/leads.
 */
export interface FacebookCampaignInsight {
  campaignId: string;
  campaignName: string;
  status: string;
  effectiveStatus: string;
  objective?: string;
}

/** Firestore: `companies/{companyId}/integration_settings/facebookAdsInsights` — documento fixo, snapshot da conta de anúncios. */
export interface FacebookAdsInsightsSnapshotDocument {
  companyId: string;
  adAccountId: string;
  currency: string;
  balance: number | null;
  spendCap?: number;
  campaigns: FacebookCampaignInsight[];
  updatedAt: Timestamp;
  lastSyncError?: string;
  lastSyncErrorCode?: FacebookAdsSyncErrorCode;
}

/** Firestore: `companies/{companyId}/marketing_daily_insights/{yyyy-mm-dd}` — id = `date_start` retornado pela Graph API (mesmo fuso da conta de anúncios). */
export interface FacebookAdsDailyInsightDocument {
  date: string;
  campaigns: {
    campaignId: string;
    spend: number;
    leads: number;
  }[];
}
