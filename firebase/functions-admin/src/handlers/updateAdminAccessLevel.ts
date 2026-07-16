import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, requireAccess, auth } from "functions-shared";

const ACCESS = { minAccessLevel: "owner" as const };

const schema = z.object({
  targetUid: z.string().min(1, "targetUid obrigatório"),
  accessLevel: z.enum(["admin", "owner"]),
});

export const updateAdminAccessLevelHandler = onCallHandler(async (req) => {
  const caller = requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "Dados inválidos!", error.issues);
  }

  if (data.targetUid === caller.uid) {
    throw new HttpsError(
      "invalid-argument",
      "Você não pode alterar seu próprio nível de acesso.",
    );
  }

  logger.info("updateAdminAccessLevel", {
    targetUid: data.targetUid,
    accessLevel: data.accessLevel,
  });

  const targetUser = await auth.getUser(data.targetUid);
  const existingClaims = targetUser.customClaims ?? {};

  await auth.setCustomUserClaims(data.targetUid, {
    ...existingClaims,
    accessLevel: data.accessLevel,
  });

  return true;
});
