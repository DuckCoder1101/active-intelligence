import { z } from "zod";

export default class CompanyInternalTaskSchema {
  static saveSchema = z.object({
    companyInternalTaskId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
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
      .transform((v) => v ?? undefined),
    color: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    dueDate: z.number(),
  });

  static deleteSchema = z.object({
    companyInternalTaskId: z.string().min(1, "companyInternalTaskId obrigatório"),
    companyId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
