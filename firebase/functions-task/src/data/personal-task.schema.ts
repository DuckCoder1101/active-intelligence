import { z } from "zod";

export default class PersonalTaskSchema {
  static saveSchema = z.object({
    personalTaskId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    companyId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    title: z.string().min(1, "Título obrigatório"),
    description: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    color: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    dueDate: z.number(),
  });

  static deleteSchema = z.object({
    personalTaskId: z.string().min(1, "personalTaskId obrigatório"),
    companyId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
