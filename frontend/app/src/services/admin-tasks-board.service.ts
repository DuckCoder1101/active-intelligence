import { httpsCallable } from 'firebase/functions';

import type { AdminTasksBoardColumn } from '@/models/admin-tasks-board.model';
import { functions } from '@/utils/firebase.util';

export default class AdminTasksBoardService {
  private static listCallable = httpsCallable<void, AdminTasksBoardColumn[]>(
    functions,
    'listAdminTasksBoardColumnsHandler',
  );

  static async listColumns(): Promise<AdminTasksBoardColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }
}
