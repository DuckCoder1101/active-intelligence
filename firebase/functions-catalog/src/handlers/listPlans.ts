import { onCallHandler, requireAccess } from "functions-shared";
import { PlanRepository } from "../repositories/plan.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-catalog" as const],
};

/**
 * Lists all catalog plans.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-catalog"]}).
 * Schema: none.
 */
export const listPlansHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return PlanRepository.listAll();
});
