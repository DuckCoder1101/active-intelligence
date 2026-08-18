import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { AccountRepository } from "../repositories/account.repository";
import { ACCOUNT_TYPES, HOLDER_DOCUMENT_TYPES } from "../types/account.document";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const optionalString = z
  .string()
  .nullish()
  .transform((v) => v?.trim() || undefined);

const schema = z.object({
  accountId: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  name: z
    .string()
    .trim()
    .min(1, "Nome obrigatório")
    .max(60, "Máximo 60 caracteres"),
  bankCode: optionalString,
  bankName: optionalString,
  agency: optionalString,
  agencyDigit: optionalString,
  accountNumber: optionalString,
  accountDigit: optionalString,
  accountType: z
    .enum(ACCOUNT_TYPES, { message: "Tipo de conta inválido" })
    .nullish()
    .transform((v) => v ?? undefined),
  holderName: optionalString,
  holderDocumentType: z
    .enum(HOLDER_DOCUMENT_TYPES, { message: "Tipo de documento inválido" })
    .nullish()
    .transform((v) => v ?? undefined),
  holderDocument: optionalString,
  pixKey: optionalString,
  asaasWalletId: optionalString,
});

/**
 * Creates/updates a finance account.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: inline z.object({accountId?, name}).
 */
export const saveAccountHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveAccount", {
    action: data.accountId ? "update" : "create",
    accountId: data.accountId,
  });

  return AccountRepository.save(data);
});
