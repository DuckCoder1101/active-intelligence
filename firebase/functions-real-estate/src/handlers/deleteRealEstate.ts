import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, bucket } from "functions-shared";
import { RealEstateRepository } from "../repositories/real-estate.repository";
import { requireCompanyAccess } from "../utils/requireCompanyAccess";

const schema = z.object({
  companyId: z.string().min(1),
  realEstateId: z.string().min(1),
});

export const deleteRealEstateHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "realEstateId obrigatório",
      error.issues,
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info("deleteRealEstate", {
    companyId,
    realEstateId: data.realEstateId,
  });

  await RealEstateRepository.delete(companyId, data.realEstateId);

  const prefix = `client/${companyId}/real_estate/${data.realEstateId}/`;
  await bucket.deleteFiles({ prefix }).catch((err) => logger.warn(
    "deleteRealEstate: falha ao limpar storage",
    { realEstateId: data.realEstateId, err: String(err) },
  ));

  return true;
});
