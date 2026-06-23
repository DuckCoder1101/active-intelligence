import z from 'zod';
import { HttpsError } from 'firebase-functions/https';

import { onCallHandler } from '@shared/utils/onCallHandler.util';
import { MembershipService } from '../../membership/services/membership.service';
import { Role } from '../../membership/enums/role.enum';
import { requireAccess } from '@shared/utils/requireAccess.util';

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-clients' as const],
};

const setCompanyOwnerSchema = z.object({
  uid: z.string().min(1),
  companyId: z.string().min(1),
});

export const setCompanyOwnerHandler = onCallHandler(async (req) => {
  const { uid: actorUid } = requireAccess(req, ACCESS);

  const { success, data, error } = setCompanyOwnerSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError(
      'invalid-argument',
      'Dados inválidos!',
      z.treeifyError(error),
    );
  }

  await MembershipService.saveMembership(
    { ...data, role: Role.owner },
    actorUid,
  );
  return true;
});
