import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SaveTaskDTO, Task } from '@/models/task.model';
import TaskService from '@/services/task.service';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
};

export const tasksQueryOptions = () =>
  queryOptions({
    queryKey: taskKeys.lists(),
    queryFn: () => TaskService.listTasks(),
  });

interface UpdateStatusVars {
  taskId: string;
  status: string;
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: UpdateStatusVars) =>
      TaskService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }: UpdateStatusVars) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.lists());
      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old) =>
        old?.map((t) => (t.taskId === taskId ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

interface SaveTaskVars {
  dto: SaveTaskDTO;
  companyId: string;
  isEditing: boolean;
  pendingFiles: File[];
}

export function useSaveTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dto, companyId, isEditing, pendingFiles }: SaveTaskVars): Promise<Task> => {
      const saved = await TaskService.saveTask(dto);

      if (isEditing || pendingFiles.length === 0) {
        return saved;
      }

      const newUrls = await Promise.all(
        pendingFiles.map((f) => TaskService.uploadImage(companyId, saved.taskId, f)),
      );
      return TaskService.saveTask({
        ...dto,
        taskId: saved.taskId,
        referenceImages: [...(dto.referenceImages ?? []), ...newUrls],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

interface UploadTaskImagesVars {
  companyId: string;
  taskId: string;
  files: File[];
}

export function useUploadTaskImagesMutation() {
  return useMutation({
    mutationFn: ({ companyId, taskId, files }: UploadTaskImagesVars) =>
      Promise.all(files.map((f) => TaskService.uploadImage(companyId, taskId, f))),
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => TaskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
