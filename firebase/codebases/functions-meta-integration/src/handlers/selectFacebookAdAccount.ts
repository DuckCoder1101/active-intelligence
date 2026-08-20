import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import { FacebookAdsSyncService } from "../services/facebook-ads-sync.service";
import type { FacebookAdsIntegrationDTO } from "../types/facebook-ads-integration.dto";

const INITIAL_BACKFILL_WINDOW_DAYS = 90;

const schema = z.object({
  companyId: z.string().min(1),
  adAccountId: z.string().min(1),
});

/**
 * Deixa o usuário escolher qual conta de anúncios alimenta o /marketing
 * quando a conexão encontrou mais de uma (o connect só auto-seleciona
 * quando há exatamente uma).
 * Auth: requireCompanyAccess(req, data.companyId, "às integrações da empresa").
 */
export const selectFacebookAdAccountHandler = onCallHandler(async (req) => {
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
    "às integrações da empresa",
  );

  const integration = await FacebookAdsIntegrationRepository.get(companyId);
  const isKnownAdAccount = integration?.adAccounts.some(
    (a) => a.adAccountId === data.adAccountId,
  );
  if (!isKnownAdAccount) {
    throw new HttpsError(
      "invalid-argument",
      "Essa conta de anúncios não foi encontrada na conexão com o Facebook.",
    );
  }

  const result: FacebookAdsIntegrationDTO =
    await FacebookAdsIntegrationRepository.selectAdAccount(
      companyId,
      data.adAccountId,
    );

  await FacebookAdsSyncService.syncCompany(companyId, INITIAL_BACKFILL_WINDOW_DAYS);

  return result;
});
