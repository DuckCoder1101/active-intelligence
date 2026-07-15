import { z } from "zod";
import { TASK_TYPES } from "../types/task.document";

export default class TaskSchema {
  static saveSchema = z.object({
    taskId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    companyId: z.string().min(1, "Empresa obrigatória"),
    title: z.string().min(1, "Título obrigatório"),
    description: z
      .string()
      .nullish()
      .default("")
      .transform((v) => v ?? ""),
    type: z.enum(TASK_TYPES, { message: "Tipo inválido" }),
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
    title: z.string().min(1, "Título obrigatório"),
    description: z
      .string()
      .nullish()
      .default("")
      .transform((v) => v ?? ""),
    type: z.enum(TASK_TYPES, { message: "Tipo inválido" }),
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
