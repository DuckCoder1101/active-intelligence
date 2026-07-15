import {
  onCallHandler,
  requireAccess,
  NotificationRepository,
} from "functions-shared";

const ACCESS = { minAccessLevel: "user" as const };

export const getUnreadNotificationCountHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);
  const count = await NotificationRepository.countForUser(caller.uid);
  return { count };
});
