import {
  onCallHandler,
  requireAccess,
  NotificationRepository,
} from "functions-shared";

const ACCESS = { minAccessLevel: "user" as const };

/**
 * Gets the count of unread notifications for the caller.
 * Auth: `requireAccess(req, {minAccessLevel:"user"})`.
 * Schema: none.
 */
export const getUnreadNotificationCountHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);
  const count = await NotificationRepository.countForUser(caller.uid);
  return { count };
});
