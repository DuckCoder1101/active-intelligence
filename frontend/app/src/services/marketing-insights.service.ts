import { httpsCallable } from 'firebase/functions';

import type { MarketingDashboard } from '@/models/marketing-insights.model';
import type { FacebookAdsIntegration } from '@/models/meta-integration.model';
import { functions } from '@/utils/firebase.util';

export default class MarketingInsightsService {
  private static getMarketingDashboardCallable = httpsCallable<
    { companyId: string },
    MarketingDashboard
  >(functions, 'getMarketingDashboardHandler');

  private static selectFacebookAdAccountCallable = httpsCallable<
    { companyId: string; adAccountId: string },
    FacebookAdsIntegration
  >(functions, 'selectFacebookAdAccountHandler');

  static async getMarketingDashboard(companyId: string): Promise<MarketingDashboard> {
    const r = await this.getMarketingDashboardCallable({ companyId });
    return r.data;
  }

  static async selectFacebookAdAccount(
    companyId: string,
    adAccountId: string,
  ): Promise<FacebookAdsIntegration> {
    const r = await this.selectFacebookAdAccountCallable({ companyId, adAccountId });
    return r.data;
  }
}
