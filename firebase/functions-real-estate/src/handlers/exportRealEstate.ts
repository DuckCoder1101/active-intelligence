import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { RealEstateRepository } from "../repositories/real-estate.repository";

const schema = z.object({ companyId: z.string().min(1) });

/**
 * Retorna todos os imóveis da empresa para exportação (planilha).
 * Separado de `listRealEstateHandler` de propósito: a listagem da tela
 * pode vir a ser paginada no futuro, mas a exportação sempre deve trazer o
 * dataset completo, independente de como a tela estiver paginando/filtrando.
 * Auth: `requireCompanyAccess(req, companyId, "aos imóveis")`.
 */
export const exportRealEstateHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "companyId obrigatório");
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "aos imóveis");

  logger.info("exportRealEstate", { companyId });

  return RealEstateRepository.listByCompany(companyId);
});
