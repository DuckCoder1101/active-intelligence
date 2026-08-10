import { httpsCallable } from 'firebase/functions';

import type {
  AdminTasksBoardColumn,
  SaveAdminTasksBoardColumnDTO,
} from '@/models/admin-tasks-board.model';
import { functions } from '@/utils/firebase.util';

export default class AdminTasksBoardService {
  private static listCallable = httpsCallable<void, AdminTasksBoardColumn[]>(
    functions,
    'listAdminTasksBoardColumnsHandler',
  );

  private static saveCallable = httpsCallable<
    SaveAdminTasksBoardColumnDTO,
    AdminTasksBoardColumn
  >(functions, 'saveAdminTasksBoardColumnHandler');

  private static deleteCallable = httpsCallable<
    { columnId: string },
    { movedTo: string | null }
  >(functions, 'deleteAdminTasksBoardColumnHandler');

  static async listColumns(): Promise<AdminTasksBoardColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }

  static async saveColumn(
    data: SaveAdminTasksBoardColumnDTO,
  ): Promise<AdminTasksBoardColumn> {
    const r = await this.saveCallable(data);
    return r.data;
  }

  static async deleteColumn(
    columnId: string,
  ): Promise<{ movedTo: string | null }> {
    const r = await this.deleteCallable({ columnId });
    return r.data;
  }
}
