import { httpsCallable } from 'firebase/functions';

import type { FacebookAdsIntegration } from '@/models/meta-integration.model';
import { functions } from '@/utils/firebase.util';

export default class MetaIntegrationService {
  private static connectFacebookAdsCallable = httpsCallable<
    { companyId: string; accessToken: string },
    FacebookAdsIntegration
  >(functions, 'connectFacebookAdsHandler');

  private static getFacebookAdsSettingsCallable = httpsCallable<
    { companyId: string },
    FacebookAdsIntegration | null
  >(functions, 'getFacebookAdsSettingsHandler');

  private static disconnectFacebookAdsCallable = httpsCallable<
    { companyId: string },
    void
  >(functions, 'disconnectFacebookAdsHandler');

  static async connectFacebookAds(
    companyId: string,
    accessToken: string,
  ): Promise<FacebookAdsIntegration> {
    const r = await this.connectFacebookAdsCallable({ companyId, accessToken });
    return r.data;
  }

  static async getFacebookAdsSettings(
    companyId: string,
  ): Promise<FacebookAdsIntegration | null> {
    const r = await this.getFacebookAdsSettingsCallable({ companyId });
    return r.data;
  }

  static async disconnectFacebookAds(companyId: string): Promise<void> {
    await this.disconnectFacebookAdsCallable({ companyId });
  }
}
