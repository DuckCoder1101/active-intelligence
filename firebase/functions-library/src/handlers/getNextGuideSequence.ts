import { onCallHandler, requireAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-library" as const],
};

export const getNextGuideSequenceHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const next = await GuideRepository.peekNextSequence();
  return { next };
});
