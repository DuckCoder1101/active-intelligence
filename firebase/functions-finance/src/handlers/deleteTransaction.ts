import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";

import {onCallHandler, requireAccess} from "functions-shared";
import TransactionSchema from "../data/transaction.schema";
import {TransactionRepository} from "../repositories/transaction.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

export const deleteTransactionHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = TransactionSchema.deleteSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("deleteTransaction", {transactionId: data.transactionId});

  return TransactionRepository.delete(data.transactionId);
});
