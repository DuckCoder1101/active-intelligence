import type { TaskCategory } from '@/models/task.model';

export interface DraftSubcategory {
  subcategoryId?: string;
  key: string;
  name: string;
  order: number;
}

export interface DraftCategory {
  categoryId?: string;
  key: string;
  name: string;
  color: string;
  order: number;
  subcategories: DraftSubcategory[];
  removedSubcategoryIds: string[];
}

export function newKey(): string {
  return `new-${crypto.randomUUID()}`;
}

export function toDraft(categories: TaskCategory[]): DraftCategory[] {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      categoryId: c.categoryId,
      key: c.categoryId,
      name: c.name,
      color: c.color,
      order: c.order,
      subcategories: [...c.subcategories]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          subcategoryId: s.subcategoryId,
          key: s.subcategoryId,
          name: s.name,
          order: s.order,
        })),
      removedSubcategoryIds: [],
    }));
}

/** True if the draft has any unsaved create/rename/reorder/remove vs. the last-loaded snapshot. */
export function isDraftDirty(
  draft: DraftCategory[],
  original: DraftCategory[],
  removedCategoryIds: string[],
): boolean {
  if (removedCategoryIds.length > 0 || draft.length !== original.length) {
    return true;
  }

  for (let i = 0; i < draft.length; i++) {
    const cat = draft[i];
    const orig = original.find((o) => o.categoryId === cat.categoryId);
    if (!cat.categoryId || !orig) {
      return true;
    }
    if (orig.name !== cat.name || orig.color !== cat.color || orig.order !== i) {
      return true;
    }
    if (
      cat.removedSubcategoryIds.length > 0 ||
      cat.subcategories.length !== orig.subcategories.length
    ) {
      return true;
    }
    for (let j = 0; j < cat.subcategories.length; j++) {
      const sub = cat.subcategories[j];
      const origSub = orig.subcategories.find((s) => s.subcategoryId === sub.subcategoryId);
      if (!sub.subcategoryId || !origSub) {
        return true;
      }
      if (origSub.name !== sub.name || origSub.order !== j) {
        return true;
      }
    }
  }

  return false;
}
