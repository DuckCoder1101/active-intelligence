import { onCallHandler, requireAccess } from "functions-shared";
import { TransactionRepository } from "../repositories/transaction.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

/**
 * Lists financial transactions.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: none.
 */
export const listTransactionsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return TransactionRepository.listAll();
});
