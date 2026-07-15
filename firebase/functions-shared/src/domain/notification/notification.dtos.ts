import type {NotificationType} from "./notification.document";
import type {
  AdminPermission,
  UserAccessLevel,
} from "../../types/accessLevel.type";

export interface NotificationDTO {
  notificationId: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
  createdAt: number;
}

export interface NotificationContentDTO {
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;
}

export interface NotificationFilterDTO {
  uids?: string[];
  accessLevel?: UserAccessLevel;
  permission?: AdminPermission;
  companyId?: string;
}
