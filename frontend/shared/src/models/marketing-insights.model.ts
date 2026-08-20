import type { FacebookAdAccount } from './meta-integration.model';

export interface MarketingCampaign {
  campaignId: string;
  campaignName: string;
  status: string;
  effectiveStatus: string;
  objective?: string;
}

export interface MarketingDailyCampaignInsight {
  campaignId: string;
  spend: number;
  leads: number;
}

export interface MarketingDailyInsight {
  date: string;
  campaigns: MarketingDailyCampaignInsight[];
}

/**
 * Union discriminado por status — nunca inferir o estado da conexão a partir
 * de campos opcionais. Espelha MarketingDashboardDTO do backend
 * (functions-meta-integration/src/types/marketing-dashboard.dto.ts).
 */
export type MarketingDashboard =
  | { status: 'not_connected' }
  | { status: 'no_ads_permission' }
  | { status: 'no_account_selected'; adAccounts: FacebookAdAccount[] }
  | {
      status: 'ok';
      adAccountName: string;
      currency: string;
      balance: number | null;
      campaigns: MarketingCampaign[];
      dailyInsights: MarketingDailyInsight[];
      updatedAt: number;
      lastSyncError?: string;
    };
