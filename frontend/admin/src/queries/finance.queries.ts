import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  SaveFinanceAccountDTO,
  SaveFinanceSubcategoryDTO,
  SaveTransactionDTO,
} from '@/models/finance.model';
import FinanceService from '@/services/finance.service';

export const financeKeys = {
  transactions: ['finance-transactions'] as const,
  subcategories: ['finance-subcategories'] as const,
  accounts: ['finance-accounts'] as const,
};

export const transactionsQueryOptions = () =>
  queryOptions({
    queryKey: financeKeys.transactions,
    queryFn: () => FinanceService.listTransactions(),
  });

export const financeSubcategoriesQueryOptions = () =>
  queryOptions({
    queryKey: financeKeys.subcategories,
    queryFn: () => FinanceService.listSubcategories(),
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

export function useSaveFinanceSubcategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SaveFinanceSubcategoryDTO) =>
      FinanceService.saveSubcategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.subcategories });
    },
  });
}

export function useDeleteFinanceSubcategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcategoryId: string) =>
      FinanceService.deleteSubcategory(subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.subcategories });
    },
  });
}

export function useSaveFinanceAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SaveFinanceAccountDTO) => FinanceService.saveAccount(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts });
    },
  });
}

export function useDeleteFinanceAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => FinanceService.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts });
    },
  });
}
