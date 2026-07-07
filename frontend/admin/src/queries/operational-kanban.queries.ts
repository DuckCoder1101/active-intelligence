import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';

import type {
  OperationalKanbanColumn,
  SaveOperationalKanbanColumnDTO,
} from '@/models/operational-kanban.model';
import OperationalKanbanService from '@/services/operational-kanban.service';

export const operationalKanbanKeys = {
  all: ['operational-kanban'] as const,
  lists: () => [...operationalKanbanKeys.all, 'list'] as const,
};

export const operationalKanbanColumnsQueryOptions = () =>
  queryOptions({
    queryKey: operationalKanbanKeys.lists(),
    queryFn: () => OperationalKanbanService.listColumns(),
  });

function reorder(
  columns: OperationalKanbanColumn[],
  fromId: string,
  toId: string,
): OperationalKanbanColumn[] {
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
  original: OperationalKanbanColumn[],
  reordered: OperationalKanbanColumn[],
): OperationalKanbanColumn[] {
  return reordered.filter((c) => {
    const before = original.find((o) => o.columnId === c.columnId);
    return before && before.order !== c.order;
  });
}

interface ReorderVars {
  fromId: string;
  toId: string;
}

export function useReorderOperationalKanbanColumnsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromId, toId }: ReorderVars) => {
      const current =
        queryClient.getQueryData<OperationalKanbanColumn[]>(
          operationalKanbanKeys.lists(),
        ) ?? [];
      const withOrders = reorder(current, fromId, toId);
      const changed = diffOrders(current, withOrders);

      const results = await Promise.allSettled(
        changed.map((c) =>
          OperationalKanbanService.saveColumn({
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
        queryKey: operationalKanbanKeys.lists(),
      });
      const previous = queryClient.getQueryData<OperationalKanbanColumn[]>(
        operationalKanbanKeys.lists(),
      );
      if (previous) {
        queryClient.setQueryData(
          operationalKanbanKeys.lists(),
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
      queryClient.setQueryData<OperationalKanbanColumn[]>(
        operationalKanbanKeys.lists(),
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
          operationalKanbanKeys.lists(),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: operationalKanbanKeys.all });
    },
  });
}

export function useAddOperationalKanbanColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveOperationalKanbanColumnDTO) =>
      OperationalKanbanService.saveColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationalKanbanKeys.all });
    },
  });
}

export function useRemoveOperationalKanbanColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      OperationalKanbanService.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationalKanbanKeys.all });
    },
  });
}
