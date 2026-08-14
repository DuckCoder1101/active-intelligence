import { httpsCallable } from 'firebase/functions';

import type {
  AsaasSettings,
  CompanyContractSummary,
  FinanceAccount,
  FinanceSubcategory,
  SaveAsaasSettingsDTO,
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
    Transaction | Transaction[]
  >(functions, 'saveTransactionHandler');

  private static markTransactionPaidCallable = httpsCallable<
    { transactionId: string; paidDate: number },
    Transaction
  >(functions, 'markTransactionPaidHandler');

  private static unmarkTransactionPaidCallable = httpsCallable<
    { transactionId: string },
    Transaction
  >(functions, 'unmarkTransactionPaidHandler');

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

  private static getAsaasSettingsCallable = httpsCallable<
    void,
    AsaasSettings
  >(functions, 'getAsaasSettingsHandler');

  private static saveAsaasSettingsCallable = httpsCallable<
    SaveAsaasSettingsDTO,
    AsaasSettings
  >(functions, 'saveAsaasSettingsHandler');

  private static getCompanyContractSummaryCallable = httpsCallable<
    { companyId: string },
    CompanyContractSummary
  >(functions, 'getCompanyContractSummaryHandler');

  static async listTransactions(): Promise<Transaction[]> {
    const r = await this.listTransactionsCallable();
    return r.data.map(withDerivedStatus);
  }

  static async saveTransaction(
    dto: SaveTransactionDTO,
  ): Promise<Transaction | Transaction[]> {
    const r = await this.saveTransactionCallable(dto);
    return Array.isArray(r.data)
      ? r.data.map(withDerivedStatus)
      : withDerivedStatus(r.data);
  }

  static async markTransactionPaid(
    transactionId: string,
    paidDate: number = Date.now(),
  ): Promise<Transaction> {
    const r = await this.markTransactionPaidCallable({ transactionId, paidDate });
    return withDerivedStatus(r.data);
  }

  static async unmarkTransactionPaid(transactionId: string): Promise<Transaction> {
    const r = await this.unmarkTransactionPaidCallable({ transactionId });
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

  static async getAsaasSettings(): Promise<AsaasSettings> {
    const r = await this.getAsaasSettingsCallable();
    return r.data;
  }

  static async saveAsaasSettings(
    dto: SaveAsaasSettingsDTO,
  ): Promise<AsaasSettings> {
    const r = await this.saveAsaasSettingsCallable(dto);
    return r.data;
  }

  static async getCompanyContractSummary(
    companyId: string,
  ): Promise<CompanyContractSummary> {
    const r = await this.getCompanyContractSummaryCallable({ companyId });
    return r.data;
  }
}
