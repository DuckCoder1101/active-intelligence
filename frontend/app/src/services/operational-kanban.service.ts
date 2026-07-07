import { httpsCallable } from 'firebase/functions';

import type { OperationalKanbanColumn } from '@/models/operational-kanban.model';
import { functions } from '@/utils/firebase.util';

export default class OperationalKanbanService {
  private static listCallable = httpsCallable<void, OperationalKanbanColumn[]>(
    functions,
    'listOperationalKanbanColumnsHandler',
  );

  static async listColumns(): Promise<OperationalKanbanColumn[]> {
    const r = await this.listCallable();
    return r.data;
  }
}
