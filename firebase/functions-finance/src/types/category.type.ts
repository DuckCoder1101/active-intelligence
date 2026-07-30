export const FINANCE_CATEGORY_TYPES = [
  "receita",
  "custo",
  "despesa",
  "investimento",
] as const;
export type FinanceCategoryType = (typeof FINANCE_CATEGORY_TYPES)[number];
