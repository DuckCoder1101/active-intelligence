import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess } from "functions-shared";
import TransactionSchema from "../data/transaction.schema";
import { TransactionRepository } from "../repositories/transaction.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

/**
 * Reverts a transaction to "previsto", clearing `paidDate`.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: ../data/transaction.schema -> TransactionSchema.unmarkPaidSchema.
 */
export const unmarkTransactionPaidHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = TransactionSchema.unmarkPaidSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("unmarkTransactionPaid", { transactionId: data.transactionId });

  return TransactionRepository.unmarkPaid(data.transactionId);
});
