import { httpsCallable } from 'firebase/functions';

import type {
  FinanceAccount,
  FinanceSubcategory,
  SaveFinanceAccountDTO,
  SaveFinanceSubcategoryDTO,
  SaveTransactionDTO,
  Transaction,
} from '@/models/finance.model';
import { functions } from '@/utils/firebase.util';

function withDerivedStatus(transaction: Transaction): Transaction {
  if (transaction.status === 'previsto' && transaction.dueDate < Date.now()) {
    return { ...transaction, status: 'atrasado' };
  }
  return transaction;
}

export default class FinanceService {
  private static listTransactionsCallable = httpsCallable<
    void,
    Transaction[]
  >(functions, 'listTransactionsHandler');

  private static saveTransactionCallable = httpsCallable<
    SaveTransactionDTO,
    Transaction
  >(functions, 'saveTransactionHandler');

  private static markTransactionPaidCallable = httpsCallable<
    { transactionId: string; paidDate: number },
    Transaction
  >(functions, 'markTransactionPaidHandler');

  private static deleteTransactionCallable = httpsCallable<
    { transactionId: string },
    Transaction
  >(functions, 'deleteTransactionHandler');

  private static listSubcategoriesCallable = httpsCallable<
    void,
    FinanceSubcategory[]
  >(functions, 'listSubcategoriesHandler');

  private static saveSubcategoryCallable = httpsCallable<
    SaveFinanceSubcategoryDTO,
    FinanceSubcategory
  >(functions, 'saveSubcategoryHandler');

  private static deleteSubcategoryCallable = httpsCallable<
    { subcategoryId: string },
    void
  >(functions, 'deleteSubcategoryHandler');

  private static listAccountsCallable = httpsCallable<void, FinanceAccount[]>(
    functions,
    'listAccountsHandler',
  );

  private static saveAccountCallable = httpsCallable<
    SaveFinanceAccountDTO,
    FinanceAccount
  >(functions, 'saveAccountHandler');

  private static deleteAccountCallable = httpsCallable<
    { accountId: string },
    void
  >(functions, 'deleteAccountHandler');

  static async listTransactions(): Promise<Transaction[]> {
    const r = await this.listTransactionsCallable();
    return r.data.map(withDerivedStatus);
  }

  static async saveTransaction(dto: SaveTransactionDTO): Promise<Transaction> {
    const r = await this.saveTransactionCallable(dto);
    return withDerivedStatus(r.data);
  }

  static async markTransactionPaid(transactionId: string): Promise<Transaction> {
    const r = await this.markTransactionPaidCallable({
      transactionId,
      paidDate: Date.now(),
    });
    return withDerivedStatus(r.data);
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    await this.deleteTransactionCallable({ transactionId });
  }

  static async listSubcategories(): Promise<FinanceSubcategory[]> {
    const r = await this.listSubcategoriesCallable();
    return r.data;
  }

  static async saveSubcategory(
    dto: SaveFinanceSubcategoryDTO,
  ): Promise<FinanceSubcategory> {
    const r = await this.saveSubcategoryCallable(dto);
    return r.data;
  }

  static async deleteSubcategory(subcategoryId: string): Promise<void> {
    await this.deleteSubcategoryCallable({ subcategoryId });
  }

  static async listAccounts(): Promise<FinanceAccount[]> {
    const r = await this.listAccountsCallable();
    return r.data;
  }

  static async saveAccount(dto: SaveFinanceAccountDTO): Promise<FinanceAccount> {
    const r = await this.saveAccountCallable(dto);
    return r.data;
  }

  static async deleteAccount(accountId: string): Promise<void> {
    await this.deleteAccountCallable({ accountId });
  }
}
