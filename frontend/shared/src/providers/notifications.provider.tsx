import { useQueryClient } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, type ReactNode } from 'react';

import { useAuth } from '@/contexts/auth.context';
import { NotificationsContext } from '@/contexts/notifications.context';
import {
  notificationKeys,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from '@/queries/notification.queries';

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { claims } = useAuth();
  const queryClient = useQueryClient();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith('/auth');

  const enabled = !!claims && !isAuthRoute;

  const { data: notifications = [] } = useNotificationsQuery(enabled);
  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery(enabled);
  const markAsReadMutation = useMarkNotificationReadMutation();

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Rede de segurança: se a contagem mudar (ex: um push foi perdido), busca a lista de novo.
  const previousUnreadCount = useRef(unreadCount);
  useEffect(() => {
    if (previousUnreadCount.current !== unreadCount) {
      previousUnreadCount.current = unreadCount;
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    }
  }, [unreadCount, queryClient]);

  return (
    <NotificationsContext.Provider
      value={{ markAsRead, notifications, unreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
