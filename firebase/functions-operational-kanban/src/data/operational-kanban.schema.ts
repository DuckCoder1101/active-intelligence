import { z } from "zod";

export class OperationalKanbanSchema {
  static saveColumnSchema = z.object({
    columnId: z.string().optional(),
    name: z.string().min(1, "Nome obrigatório").max(40, "Máximo 40 caracteres"),
    color: z.string().min(1, "Cor obrigatória"),
    order: z.number().optional(),
  });
}
