import type { FacebookAdAccount, FacebookCampaignInsight } from "functions-shared";

export interface MarketingDailyInsightDTO {
  date: string;
  campaigns: { campaignId: string; spend: number; leads: number }[];
}

/**
 * Discriminated union pelo status da conexão — o frontend nunca precisa
 * inferir o estado a partir de campos opcionais, e cada status tem uma
 * mensagem/CTA diferente na tela:
 * - not_connected: nunca conectou o Facebook (ou desconectou).
 * - no_ads_permission: conectado, mas a última tentativa de listar contas de
 *   anúncios falhou (provavelmente falta o escopo ads_read) — pede reconexão.
 * - no_account_selected: conectado, escopo ads_read ok, mas sem conta
 *   selecionada ainda (adAccounts pode vir vazio — sem contas na Business
 *   Manager — ou com mais de uma, aguardando escolha).
 * - ok: tem conta selecionada, retorna os dados cacheados do dashboard.
 */
export type MarketingDashboardDTO =
  | { status: "not_connected" }
  | { status: "no_ads_permission" }
  | { status: "no_account_selected"; adAccounts: FacebookAdAccount[] }
  | {
      status: "ok";
      adAccountName: string;
      currency: string;
      balance: number | null;
      campaigns: FacebookCampaignInsight[];
      dailyInsights: MarketingDailyInsightDTO[];
      updatedAt: number;
      lastSyncError?: string;
    };
