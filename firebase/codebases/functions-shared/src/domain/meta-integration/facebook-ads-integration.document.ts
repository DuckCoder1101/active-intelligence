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

export interface FacebookAdAccount {
  adAccountId: string;
  adAccountName: string;
  currency: string;
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
  /** Contas de anúncios encontradas na última conexão (requer o escopo `ads_read`). */
  adAccounts?: FacebookAdAccount[];
  /** Conta de anúncios selecionada para alimentar o dashboard de marketing. */
  selectedAdAccountId?: string | null;
  /** true = a última tentativa de listar contas de anúncios falhou (provavelmente falta o escopo ads_read) — distingue de "conectado, mas com 0 contas de anúncios de fato". */
  adAccountsFetchFailed?: boolean;
  connectedBy: string;
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}

/** Firestore: `facebook_page_links/{pageId}` (top-level) — resolve pageId -> companyId pro webhook de leads. */
export interface FacebookPageLinkDocument {
  companyId: string;
}
