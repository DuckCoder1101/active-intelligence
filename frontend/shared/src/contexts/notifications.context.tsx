import { createContext, useContext } from 'react';

import type { Notification } from '@/models/notification.model';

export interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
}

export const NotificationsContext =
  createContext<NotificationsContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);

  if (!ctx) {
    throw new Error(
      'useNotifications must be used within NotificationsContext',
    );
  }

  return ctx;
}
