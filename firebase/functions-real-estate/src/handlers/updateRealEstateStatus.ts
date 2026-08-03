import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import RealEstateSchema from "../data/real-estate.schema";
import { RealEstateRepository } from "../repositories/real-estate.repository";

/**
 * Updates a listing's status.
 * Auth: `requireCompanyAccess(req, companyId, "aos imóveis")`.
 * Schema: `../data/real-estate.schema` → `RealEstateSchema.updateStatusSchema`.
 */
export const updateRealEstateStatusHandler = onCallHandler(async (req) => {
  const { success, data, error } =
    RealEstateSchema.updateStatusSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "aos imóveis");

  logger.info("updateRealEstateStatus", {
    companyId,
    realEstateId: data.realEstateId,
    status: data.status,
  });

  await RealEstateRepository.updateStatus(
    companyId,
    data.realEstateId,
    data.status,
  );
  return true;
});
