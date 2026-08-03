import { onCallHandler, requireAccess } from "functions-shared";
import { AccountRepository } from "../repositories/account.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

/**
 * Lists finance accounts.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: none.
 */
export const listAccountsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return AccountRepository.listAll();
});
