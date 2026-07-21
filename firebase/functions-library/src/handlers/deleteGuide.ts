import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-library" as const],
};

const schema = z.object({ guideId: z.string().min(1) });

export const deleteGuideHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "guideId obrigatório");
  }

  await GuideRepository.delete(data.guideId);
  return true;
});
