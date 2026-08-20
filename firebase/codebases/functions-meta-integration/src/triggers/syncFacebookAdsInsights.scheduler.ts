import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/scheduler";

import { CompanyRepository } from "functions-shared";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import { FacebookAdsSyncService } from "../services/facebook-ads-sync.service";

/** Meta consolida atribuição de cliques em ~28 dias — refazer 90 dias a cada ciclo seria desperdício sem ganho de correção (o backfill de 90 dias já rodou ao conectar/selecionar conta). */
const SYNC_WINDOW_DAYS = 30;

/** Processa empresas em lotes com concorrência limitada — nem tudo serial (lento), nem tudo em paralelo (estoura rate limit da Graph API). */
const CONCURRENCY = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Roda 2x/dia, busca todas as empresas e sincroniza o cache de insights da
 * Meta pras que têm o Facebook Ads conectado + conta de anúncios selecionada.
 * Uma empresa falhando (token expirado, etc.) nunca derruba o lote inteiro —
 * ver FacebookAdsSyncService.syncCompany, que já captura e loga por conta própria.
 */
export const syncFacebookAdsInsights = onSchedule(
  { schedule: "0 8,20 * * *", timeZone: "America/Sao_Paulo", timeoutSeconds: 540 },
  async () => {
    const companies = await CompanyRepository.getAllCompanies();

    const candidates: string[] = [];
    for (const company of companies) {
      const integration = await FacebookAdsIntegrationRepository.get(company.companyId);
      if (integration?.connected && integration.selectedAdAccountId) {
        candidates.push(company.companyId);
      }
    }

    logger.info("syncFacebookAdsInsights: iniciando", {
      totalCompanies: companies.length,
      candidates: candidates.length,
    });

    for (const companyIds of chunk(candidates, CONCURRENCY)) {
      await Promise.allSettled(
        companyIds.map((companyId) =>
          FacebookAdsSyncService.syncCompany(companyId, SYNC_WINDOW_DAYS),
        ),
      );
    }

    logger.info("syncFacebookAdsInsights: concluído", {
      synced: candidates.length,
    });
  },
);
