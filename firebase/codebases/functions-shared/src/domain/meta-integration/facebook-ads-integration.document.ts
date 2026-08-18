import { Timestamp } from "firebase-admin/firestore";

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

/** Firestore: `companies/{companyId}/integration_settings/facebookAds` — documento fixo, não tem lista. */
export interface FacebookAdsIntegrationDocument {
  companyId: string;
  connected: boolean;
  fbUserId: string;
  fbUserName: string;
  /** Nome do segredo no Secret Manager onde ficam os tokens. O token nunca é salvo no Firestore. */
  secretRef: string;
  pages: FacebookPageIntegration[];
  connectedBy: string;
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}

/** Firestore: `facebook_page_links/{pageId}` (top-level) — resolve pageId -> companyId pro webhook de leads. */
export interface FacebookPageLinkDocument {
  companyId: string;
}
