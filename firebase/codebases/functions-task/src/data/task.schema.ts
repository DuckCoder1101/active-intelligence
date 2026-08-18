import { z } from "zod";

export default class TaskSchema {
  static saveSchema = z.object({
    taskId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    companyId: z.string().min(1, "Empresa obrigatória"),
    title: z
      .string()
      .min(5, "Título muito curto")
      .max(60, "Titúlo com deve ter no máximo 60 caracteres"),
    description: z
      .string()
      .max(300, "Descrição deve ter no máximo 300 caracteres")
      .nullish()
      .default("")
      .transform((v) => v ?? ""),
    categoryId: z.string().min(1, "Categoria obrigatória"),
    subcategoryId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    tags: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    status: z.string().default("requisitada"),
    dueDate: z.number().refine((v) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return v >= today.getTime();
    }, "A data de entrega não pode ser anterior ao dia atual"),
    assignedTo: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    referenceLinks: z
      .array(z.string().url("URL inválida"))
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    referenceImages: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
  });

  static updateStatusSchema = z.object({
    taskId: z.string().min(1, "taskId obrigatório"),
    status: z.string().min(1, "Status inválido"),
  });

  static createClientTaskSchema = z.object({
    companyId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    title: z
      .string()
      .min(5, "Título muito curto")
      .max(30, "Máximo 30 caracteres"),
    description: z
      .string()
      .max(300, "Máximo 300 caracteres")
      .nullish()
      .default("")
      .transform((v) => v ?? ""),
    categoryId: z.string().min(1, "Categoria obrigatória"),
    subcategoryId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    dueDate: z.number().refine((v) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return v >= today.getTime();
    }, "A data de entrega não pode ser anterior ao dia atual"),
    referenceLinks: z
      .array(z.string().url("URL inválida"))
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    referenceImages: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    createdByName: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
  });

  static approveClientTaskSchema = z.object({
    taskId: z.string().min(1, "taskId obrigatório"),
    actorName: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
