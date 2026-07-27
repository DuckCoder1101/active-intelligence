import { httpsCallable } from 'firebase/functions';

import type { TaskCategory } from '@/models/task.model';
import { functions } from '@/utils/firebase.util';

export default class TaskCategoryService {
  private static listCategoriesCallable = httpsCallable<void, TaskCategory[]>(
    functions,
    'listTaskCategoriesHandler',
  );

  static async listCategories(): Promise<TaskCategory[]> {
    const r = await this.listCategoriesCallable();
    return r.data;
  }
}
