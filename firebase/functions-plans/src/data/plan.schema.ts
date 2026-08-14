import { z } from "zod";

import { PLAN_BILLING_TYPES, PLAN_FEATURES } from "../types/plan.document";

export default class PlanSchema {
  static saveSchema = z.object({
    planId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    name: z
      .string()
      .trim()
      .min(5, "Nome muito curto")
      .max(20, "Máximo 20 caracteres"),
    billingType: z.enum(PLAN_BILLING_TYPES, {
      message: "Tipo de cobrança inválido",
    }),
    value: z.number().positive("Valor deve ser maior que zero"),
    features: z.array(z.enum(PLAN_FEATURES)),
    taskLimit: z
      .number()
      .int("Limite de tarefas deve ser um número inteiro")
      .nonnegative("Limite de tarefas não pode ser negativo"),
  });

  static deleteSchema = z.object({
    planId: z.string().min(1, "planId obrigatório"),
  });
}
