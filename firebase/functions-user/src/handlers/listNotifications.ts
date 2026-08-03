import {
  onCallHandler,
  requireAccess,
  NotificationRepository,
} from "functions-shared";

const ACCESS = { minAccessLevel: "user" as const };

/**
 * Lists notifications for the caller.
 * Auth: `requireAccess(req, {minAccessLevel:"user"})`.
 * Schema: none.
 */
export const listNotificationsHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);
  return NotificationRepository.listForUser(caller.uid);
});
