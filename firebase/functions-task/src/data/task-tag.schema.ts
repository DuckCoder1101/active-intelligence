import { z } from "zod";

export default class TaskTagSchema {
  static saveSchema = z.object({
    name: z.string().min(1, "Nome obrigatório").max(30, "Máximo 30 caracteres"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  });

  static deleteSchema = z.object({
    tagId: z.string().min(1, "tagId obrigatório"),
  });
}
