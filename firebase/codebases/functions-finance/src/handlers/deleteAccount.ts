import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { AccountRepository } from "../repositories/account.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  accountId: z.string().min(1, "accountId obrigatório"),
});

/**
 * Deletes a finance account.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: inline z.object({accountId}).
 */
export const deleteAccountHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("deleteAccount", { accountId: data.accountId });

  await AccountRepository.delete(data.accountId);
});
