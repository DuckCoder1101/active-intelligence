import { z } from "zod";

export default class TaskCategorySchema {
  static saveCategorySchema = z.object({
    categoryId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
    color: z.string().min(1, "Cor obrigatória"),
    order: z.number().optional(),
  });

  static deleteCategorySchema = z.object({
    categoryId: z.string().min(1, "categoryId obrigatório"),
  });

  static saveSubcategorySchema = z.object({
    categoryId: z.string().min(1, "categoryId obrigatório"),
    subcategoryId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
    order: z.number().optional(),
  });

  static deleteSubcategorySchema = z.object({
    categoryId: z.string().min(1, "categoryId obrigatório"),
    subcategoryId: z.string().min(1, "subcategoryId obrigatório"),
  });
}
