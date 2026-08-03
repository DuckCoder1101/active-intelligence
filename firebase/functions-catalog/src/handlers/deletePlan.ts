import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import PlanSchema from "../data/plan.schema";
import { PlanRepository } from "../repositories/plan.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-catalog" as const],
};

/**
 * Deletes a catalog plan.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-catalog"]}).
 * Schema: ../data/plan.schema -> PlanSchema.deleteSchema.
 */
export const deletePlanHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = PlanSchema.deleteSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("deletePlan", { planId: data.planId });

  await PlanRepository.delete(data.planId);
});
