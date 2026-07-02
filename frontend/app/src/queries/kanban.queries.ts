import { queryOptions } from '@tanstack/react-query';

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
