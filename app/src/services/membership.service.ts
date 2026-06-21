import { httpsCallable } from 'firebase/functions';

import { functions } from '@/utils/firebase.util';

import type { MemberModel, MemberRole } from '@t/membership.model';

export default class MembershipService {
  private static listByCompanyCallable = httpsCallable<
    { companyId: string },
    MemberModel[]
  >(functions, 'listMembersByCompanyHandler');

  private static saveMemberCallable = httpsCallable<
    { cpf: string; companyId: string; role: MemberRole },
    boolean
  >(functions, 'saveMemberHandler');

  private static removeMemberCallable = httpsCallable<
    { uid: string; companyId: string },
    boolean
  >(functions, 'removeMemberHandler');

  private static setOwnerCallable = httpsCallable<
    { uid: string; companyId: string },
    boolean
  >(functions, 'setCompanyOwnerHandler');

  static async listMembers(companyId: string): Promise<MemberModel[]> {
    const result = await this.listByCompanyCallable({ companyId });
    return result.data;
  }

  static async saveMember(
    cpf: string,
    companyId: string,
    role: MemberRole,
  ): Promise<void> {
    await this.saveMemberCallable({ cpf, companyId, role });
  }

  static async removeMember(uid: string, companyId: string): Promise<void> {
    await this.removeMemberCallable({ uid, companyId });
  }

  static async setOwner(uid: string, companyId: string): Promise<void> {
    await this.setOwnerCallable({ uid, companyId });
  }
}
