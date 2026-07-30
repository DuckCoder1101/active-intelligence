import { z } from "zod";
import { FINANCE_CATEGORY_TYPES } from "../types/category.type";
import {
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
} from "../types/transaction.document";

export default class TransactionSchema {
  static saveSchema = z.object({
    transactionId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    type: z.enum(TRANSACTION_TYPES, { message: "Tipo inválido" }),
    category: z.enum(FINANCE_CATEGORY_TYPES, { message: "Categoria inválida" }),
    subcategoryId: z
      .string()
      .nullish()
      .transform((v) => v || undefined),
    companyId: z
      .string()
      .nullish()
      .transform((v) => v || undefined),
    amount: z.number().positive("Valor deve ser maior que zero"),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      message: "Forma de pagamento inválida",
    }),
    accountId: z.string().min(1, "Conta obrigatória"),
    dueDate: z.number(),
    description: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || undefined),
  });

  static markPaidSchema = z.object({
    transactionId: z.string().min(1, "transactionId obrigatório"),
    paidDate: z.number(),
  });

  static deleteSchema = z.object({
    transactionId: z.string().min(1, "transactionId obrigatório"),
  });
}
