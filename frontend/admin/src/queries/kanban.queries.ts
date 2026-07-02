import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { pushSnackbarViaBridge } from '@/contexts/snackbar.bridge';
import type { KanbanColumn, SaveKanbanColumnDTO } from '@/models/kanban.model';
import KanbanService from '@/services/kanban.service';

export const kanbanKeys = {
  all: ['kanban'] as const,
  lists: () => [...kanbanKeys.all, 'list'] as const,
};

export const kanbanColumnsQueryOptions = () =>
  queryOptions({
    queryKey: kanbanKeys.lists(),
    queryFn: () => KanbanService.listColumns(),
  });

function reorder(
  columns: KanbanColumn[],
  fromId: string,
  toId: string,
): KanbanColumn[] {
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
  original: KanbanColumn[],
  reordered: KanbanColumn[],
): KanbanColumn[] {
  return reordered.filter((c) => {
    const before = original.find((o) => o.columnId === c.columnId);
    return before && before.order !== c.order;
  });
}

interface ReorderVars {
  fromId: string;
  toId: string;
}

export function useReorderColumnsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromId, toId }: ReorderVars) => {
      const current =
        queryClient.getQueryData<KanbanColumn[]>(kanbanKeys.lists()) ?? [];
      const withOrders = reorder(current, fromId, toId);
      const changed = diffOrders(current, withOrders);

      const results = await Promise.allSettled(
        changed.map((c) =>
          KanbanService.saveColumn({
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
      await queryClient.cancelQueries({ queryKey: kanbanKeys.lists() });
      const previous = queryClient.getQueryData<KanbanColumn[]>(
        kanbanKeys.lists(),
      );
      if (previous) {
        queryClient.setQueryData(
          kanbanKeys.lists(),
          reorder(previous, fromId, toId),
        );
      }
      return { previous };
    },
    onSuccess: ({ withOrders, failedIds }, _vars, context) => {
      if (failedIds.size === 0) {
        return;
      }
      pushSnackbarViaBridge({
        type: 'error',
        message: 'Algumas colunas não foram salvas. A ordem foi corrigida.',
      });
      const fallback = context?.previous;
      queryClient.setQueryData<KanbanColumn[]>(kanbanKeys.lists(), () =>
        withOrders.map((c) =>
          failedIds.has(c.columnId)
            ? (fallback?.find((o) => o.columnId === c.columnId) ?? c)
            : c,
        ),
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(kanbanKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all });
    },
  });
}

export function useAddColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveKanbanColumnDTO) => KanbanService.saveColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all });
    },
  });
}

export function useRemoveColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) => KanbanService.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all });
    },
  });
}
