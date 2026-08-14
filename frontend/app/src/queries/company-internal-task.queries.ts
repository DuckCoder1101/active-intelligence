import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SaveCompanyInternalTaskDTO } from '@/models/company-internal-task.model';
import CompanyInternalTaskService from '@/services/company-internal-task.service';

export const companyInternalTaskKeys = {
  all: ['company-internal-tasks'] as const,
  list: (companyId: string) =>
    [...companyInternalTaskKeys.all, 'list', companyId] as const,
};

export const companyInternalTasksQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyInternalTaskKeys.list(companyId),
    queryFn: () => CompanyInternalTaskService.listCompanyInternalTasks(companyId),
  });

export function useSaveCompanyInternalTaskMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveCompanyInternalTaskDTO) =>
      CompanyInternalTaskService.saveCompanyInternalTask(data, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyInternalTaskKeys.list(companyId),
      });
    },
  });
}

export function useDeleteCompanyInternalTaskMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyInternalTaskId: string) =>
      CompanyInternalTaskService.deleteCompanyInternalTask(
        companyInternalTaskId,
        companyId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyInternalTaskKeys.list(companyId),
      });
    },
  });
}
