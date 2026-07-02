import z from 'zod';
import { AdminAccessLevels, ADMIN_PERMISSIONS } from 'functions-shared';

export default class AdminSchema {
  static updateAccessLevelSchema = z.object({
    targetUid: z.string().min(1),
    newAccessLevel: z.enum(AdminAccessLevels),
  });

  static updatePermissionsSchema = z.object({
    targetUid: z.string().min(1),
    permissions: z.array(z.enum(ADMIN_PERMISSIONS)),
  });

  static inviteAdminSchema = z.object({
    email: z.string().email('E-mail inválido!'),
  });

  static markNotificationReadSchema = z.object({
    notificationId: z.string().min(1),
  });
}
