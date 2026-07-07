import { queryOptions } from '@tanstack/react-query';

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
