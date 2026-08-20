export interface FacebookLeadFormMapping {
  formId: string;
  formName: string;
  funnelId: string;
  originId: string;
  tagIds: string[];
  active: boolean;
}

export interface FacebookPageIntegration {
  pageId: string;
  pageName: string;
  subscribed: boolean;
  forms: FacebookLeadFormMapping[];
}

export interface FacebookAdAccount {
  adAccountId: string;
  adAccountName: string;
  currency: string;
}

export interface FacebookAdsIntegration {
  connected: boolean;
  fbUserId: string;
  fbUserName: string;
  pages: FacebookPageIntegration[];
  adAccounts: FacebookAdAccount[];
  selectedAdAccountId: string | null;
  adAccountsFetchFailed: boolean;
  connectedBy: string;
  connectedAt: number;
  updatedAt: number;
}
