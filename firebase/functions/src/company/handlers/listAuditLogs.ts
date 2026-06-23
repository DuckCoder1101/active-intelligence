import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import { database } from '@shared/firebase';
import { CompanyAuditDocument } from '../types/company-audit.document';
import UserRepository from '../../user/repositories/user.repository';

const schema = z.object({ companyId: z.string().min(1) });

export const listAuditLogsHandler = onCallHandler(async (req) => {
  const { accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError('invalid-argument', 'companyId inválido!');
  }

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

      const [actor, target] = await Promise.all([
        UserRepository.getResumeByUid(audit.actorUid).catch(() => ({
          uid: audit.actorUid,
          name: '(desconhecido)',
        })),
        audit.targetUid
          ? UserRepository.getResumeByUid(audit.targetUid).catch(() => ({
              uid: audit.targetUid!,
              name: '(desconhecido)',
            }))
          : Promise.resolve(null),
      ]);

      return {
        id: doc.id,
        action: audit.action,
        actorName: actor.name,
        targetName: target?.name ?? null,
        createdAt: audit.createdAt.toMillis(),
      };
    }),
  );
});
