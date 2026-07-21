import { onCallHandler, requireAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-library" as const],
};

export const listGuidesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return GuideRepository.listAll();
});
