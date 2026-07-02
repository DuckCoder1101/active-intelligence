import { httpsCallable } from 'firebase/functions';

import type { KanbanColumn } from '@/models/kanban.model';
import { functions } from '@/utils/firebase.util';

export default class KanbanService {
  private static listCallable = httpsCallable<void, KanbanColumn[]>(
    functions,
    'listKanbanColumnsHandler',
  );

  static async listColumns(): Promise<KanbanColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }
}
