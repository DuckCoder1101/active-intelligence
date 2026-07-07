import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from 'functions-shared';
import LeadSchema from '../data/lead.schema';
import { LeadRepository } from '../repositories/lead.repository';
import { CrmColumnRepository } from '../repositories/crm-column.repository';
import { requireCompanyAccess } from '../utils/requireCompanyAccess';

export const saveLeadHandler = onCallHandler(async (req) => {
  const { success, data, error } = LeadSchema.saveSchema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      error.issues.map((i) => i.message).join(', '),
    );
  }

  const { uid, companyId } = requireCompanyAccess(req, data.companyId);

  if (
    data.priceMin !== undefined &&
    data.priceMax !== undefined &&
    data.priceMin > data.priceMax
  ) {
    throw new HttpsError(
      'invalid-argument',
      'O valor mínimo não pode ser maior que o valor máximo.',
    );
  }

  logger.info('saveLead', { companyId, leadId: data.leadId });

  const columns = await CrmColumnRepository.listAll(companyId);
  const defaultStatus = columns[0]?.columnId ?? '';

  return LeadRepository.save(companyId, uid, data, defaultStatus);
});
