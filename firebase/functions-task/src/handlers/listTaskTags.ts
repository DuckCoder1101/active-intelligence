import { onCallHandler, requireAccess } from "functions-shared";
import { TaskTagRepository } from "../repositories/task-tag.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

/**
 * Lists task tags.
 * Auth: `requireAccess(req, {minAccessLevel:"admin", permissions:["manage-settings"]})`.
 * Schema: none.
 */
export const listTaskTagsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return TaskTagRepository.listAll();
});
