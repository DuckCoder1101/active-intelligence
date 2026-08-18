import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { FacebookGraphService } from "../services/facebook-graph.service";
import { MetaSecretRepository } from "../repositories/meta-secret.repository";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import type { FacebookAdsIntegrationDTO } from "../types/facebook-ads-integration.dto";

const schema = z.object({
  companyId: z.string().min(1),
  accessToken: z.string().min(1),
});

/**
 * Recebe o short-lived user access token que o FB.login() (JS SDK) devolveu
 * no frontend, troca por um token de longa duração, lê perfil + páginas do
 * Facebook, guarda o token no Secret Manager e salva o documento de
 * integração da empresa.
 * Auth: requireCompanyAccess(req, data.companyId, "às integrações da empresa").
 */
export const connectFacebookAdsHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { uid, companyId } = requireCompanyAccess(
    req,
    data.companyId,
    "às integrações da empresa",
  );

  let longLivedToken: string;
  let profile: { id: string; name: string };
  let pages: { id: string; name: string }[];
  try {
    longLivedToken = await FacebookGraphService.exchangeForLongLivedToken(
      data.accessToken,
    );
    [profile, pages] = await Promise.all([
      FacebookGraphService.getProfile(longLivedToken),
      FacebookGraphService.listPages(longLivedToken),
    ]);
  } catch (err) {
    logger.error("connectFacebookAds: falha na Graph API", err, { companyId });
    throw new HttpsError(
      "failed-precondition",
      "Não foi possível conectar com o Facebook. Tente novamente.",
    );
  }

  const secretRef = await MetaSecretRepository.saveToken(
    companyId,
    longLivedToken,
  );

  logger.info("connectFacebookAds", {
    companyId,
    fbUserId: profile.id,
    pages: pages.length,
  });

  const result: FacebookAdsIntegrationDTO =
    await FacebookAdsIntegrationRepository.save(companyId, uid, {
      fbUserId: profile.id,
      fbUserName: profile.name,
      secretRef,
      pages: pages.map((p) => ({
        pageId: p.id,
        pageName: p.name,
        subscribed: false,
        forms: [],
      })),
    });

  return result;
});
