import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { logger } from "firebase-functions";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import { TagRepository } from "../repositories/tag.repository";

const schema = z.object({
  companyId: z.string().min(1),
  tagId: z.string().min(1),
});

export const deleteTagHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "tagId obrigatório", error.issues);
  }

  const { companyId } = requireCompanyAccess(req, data.companyId, "ao CRM");

  logger.info("deleteTag", { companyId, tagId: data.tagId });

  await TagRepository.delete(companyId, data.tagId);
  return true;
});
