import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';

import type {
  AdminTasksBoardColumn,
  SaveAdminTasksBoardColumnDTO,
} from '@/models/admin-tasks-board.model';
import AdminTasksBoardService from '@/services/admin-tasks-board.service';

export const adminTasksBoardKeys = {
  all: ['admin-tasks-board'] as const,
  lists: () => [...adminTasksBoardKeys.all, 'list'] as const,
};

export const adminTasksBoardColumnsQueryOptions = () =>
  queryOptions({
    queryKey: adminTasksBoardKeys.lists(),
    queryFn: () => AdminTasksBoardService.listColumns(),
    staleTime: 10 * 60_000,
  });

function reorder(
  columns: AdminTasksBoardColumn[],
  fromId: string,
  toId: string,
): AdminTasksBoardColumn[] {
  const fromIndex = columns.findIndex((c) => c.columnId === fromId);
  const toIndex = columns.findIndex((c) => c.columnId === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return columns;
  }
  const reordered = [...columns];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered.map((c, i) => ({ ...c, order: i }));
}

function diffOrders(
  original: AdminTasksBoardColumn[],
  reordered: AdminTasksBoardColumn[],
): AdminTasksBoardColumn[] {
  return reordered.filter((c) => {
    const before = original.find((o) => o.columnId === c.columnId);
    return before && before.order !== c.order;
  });
}

interface ReorderVars {
  fromId: string;
  toId: string;
}

export function useReorderAdminTasksBoardColumnsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromId, toId }: ReorderVars) => {
      const current =
        queryClient.getQueryData<AdminTasksBoardColumn[]>(
          adminTasksBoardKeys.lists(),
        ) ?? [];
      const withOrders = reorder(current, fromId, toId);
      const changed = diffOrders(current, withOrders);

      const results = await Promise.allSettled(
        changed.map((c) =>
          AdminTasksBoardService.saveColumn({
            columnId: c.columnId,
            name: c.name,
            color: c.color,
            order: c.order,
          }),
        ),
      );

      const failedIds = new Set(
        changed
          .filter((_c, i) => results[i].status === 'rejected')
          .map((c) => c.columnId),
      );

      return { withOrders, failedIds };
    },
    onMutate: async ({ fromId, toId }: ReorderVars) => {
      await queryClient.cancelQueries({
        queryKey: adminTasksBoardKeys.lists(),
      });
      const previous = queryClient.getQueryData<AdminTasksBoardColumn[]>(
        adminTasksBoardKeys.lists(),
      );
      if (previous) {
        queryClient.setQueryData(
          adminTasksBoardKeys.lists(),
          reorder(previous, fromId, toId),
        );
      }
      return { previous };
    },
    onSuccess: ({ withOrders, failedIds }, _vars, context) => {
      if (failedIds.size === 0) {
        return;
      }
      toast.error('Algumas colunas não foram salvas. A ordem foi corrigida.');
      const fallback = context?.previous;
      queryClient.setQueryData<AdminTasksBoardColumn[]>(
        adminTasksBoardKeys.lists(),
        () =>
          withOrders.map((c) =>
            failedIds.has(c.columnId)
              ? (fallback?.find((o) => o.columnId === c.columnId) ?? c)
              : c,
          ),
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          adminTasksBoardKeys.lists(),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminTasksBoardKeys.all });
    },
  });
}

export function useAddAdminTasksBoardColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveAdminTasksBoardColumnDTO) =>
      AdminTasksBoardService.saveColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTasksBoardKeys.all });
    },
  });
}

export function useRemoveAdminTasksBoardColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      AdminTasksBoardService.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTasksBoardKeys.all });
    },
  });
}
