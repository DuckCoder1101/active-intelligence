import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import RealEstateSchema from "../data/real-estate.schema";
import { RealEstateRepository } from "../repositories/real-estate.repository";

export const saveRealEstateHandler = onCallHandler(async (req) => {
  const { success, data, error } = RealEstateSchema.saveSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const { uid, companyId } = requireCompanyAccess(req, data.companyId, "aos imóveis");

  logger.info("saveRealEstate", {
    companyId,
    realEstateId: data.realEstateId,
  });

  return RealEstateRepository.save(companyId, uid, data);
});
