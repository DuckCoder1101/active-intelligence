export type NotificationType = 'new-client-task';

export interface Notification {
  notificationId: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
  createdAt: number;
}
