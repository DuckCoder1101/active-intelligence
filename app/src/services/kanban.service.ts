import { httpsCallable } from 'firebase/functions';
import { functions } from '@/utils/firebase.util';
import type { KanbanColumn, SaveKanbanColumnDTO } from '@/models/kanban.model';

export default class KanbanService {
  private static listCallable = httpsCallable<void, KanbanColumn[]>(
    functions,
    'listKanbanColumnsHandler',
  );

  private static saveCallable = httpsCallable<
    SaveKanbanColumnDTO,
    KanbanColumn
  >(functions, 'saveKanbanColumnHandler');

  private static deleteCallable = httpsCallable<
    { columnId: string },
    { movedTo: string | null }
  >(functions, 'deleteKanbanColumnHandler');

  static async listColumns(): Promise<KanbanColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }

  static async saveColumn(data: SaveKanbanColumnDTO): Promise<KanbanColumn> {
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
