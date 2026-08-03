import { onCallHandler, requireAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-library" as const],
};

/**
 * Peeks the next sequential guide number (for naming, e.g. G-003), without allocating it.
 * Auth: `requireAccess` — minAccessLevel "admin", permission "manage-library".
 * Schema: none.
 */
export const getNextGuideSequenceHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const next = await GuideRepository.peekNextSequence();
  return { next };
});
