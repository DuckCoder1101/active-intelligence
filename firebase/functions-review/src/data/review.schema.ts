import { z } from "zod";

export default class ReviewSchema {
  static submitSchema = z.object({
    stars: z
      .number()
      .int("Deve ser um número inteiro")
      .min(1, "Mínimo 1 estrela")
      .max(5, "Máximo 5 estrelas"),
    comment: z
      .string()
      .trim()
      .max(1000, "Máximo 1000 caracteres")
      .nullish()
      .transform((v) => (v ? v : undefined)),
    anonymous: z.boolean(),
  });

  static deleteSchema = z.object({
    reviewId: z.string().min(1, "reviewId obrigatório"),
  });
}
