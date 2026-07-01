import { httpsCallable } from 'firebase/functions';


import type { AdminProfile, AdminAccessLevel } from '@/models/admin.model';
import UserService from '@/services/user.service';
import type { UpdateAccountDTO } from '@/types/dtos/user.dto';
import type { AdminPermission } from '@/types/permissions.type';
import { functions } from '@/utils/firebase.util';

export type UpdateAdminDTO = UpdateAccountDTO;

export default class AdminService {
  private static listAdminsCallable = httpsCallable<void, AdminProfile[]>(
    functions,
    'listAdminsHandler',
  );

  private static updatePermissionsCallable = httpsCallable<
    { targetUid: string; permissions: AdminPermission[] },
    boolean
  >(functions, 'updateAdminPermissionsHandler');

  private static updateAccessLevelCallable = httpsCallable<
    { targetUid: string; accessLevel: AdminAccessLevel },
    boolean
  >(functions, 'updateAdminAccessLevelHandler');

  private static inviteAdminCallable = httpsCallable<
    { email: string },
    boolean
  >(functions, 'inviteAdminHandler');

  static async listAdmins(): Promise<AdminProfile[]> {
    const result = await this.listAdminsCallable();
    return result.data;
  }

  static async updatePermissions(
    uid: string,
    permissions: AdminPermission[],
  ): Promise<void> {
    await this.updatePermissionsCallable({ targetUid: uid, permissions });
  }

  static async updateAccessLevel(
    uid: string,
    accessLevel: AdminAccessLevel,
  ): Promise<void> {
    await this.updateAccessLevelCallable({ targetUid: uid, accessLevel });
  }

  static async updateAdmin(data: UpdateAdminDTO): Promise<void> {
    await UserService.updateAccount(data);
  }

  static async deleteAdmin(uid: string): Promise<void> {
    await UserService.deleteAccount({ targetId: uid });
  }

  static async inviteAdmin(email: string): Promise<void> {
    await this.inviteAdminCallable({ email });
  }
}
