import type { NotificationType } from './notification.document';

export interface NotificationDTO {
  notificationId: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
  read: boolean;
  createdAt: number;
}

export interface NotifyAdminsDTO {
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
}
