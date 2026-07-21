import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";
import { optionalString, optionalStringArray } from "../utils/zod.util";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-library" as const],
};

const scriptGuideBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

const schema = z.object({
  guideId: optionalString(),
  // Rótulo opcional — o nome final (G-001, G-002-MeuGuia...) é gerado no
  // repositório a partir do número sequencial do guia.
  name: optionalString(),
  driveUrl: optionalString(),
  socialUrl: optionalString(),
  intentTags: optionalStringArray(),
  platformTags: optionalStringArray(),
  formatTags: optionalStringArray(),
  scriptPrompt: optionalString(),
  scriptGuide: z.array(scriptGuideBlockSchema).optional(),
  assignedCompanyIds: optionalStringArray(),
});

export const saveGuideHandler = onCallHandler(async (req) => {
  const user = requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveGuide", {
    action: data.guideId ? "update" : "create",
    guideId: data.guideId,
  });

  return GuideRepository.save(user.uid, data);
});
