import { queryOptions } from '@tanstack/react-query';

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
