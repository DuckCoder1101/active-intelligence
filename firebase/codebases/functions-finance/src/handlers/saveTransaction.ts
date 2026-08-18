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
import type { TransactionDTO } from "../types/transaction.dto";

/**
 * Adds `months` calendar months to a millis timestamp, clamping the day to the
 * target month's last valid day (e.g. Jan 31 + 1 month -> Feb 28, not Mar 3).
 */
function addMonths(millis: number, months: number): number {
  const d = new Date(millis);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return d.getTime();
}

/** Splits `amount` (in currency units) into `count` integer-cent shares, remainder on the last share. */
function splitAmount(amount: number, count: number): number[] {
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / count);
  const shares = new Array<number>(count).fill(baseCents / 100);
  shares[count - 1] = (totalCents - baseCents * (count - 1)) / 100;
  return shares;
}

/** Recurring occurrence count: to `recurrenceEndDate` if given (capped at 24, same as parcelado), else a 12-month default horizon. */
function computeRecurringCount(dueDate: number, endDate?: number): number {
  if (!endDate) {
    return 12;
  }
  const d1 = new Date(dueDate);
  const d2 = new Date(endDate);
  const months =
    (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12 +
    (d2.getUTCMonth() - d1.getUTCMonth()) +
    1;
  return Math.min(24, Math.max(1, months));
}

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

/**
 * Creates/updates a financial transaction, enriching with account/subcategory/company data.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: ../data/transaction.schema -> TransactionSchema.saveSchema.
 * Note: cross-repository enrichment (calls AccountRepository, SubcategoryRepository, CompanyRepository)
 * before calling TransactionRepository.save.
 */
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

  const base = {
    type: data.type,
    category: data.category,
    subcategoryId: subcategory?.subcategoryId,
    subcategoryName: subcategory?.name,
    companyId: company?.companyId,
    // Sem `companyId`, `companyName` vira um rótulo livre de cliente/projeto (não vinculado a uma empresa cadastrada).
    companyName: company?.displayName ?? data.companyName,
    paymentMethod: data.paymentMethod,
    accountId: account.accountId,
    accountName: account.name,
    description: data.description,
    createdBy: caller.uid,
    origin: data.origin,
  };

  const isInstallmentPurchase =
    !data.transactionId && (data.installments ?? 1) > 1;
  const isRecurringPurchase = !data.transactionId && data.isRecurring === true;

  if (isInstallmentPurchase || isRecurringPurchase) {
    const installmentTotal = isInstallmentPurchase
      ? data.installments!
      : computeRecurringCount(data.dueDate, data.recurrenceEndDate);
    // Parcelado divide o valor total entre as parcelas; recorrente repete o
    // mesmo valor todo mês (é uma mensalidade, não um total a fracionar).
    const amounts = isInstallmentPurchase
      ? splitAmount(data.amount, installmentTotal)
      : new Array<number>(installmentTotal).fill(data.amount);
    const groupId = TransactionRepository.col.doc().id;

    const transactions: TransactionDTO[] = [];
    for (let i = 0; i < installmentTotal; i++) {
      transactions.push(
        await TransactionRepository.save({
          ...base,
          amount: amounts[i],
          dueDate: addMonths(data.dueDate, i),
          accrualDate: addMonths(data.accrualDate, i),
          groupId,
          installmentIndex: i + 1,
          installmentTotal,
          isRecurring: isRecurringPurchase || undefined,
        }),
      );
    }

    logger.info("saveTransaction: parcelamento/recorrência concluído", {
      groupId,
      installmentTotal,
      isRecurring: isRecurringPurchase,
    });

    return transactions;
  }

  const transaction = await TransactionRepository.save({
    ...base,
    transactionId: data.transactionId,
    amount: data.amount,
    dueDate: data.dueDate,
    accrualDate: data.accrualDate,
    installmentIndex: data.installmentIndex,
  });

  logger.info("saveTransaction: concluído", {
    transactionId: transaction.transactionId,
  });

  return transaction;
});
