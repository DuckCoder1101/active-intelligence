import { logger } from 'firebase-functions';

import { onCallHandler, requireAccess, AdminRepository } from 'functions-shared';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-team' as const],
};

export const listAdminsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const result = await AdminRepository.listAll();
  logger.info('listAdmins: retornando N itens', { count: result.length });
  return result;
});
