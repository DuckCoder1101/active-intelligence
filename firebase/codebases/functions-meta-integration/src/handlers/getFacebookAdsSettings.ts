import { z } from "zod";
import { HttpsError } from "firebase-functions/https";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { FacebookAdsIntegrationRepository } from "../repositories/facebook-ads-integration.repository";
import type { FacebookAdsIntegrationDTO } from "../types/facebook-ads-integration.dto";

const schema = z.object({
  companyId: z.string().min(1),
});

/** Auth: requireCompanyAccess(req, data.companyId, "às integrações da empresa"). */
export const getFacebookAdsSettingsHandler = onCallHandler(async (req) => {
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

  const settings: FacebookAdsIntegrationDTO | null =
    await FacebookAdsIntegrationRepository.get(companyId);

  return settings;
});
