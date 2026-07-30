import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  CompanyRepository,
  onCallHandler,
  requireAccess,
} from "functions-shared";
import TransactionSchema from "../data/transaction.schema";
import { AccountRepository } from "../repositories/account.repository";
import { SubcategoryRepository } from "../repositories/subcategory.repository";
import { TransactionRepository } from "../repositories/transaction.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

export const saveTransactionHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = TransactionSchema.saveSchema.safeParse(
    req.data,
  );
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const [subcategory, account, company] = await Promise.all([
    data.subcategoryId ?
      SubcategoryRepository.getById(data.subcategoryId) :
      Promise.resolve(undefined),
    AccountRepository.getById(data.accountId),
    data.companyId ?
      CompanyRepository.getCompanyResumeById(data.companyId) :
      Promise.resolve(undefined),
  ]);

  if (subcategory && subcategory.categoryType !== data.category) {
    throw new HttpsError(
      "invalid-argument",
      "Subcategoria não pertence à categoria selecionada.",
    );
  }

  logger.info("saveTransaction", {
    action: data.transactionId ? "update" : "create",
    transactionId: data.transactionId,
  });

  const transaction = await TransactionRepository.save({
    transactionId: data.transactionId,
    type: data.type,
    category: data.category,
    subcategoryId: subcategory?.subcategoryId,
    subcategoryName: subcategory?.name,
    companyId: company?.companyId,
    companyName: company?.displayName,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    accountId: account.accountId,
    accountName: account.name,
    dueDate: data.dueDate,
    description: data.description,
    createdBy: caller.uid,
  });

  logger.info("saveTransaction: concluído", {
    transactionId: transaction.transactionId,
  });

  return transaction;
});
