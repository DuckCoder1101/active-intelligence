import { httpsCallable } from 'firebase/functions';

import type { Notification } from '@/models/notification.model';
import { functions } from '@/utils/firebase.util';

export default class NotificationService {
  private static listCallable = httpsCallable<void, Notification[]>(
    functions,
    'listNotificationsHandler',
  );

  private static markReadCallable = httpsCallable<
    { notificationId: string },
    boolean
  >(functions, 'markNotificationReadHandler');

  static async listNotifications(): Promise<Notification[]> {
    const r = await this.listCallable();
    return r.data;
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    await this.markReadCallable({ notificationId });
  }
}
