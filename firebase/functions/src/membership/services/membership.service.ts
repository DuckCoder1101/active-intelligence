import { database } from '@shared/firebase';
import { AuditRepository } from '../../company/repositories/audit.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import {
  SaveMembershipDTO,
  RemoveMembershipDTO,
} from '../types/membership.dtos';
import { AuditAction } from '../../shared/enums/auditAction.enum';

export class MembershipService {
  static async saveMembership(
    data: SaveMembershipDTO,
    actorUid: string,
  ): Promise<void> {
    await database.runTransaction(async (tx) => {
      const isNew = await MembershipRepository.saveMembership(data, tx);

      AuditRepository.create(
        data.companyId,
        {
          action: isNew ? AuditAction.member_added : AuditAction.member_updated,
          actorUid,
          targetUid: data.uid,
        },
        tx,
      );
    });
  }

  static async deleteMembership(
    data: RemoveMembershipDTO,
    actorUid: string,
  ): Promise<void> {
    await database.runTransaction(async (tx) => {
      await MembershipRepository.deleteMembership(data, tx);

      AuditRepository.create(
        data.companyId,
        {
          action: AuditAction.member_removed,
          actorUid,
          targetUid: data.uid,
        },
        tx,
      );
    });
  }
}
