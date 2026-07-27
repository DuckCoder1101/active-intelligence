import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SavePersonalTaskDTO } from '@/models/personal-task.model';
import PersonalTaskService from '@/services/personal-task.service';

export const personalTaskKeys = {
  all: ['personal-tasks'] as const,
  list: (companyId: string) =>
    [...personalTaskKeys.all, 'list', companyId] as const,
};

export const personalTasksQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: personalTaskKeys.list(companyId),
    queryFn: () => PersonalTaskService.listPersonalTasks(companyId),
  });

export function useSavePersonalTaskMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavePersonalTaskDTO) =>
      PersonalTaskService.savePersonalTask(data, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: personalTaskKeys.list(companyId),
      });
    },
  });
}

export function useDeletePersonalTaskMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personalTaskId: string) =>
      PersonalTaskService.deletePersonalTask(personalTaskId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: personalTaskKeys.list(companyId),
      });
    },
  });
}
