import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, bucket, requireCompanyAccess } from "functions-shared";
import { RealEstateRepository } from "../repositories/real-estate.repository";

const schema = z.object({
  companyId: z.string().min(1),
  realEstateId: z.string().min(1),
});

/**
 * Deletes a real-estate listing and cleans up its storage files.
 * Auth: `requireCompanyAccess(req, companyId, "aos imóveis")`.
 * Schema: inline `z.object({ companyId, realEstateId })`.
 * Deviates from the standard flow: after the repository delete, also calls
 * `bucket.deleteFiles({ prefix })` directly to remove the listing's media.
 */
export const deleteRealEstateHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "realEstateId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(
    req,
    data.companyId,
    "aos imóveis",
  );

  logger.info("deleteRealEstate", {
    companyId,
    realEstateId: data.realEstateId,
  });

  await RealEstateRepository.delete(companyId, data.realEstateId);

  const prefix = `client/${companyId}/real_estate/${data.realEstateId}/`;
  await bucket
    .deleteFiles({ prefix })
    .catch((err) =>
      logger.warn("deleteRealEstate: falha ao limpar storage", {
        realEstateId: data.realEstateId,
        err: String(err),
      }),
    );

  return true;
});
