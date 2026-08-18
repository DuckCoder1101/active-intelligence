import { onCallHandler, requireAccess } from "functions-shared";
import { PlanRepository } from "../repositories/plan.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-plans" as const],
};

/**
 * Lists all plans.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-plans"]}).
 * Schema: none.
 */
export const listPlansHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return PlanRepository.listAll();
});
