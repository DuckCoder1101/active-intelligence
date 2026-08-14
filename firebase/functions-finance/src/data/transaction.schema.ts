import { z } from "zod";
import { FINANCE_CATEGORY_TYPES } from "../types/category.type";
import {
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
} from "../types/transaction.document";

export default class TransactionSchema {
  static saveSchema = z
    .object({
      transactionId: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      type: z.enum(TRANSACTION_TYPES, { message: "Tipo inválido" }),
      category: z.enum(FINANCE_CATEGORY_TYPES, {
        message: "Categoria inválida",
      }),
      subcategoryId: z
        .string()
        .nullish()
        .transform((v) => v || undefined),
      companyId: z
        .string()
        .nullish()
        .transform((v) => v || undefined),
      companyName: z
        .string()
        .trim()
        .max(60, "Máximo 60 caracteres")
        .nullish()
        .transform((v) => v || undefined),
      amount: z.number().positive("Valor deve ser maior que zero"),
      paymentMethod: z.enum(PAYMENT_METHODS, {
        message: "Forma de pagamento inválida",
      }),
      accountId: z.string().min(1, "Conta obrigatória"),
      dueDate: z.number(),
      accrualDate: z.number(),
      description: z
        .string()
        .trim()
        .max(200, "Máximo 200 caracteres")
        .nullish()
        .transform((v) => v || undefined),
      installmentIndex: z
        .number()
        .int()
        .positive()
        .nullish()
        .transform((v) => v ?? undefined),
      installments: z
        .number()
        .int()
        .min(2)
        .max(24)
        .nullish()
        .transform((v) => v ?? undefined),
      isRecurring: z
        .boolean()
        .nullish()
        .transform((v) => v ?? undefined),
      recurrenceEndDate: z
        .number()
        .nullish()
        .transform((v) => v ?? undefined),
      origin: z
        .enum(["manual", "contas"])
        .nullish()
        .transform((v) => v ?? undefined),
    })
    .refine((data) => !(data.installments && data.isRecurring), {
      message: "Escolha parcelado ou recorrente, não os dois.",
      path: ["isRecurring"],
    });

  static markPaidSchema = z.object({
    transactionId: z.string().min(1, "transactionId obrigatório"),
    paidDate: z.number(),
  });

  static unmarkPaidSchema = z.object({
    transactionId: z.string().min(1, "transactionId obrigatório"),
  });

  static deleteSchema = z.object({
    transactionId: z.string().min(1, "transactionId obrigatório"),
  });
}
