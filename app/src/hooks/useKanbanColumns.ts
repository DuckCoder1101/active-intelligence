import { useState, useEffect, useCallback, useRef } from 'react';

import { useHandleError } from '@/hooks/useHandleError.util';
import KanbanService from '@/services/kanban.service';
import type { KanbanColumn, SaveKanbanColumnDTO } from '@/models/kanban.model';

export function useKanbanColumns() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    KanbanService.listColumns()
      .then(setColumns)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addColumn = async (
    data: SaveKanbanColumnDTO,
  ): Promise<KanbanColumn> => {
    const col = await KanbanService.saveColumn(data);
    setColumns((prev) => [...prev, col].sort((a, b) => a.order - b.order));
    return col;
  };

  const removeColumn = async (
    columnId: string,
    onTasksMoved?: (to: string | null) => void,
  ) => {
    const result = await KanbanService.deleteColumn(columnId);
    setColumns((prev) => prev.filter((c) => c.columnId !== columnId));
    onTasksMoved?.(result.movedTo);
  };

  const reorderColumns = async (fromId: string, toId: string) => {
    const prev = [...columns];
    const fromIndex = prev.findIndex((c) => c.columnId === fromId);
    const toIndex = prev.findIndex((c) => c.columnId === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reordered = [...prev];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const withOrders = reordered.map((c, i) => ({ ...c, order: i }));
    setColumns(withOrders);

    const changed = withOrders.filter((c) => {
      const original = prev.find((o) => o.columnId === c.columnId);
      return original && original.order !== c.order;
    });
    await Promise.all(
      changed.map((c) =>
        KanbanService.saveColumn({
          columnId: c.columnId,
          name: c.name,
          color: c.color,
          order: c.order,
        }),
      ),
    );
  };

  return {
    columns,
    isLoading,
    addColumn,
    removeColumn,
    reorderColumns,
    refresh: load,
  };
}
