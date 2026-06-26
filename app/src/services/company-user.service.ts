import { httpsCallable } from 'firebase/functions';
import { functions } from '@/utils/firebase.util';

import type { UserProfile } from '@/models/user-profile.model';

export default class CompanyUserService {
  private static listCompanyUsersCallable = httpsCallable<
    { companyId: string },
    UserProfile[]
  >(functions, 'listCompanyUsersHandler');

  private static inviteCompanyUserCallable = httpsCallable<
    { email: string; companyId: string },
    boolean
  >(functions, 'inviteCompanyUserHandler');

  static async listCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const result = await this.listCompanyUsersCallable({ companyId });
    return result.data;
  }

  static async inviteCompanyUser(
    email: string,
    companyId: string,
  ): Promise<void> {
    await this.inviteCompanyUserCallable({ email, companyId });
  }
}
