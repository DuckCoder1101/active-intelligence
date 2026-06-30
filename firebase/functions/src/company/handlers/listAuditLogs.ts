import z from 'zod';
import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { database } from '@shared/utils/firebase';
import { CompanyAuditDocument } from '../types/company-audit.document';
import AdminRepository from '../../admin/repositories/admin.repository';
import { requireAccess } from '@shared/utils/requireAccess.util';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-clients' as const],
};

const schema = z.object({ companyId: z.string().min(1) });

export const listAuditLogsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError('invalid-argument', 'companyId inválido!');
  }

  logger.info('listAuditLogs', { companyId: data.companyId });

  const snapshot = await database
    .collection('companies')
    .doc(data.companyId)
    .collection('audits')
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) return [];

  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const audit = doc.data() as CompanyAuditDocument;

      const [actorName, targetName] = await Promise.all([
        audit.actorName
          ? Promise.resolve(audit.actorName)
          : AdminRepository.getResumeByUid(audit.actorUid)
              .then((r) => r.name)
              .catch((err) => {
                logger.warn('listAuditLogs: falha ao resolver actor', {
                  uid: audit.actorUid,
                  err: String(err),
                });
                return '(desconhecido)';
              }),
        audit.targetUid
          ? AdminRepository.getResumeByUid(audit.targetUid)
              .then((r) => r.name)
              .catch((err) => {
                logger.warn('listAuditLogs: falha ao resolver target', {
                  uid: audit.targetUid,
                  err: String(err),
                });
                return '(desconhecido)';
              })
          : Promise.resolve(null),
      ]);

      return {
        id: doc.id,
        action: audit.action,
        actorName,
        targetName,
        taskId: audit.taskId ?? null,
        taskTitle: audit.taskTitle ?? null,
        details: audit.details ?? null,
        createdAt: audit.createdAt.toMillis(),
      };
    }),
  );
});
