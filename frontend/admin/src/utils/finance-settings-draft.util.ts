import {
  FINANCE_CATEGORY_TYPES,
  type FinanceCategoryType,
  type FinanceSubcategory,
} from '@/models/finance.model';

export interface DraftSubcategory {
  subcategoryId?: string;
  key: string;
  name: string;
}

export type DraftSubcategoriesByCategory = Record<
  FinanceCategoryType,
  DraftSubcategory[]
>;

export function newKey(): string {
  return `new-${crypto.randomUUID()}`;
}

export function toDraftSubcategoriesByCategory(
  subcategories: FinanceSubcategory[],
): DraftSubcategoriesByCategory {
  const grouped = Object.fromEntries(
    FINANCE_CATEGORY_TYPES.map((type) => [type, [] as DraftSubcategory[]]),
  ) as DraftSubcategoriesByCategory;

  [...subcategories]
    .sort((a, b) => a.order - b.order)
    .forEach((s) => {
      if (!grouped[s.categoryType]) {
        return;
      }
      grouped[s.categoryType].push({
        subcategoryId: s.subcategoryId,
        key: s.subcategoryId,
        name: s.name,
      });
    });

  return grouped;
}

export function isSubcategoriesDirty(
  draft: DraftSubcategoriesByCategory,
  original: DraftSubcategoriesByCategory,
  removedIds: string[],
): boolean {
  if (removedIds.length > 0) {
    return true;
  }
  for (const type of FINANCE_CATEGORY_TYPES) {
    const draftGroup = draft[type];
    const originalGroup = original[type];
    if (draftGroup.length !== originalGroup.length) {
      return true;
    }
    for (let i = 0; i < draftGroup.length; i++) {
      const sub = draftGroup[i];
      const origIndex = originalGroup.findIndex(
        (o) => o.subcategoryId === sub.subcategoryId,
      );
      if (!sub.subcategoryId || origIndex === -1) {
        return true;
      }
      if (originalGroup[origIndex].name !== sub.name || origIndex !== i) {
        return true;
      }
    }
  }
  return false;
}
