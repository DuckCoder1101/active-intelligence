import { httpsCallable } from 'firebase/functions';

import type {
  OperationalKanbanColumn,
  SaveOperationalKanbanColumnDTO,
} from '@/models/operational-kanban.model';
import { functions } from '@/utils/firebase.util';

export default class OperationalKanbanService {
  private static listCallable = httpsCallable<void, OperationalKanbanColumn[]>(
    functions,
    'listOperationalKanbanColumnsHandler',
  );

  private static saveCallable = httpsCallable<
    SaveOperationalKanbanColumnDTO,
    OperationalKanbanColumn
  >(functions, 'saveOperationalKanbanColumnHandler');

  private static deleteCallable = httpsCallable<
    { columnId: string },
    { movedTo: string | null }
  >(functions, 'deleteOperationalKanbanColumnHandler');

  static async listColumns(): Promise<OperationalKanbanColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }

  static async saveColumn(
    data: SaveOperationalKanbanColumnDTO,
  ): Promise<OperationalKanbanColumn> {
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
