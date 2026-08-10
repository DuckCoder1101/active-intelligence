import { z } from "zod";
import { checkCpf } from "../../validations/checkCPF";
import { checkPhone } from "../../validations/checkPhone";
import { stripMask } from "../../validations/mask.util";

export default class UserSchema {
  static completeProfileSchema = z.object({
    name: z.string().trim().min(5, "Nome muito curto!").max(60, "Nome muito longo!"),

    // Salvo COM máscara (dígitos verificadores validados sobre a versão sem máscara).
    cpf: z.string().refine(checkCpf, "CPF inválido!"),

    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? stripMask(v) : undefined))
      .refine((v) => v === undefined || checkPhone(v), "Celular inválido!"),
  });

  static updateProfileSchema = z.object({
    targetId: z.string().min(1, "Target ID obrigatório"),
    name: z.string().trim().min(5, "Nome muito curto!").max(60, "Nome muito longo!"),
    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? stripMask(v) : undefined))
      .refine((v) => v === undefined || checkPhone(v), "Celular inválido!"),
  });

  static deleteAccountSchema = z.object({
    targetId: z.string().min(2, "Target ID obrigatório"),
  });

  static inviteUserSchema = z.object({
    email: z.email("E-mail inválido!").max(60, "E-mail muito longo!"),
    companyId: z.string().min(1, "Empresa obrigatória"),
  });
}
