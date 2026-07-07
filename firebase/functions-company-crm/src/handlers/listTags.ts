import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';

import { onCallHandler } from 'functions-shared';
import { TagRepository } from '../repositories/tag.repository';
import { requireCompanyAccess } from '../utils/requireCompanyAccess';

const schema = z.object({ companyId: z.string().min(1) });

export const listTagsHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', 'companyId obrigatório');
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);
  return TagRepository.listAll(companyId);
});
