import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { Company, SaveCompanyDTO } from '@/models/company.model';
import CompanyService from '@/services/company.service';

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  detail: (companyId: string) =>
    [...companyKeys.all, 'detail', companyId] as const,
  auditLogs: (companyId: string) =>
    [...companyKeys.all, 'auditLogs', companyId] as const,
};

export const companiesQueryOptions = () =>
  queryOptions({
    queryKey: companyKeys.lists(),
    queryFn: () => CompanyService.listCompanies(),
  });

export const companyDetailQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.detail(companyId),
    queryFn: () => CompanyService.getCompany(companyId),
  });

export const auditLogsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.auditLogs(companyId),
    queryFn: () => CompanyService.listAuditLogs(companyId),
  });

export function useSaveCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveCompanyDTO) => CompanyService.saveCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useDeleteCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => CompanyService.deleteCompany(companyId),
    onMutate: async (companyId) => {
      await queryClient.cancelQueries({ queryKey: companyKeys.lists() });
      const previous = queryClient.getQueryData<Company[]>(companyKeys.lists());
      queryClient.setQueryData<Company[]>(companyKeys.lists(), (old) =>
        old?.filter((c) => c.companyId !== companyId),
      );
      return { previous };
    },
    onError: (_err, _companyId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(companyKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}
