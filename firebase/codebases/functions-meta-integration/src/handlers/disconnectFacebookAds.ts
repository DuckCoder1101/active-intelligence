import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { MetaSecretRepository } from "../repositories/meta-secret.repository";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import { FacebookAdsInsightsRepository } from "../repositories/facebook-ads-insights.repository";

const schema = z.object({
  companyId: z.string().min(1),
});

/** Auth: requireCompanyAccess(req, data.companyId, "às integrações da empresa"). */
export const disconnectFacebookAdsHandler = onCallHandler(async (req) => {
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

  const secretRef = await FacebookAdsIntegrationRepository.disconnect(companyId);

  if (secretRef) {
    try {
      await MetaSecretRepository.deleteSecret(secretRef);
    } catch (err) {
      logger.error("disconnectFacebookAds: falha ao remover secret", err, {
        companyId,
      });
    }
  }

  // Evita que um reconnect futuro (possivelmente com outra conta de anúncios)
  // herde números em cache de uma conta diferente.
  try {
    await FacebookAdsInsightsRepository.deleteAll(companyId);
  } catch (err) {
    logger.error("disconnectFacebookAds: falha ao limpar cache de insights", err, {
      companyId,
    });
  }

  logger.info("disconnectFacebookAds", { companyId });
});
