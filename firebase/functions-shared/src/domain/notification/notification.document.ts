import { Timestamp } from 'firebase-admin/firestore';

export type NotificationType = 'new-client-task';

export interface NotificationDocument {
  recipientUid: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
  read: boolean;

  createdAt: Timestamp;
}
