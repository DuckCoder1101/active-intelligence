import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Notification } from '@/models/notification.model';
import NotificationService from '@/services/notification.service';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

const UNREAD_COUNT_POLL_INTERVAL_MS = 120_000;

export function useNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: () => NotificationService.listNotifications(),
    enabled,
  });
}

export function useUnreadNotificationCountQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => NotificationService.getUnreadCount(),
    refetchInterval: UNREAD_COUNT_POLL_INTERVAL_MS,
    enabled,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.markNotificationRead(notificationId),

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });

      const previous = queryClient.getQueryData<Notification[]>(
        notificationKeys.lists(),
      );

      queryClient.setQueryData<Notification[]>(
        notificationKeys.lists(),
        (old) =>
          old?.map((n) =>
            n.notificationId === notificationId
              ? {
                  ...n,
                  read: true,
                }
              : n,
          ),
      );

      return {
        previous,
      };
    },

    onError: (_err, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.lists(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
