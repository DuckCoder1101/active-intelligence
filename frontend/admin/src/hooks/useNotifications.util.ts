import { useEffect, useMemo, useRef } from 'react';

import { useAuth } from '@/contexts/auth.context';
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/queries/notification.queries';

export function useNotifications() {
  const { claims } = useAuth();

  const canView =
    claims?.accessLevel === 'owner' ||
    (claims &&
      'permissions' in claims &&
      (claims.permissions?.includes('manage-projects') ?? false));

  const { data: notifications = [] } = useNotificationsQuery(!!canView);
  const markRead = useMarkNotificationReadMutation();

  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (
      !canView ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'default'
    ) {
      return;
    }
    Notification.requestPermission();
  }, [canView]);

  useEffect(() => {
    if (!canView) {return;}

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.notificationId));
      return;
    }

    const newOnes = notifications.filter(
      (n) => !seenIds.current!.has(n.notificationId),
    );

    for (const notification of newOnes) {
      seenIds.current.add(notification.notificationId);
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Guará', { body: notification.message });
      }
    }
  }, [canView, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return {
    canView: !!canView,
    notifications,
    unreadCount,
    markAsRead: (notificationId: string) => markRead.mutate(notificationId),
  };
}
