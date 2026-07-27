import { httpsCallable } from 'firebase/functions';

import type {
  SaveTaskCategoryDTO,
  SaveTaskSubcategoryDTO,
  TaskCategory,
  TaskTag,
} from '@/models/task.model';
import { functions } from '@/utils/firebase.util';

export default class TaskCategoryService {
  private static listCategoriesCallable = httpsCallable<void, TaskCategory[]>(
    functions,
    'listTaskCategoriesHandler',
  );

  private static saveCategoryCallable = httpsCallable<
    SaveTaskCategoryDTO,
    TaskCategory
  >(functions, 'saveTaskCategoryHandler');

  private static deleteCategoryCallable = httpsCallable<
    { categoryId: string },
    { movedTo: string | null }
  >(functions, 'deleteTaskCategoryHandler');

  private static saveSubcategoryCallable = httpsCallable<
    SaveTaskSubcategoryDTO,
    { subcategoryId: string; name: string; order: number }
  >(functions, 'saveTaskSubcategoryHandler');

  private static deleteSubcategoryCallable = httpsCallable<
    { categoryId: string; subcategoryId: string },
    boolean
  >(functions, 'deleteTaskSubcategoryHandler');

  static async listCategories(): Promise<TaskCategory[]> {
    const r = await this.listCategoriesCallable();
    return r.data;
  }

  static async saveCategory(data: SaveTaskCategoryDTO): Promise<TaskCategory> {
    const r = await this.saveCategoryCallable(data);
    return r.data;
  }

  static async deleteCategory(
    categoryId: string,
  ): Promise<{ movedTo: string | null }> {
    const r = await this.deleteCategoryCallable({ categoryId });
    return r.data;
  }

  static async saveSubcategory(data: SaveTaskSubcategoryDTO) {
    const r = await this.saveSubcategoryCallable(data);
    return r.data;
  }

  static async deleteSubcategory(
    categoryId: string,
    subcategoryId: string,
  ): Promise<void> {
    await this.deleteSubcategoryCallable({ categoryId, subcategoryId });
  }

  private static listTagsCallable = httpsCallable<void, TaskTag[]>(
    functions,
    'listTaskTagsHandler',
  );

  private static saveTagCallable = httpsCallable<{ name: string }, TaskTag>(
    functions,
    'saveTaskTagHandler',
  );

  private static deleteTagCallable = httpsCallable<
    { tagId: string },
    boolean
  >(functions, 'deleteTaskTagHandler');

  static async listTags(): Promise<TaskTag[]> {
    const r = await this.listTagsCallable();
    return r.data;
  }

  static async saveTag(name: string): Promise<TaskTag> {
    const r = await this.saveTagCallable({ name });
    return r.data;
  }

  static async deleteTag(tagId: string): Promise<void> {
    await this.deleteTagCallable({ tagId });
  }
}
