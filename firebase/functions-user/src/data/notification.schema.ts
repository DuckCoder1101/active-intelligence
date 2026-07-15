import {z} from "zod";

export default class NotificationSchema {
  static markReadSchema = z.object({
    notificationId: z.string().min(1),
  });

  static registerFcmTokenSchema = z.object({
    token: z.string().min(1),
  });
}
