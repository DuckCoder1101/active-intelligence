import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SaveTransactionDTO } from '@/models/finance.model';
import FinanceService from '@/services/finance.service';

export const financeKeys = {
  transactions: ['finance-transactions'] as const,
  categories: ['finance-categories'] as const,
  accounts: ['finance-accounts'] as const,
};

export const transactionsQueryOptions = () =>
  queryOptions({
    queryKey: financeKeys.transactions,
    queryFn: () => FinanceService.listTransactions(),
  });

export const financeCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: financeKeys.categories,
    queryFn: () => FinanceService.listCategories(),
  });

export const financeAccountsQueryOptions = () =>
  queryOptions({
    queryKey: financeKeys.accounts,
    queryFn: () => FinanceService.listAccounts(),
  });

export function useSaveTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SaveTransactionDTO) =>
      FinanceService.saveTransaction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions });
    },
  });
}

export function useMarkTransactionPaidMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      FinanceService.markTransactionPaid(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      FinanceService.deleteTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions });
    },
  });
}

export function useSaveFinanceCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => FinanceService.saveCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories });
    },
  });
}

export function useSaveFinanceAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => FinanceService.saveAccount(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts });
    },
  });
}
