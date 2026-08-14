import { z } from "zod";

export class AdminTasksBoardSchema {
  static saveColumnSchema = z.object({
    columnId: z.string().optional(),
    name: z.string().min(2, "Nome muito curto").max(20, "Máximo 20 caracteres"),
    color: z.string().min(1, "Cor obrigatória"),
    order: z.number().optional(),
  });
}
