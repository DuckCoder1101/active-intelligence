export const FINANCE_CATEGORY_TYPES = [
  "receitaRecorrente",
  "receitaPontual",
  "receitaVariavel",
  "custo",
  "despesa",
  "proLabore",
  "imposto",
] as const;
export type FinanceCategoryType = (typeof FINANCE_CATEGORY_TYPES)[number];
