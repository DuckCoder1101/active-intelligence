import {
  onCallHandler,
  requireAccess,
  NotificationRepository,
} from "functions-shared";

const ACCESS = {minAccessLevel: "user" as const};

export const listNotificationsHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);
  return NotificationRepository.listForUser(caller.uid);
});
