import { queryOptions, useMutation } from '@tanstack/react-query';

import type { CreateClientTaskDTO, Task } from '@/models/task.model';
import TaskService from '@/services/task.service';

export const taskKeys = {
  all: ['tasks'] as const,
  calendar: (companyId: string | undefined, year: number, month: number) =>
    [...taskKeys.all, 'calendar', companyId, year, month] as const,
  client: (companyId: string | undefined) =>
    [...taskKeys.all, 'client', companyId] as const,
};

export const calendarTasksQueryOptions = (
  companyId: string | undefined,
  year: number,
  month: number,
) =>
  queryOptions({
    queryKey: taskKeys.calendar(companyId, year, month),
    queryFn: () => TaskService.listCalendarTasks(year, month, companyId),
  });

export const clientTasksQueryOptions = (companyId: string | undefined) =>
  queryOptions({
    queryKey: taskKeys.client(companyId),
    queryFn: () => TaskService.listClientTasks(companyId),
  });

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

interface CreateClientTaskVars {
  dto: CreateClientTaskDTO;
  companyId: string;
  pendingFiles: File[];
}

interface ApproveClientTaskVars {
  taskId: string;
  actorName?: string;
}

export function useApproveClientTaskMutation() {
  return useMutation({
    mutationFn: ({ taskId, actorName }: ApproveClientTaskVars) =>
      TaskService.approveClientTask(taskId, actorName),
  });
}

export function useCreateClientTaskMutation() {
  return useMutation({
    mutationFn: async ({ dto, companyId, pendingFiles }: CreateClientTaskVars): Promise<Task> => {
      const created = await TaskService.createClientTask(dto);

      if (pendingFiles.length === 0) {
        return created;
      }

      const urls = await Promise.all(
        pendingFiles.map((f) => TaskService.uploadImage(companyId, created.taskId, f)),
      );
      await TaskService.updateClientTaskImages(created.taskId, urls);
      return { ...created, referenceImages: urls };
    },
  });
}
