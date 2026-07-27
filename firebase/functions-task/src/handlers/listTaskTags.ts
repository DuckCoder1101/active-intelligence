import { onCallHandler, requireAccess } from "functions-shared";
import { TaskTagRepository } from "../repositories/task-tag.repository";

const ACCESS = { minAccessLevel: "admin" as const };

export const listTaskTagsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return TaskTagRepository.listAll();
});
