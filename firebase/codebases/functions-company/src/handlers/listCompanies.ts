import { logger } from "firebase-functions";

import {
  onCallHandler,
  CompanyRepository,
  requireAccess,
} from "functions-shared";

const ACCESS = {
  minAccessLevel: "admin" as const,
};

/**
 * Lists all companies.
 * Auth: `requireAccess` — minAccessLevel "admin".
 * Schema: none.
 */
export const listCompaniesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await CompanyRepository.getAllCompanies();
  logger.info("listCompanies: retornando N itens", { count: result.length });
  return result;
});
