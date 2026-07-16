import { httpsCallable } from 'firebase/functions';

import type {
  FinanceAccount,
  FinanceCategory,
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

  private static listCategoriesCallable = httpsCallable<
    void,
    FinanceCategory[]
  >(functions, 'listCategoriesHandler');

  private static saveCategoryCallable = httpsCallable<
    { name: string },
    FinanceCategory
  >(functions, 'saveCategoryHandler');

  private static listAccountsCallable = httpsCallable<void, FinanceAccount[]>(
    functions,
    'listAccountsHandler',
  );

  private static saveAccountCallable = httpsCallable<
    { name: string },
    FinanceAccount
  >(functions, 'saveAccountHandler');

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

  static async listCategories(): Promise<FinanceCategory[]> {
    const r = await this.listCategoriesCallable();
    return r.data;
  }

  static async saveCategory(name: string): Promise<FinanceCategory> {
    const r = await this.saveCategoryCallable({ name });
    return r.data;
  }

  static async listAccounts(): Promise<FinanceAccount[]> {
    const r = await this.listAccountsCallable();
    return r.data;
  }

  static async saveAccount(name: string): Promise<FinanceAccount> {
    const r = await this.saveAccountCallable({ name });
    return r.data;
  }
}
