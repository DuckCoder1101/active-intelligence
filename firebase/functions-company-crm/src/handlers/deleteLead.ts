import { HttpsError } from 'firebase-functions/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';

import { onCallHandler } from 'functions-shared';
import { LeadRepository } from '../repositories/lead.repository';
import { requireCompanyAccess } from '../utils/requireCompanyAccess';

const schema = z.object({
  companyId: z.string().min(1),
  leadId: z.string().min(1),
});

export const deleteLeadHandler = onCallHandler(async (req) => {
  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError('invalid-argument', 'leadId obrigatório', error.issues);
  }

  const { companyId } = requireCompanyAccess(req, data.companyId);

  logger.info('deleteLead', { companyId, leadId: data.leadId });

  await LeadRepository.delete(companyId, data.leadId);
  return true;
});
