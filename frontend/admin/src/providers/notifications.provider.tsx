import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '@/contexts/auth.context';
import { NotificationsContext } from '@/contexts/notifications.context';
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/queries/notification.queries';

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { claims } = useAuth();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith('/auth');

  const canView =
    claims?.accessLevel === 'owner' ||
    (claims?.accessLevel === 'admin' &&
      !!claims.permissions?.includes('manage-projects'));

  const { data: notifications = [] } = useNotificationsQuery(
    !!claims && !isAuthRoute,
  );
  const markAsReadMutation = useMarkNotificationReadMutation();

  const deliveredIds = useRef<Set<string>>(new Set());

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const toDeliver = notifications.filter(
      (n) => !deliveredIds.current.has(n.notificationId),
    );

    if (toDeliver.length === 0) {
      return;
    }

    for (const notification of toDeliver) {
      deliveredIds.current.add(notification.notificationId);

      toast.info(notification.message);

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Guará', {
          body: notification.message,
        });
      }
    }
  }, [notifications]);

  const unreadCount = notifications.length;

  return (
    <NotificationsContext.Provider
      value={{ markAsRead, notifications, unreadCount, canView }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
