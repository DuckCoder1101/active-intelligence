import {z} from "zod";
import {checkCpf} from "../../validations/checkCPF";
import {checkPhone} from "../../validations/checkPhone";

export default class UserSchema {
  static completeProfileSchema = z.object({
    name: z.string().trim().min(6, "Nome muito curto!"),

    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine(checkCpf, "CPF inválido!"),

    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? v.replace(/\D/g, "") : undefined))
      .refine((v) => v === undefined || checkPhone(v), "Celular inválido!"),
  });

  static updateProfileSchema = z.object({
    targetId: z.string().min(1, "Target ID obrigatório"),
    name: z.string().trim().min(2, "Nome obrigatório"),
    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? v.replace(/\D/g, "") : undefined))
      .refine((v) => v === undefined || checkPhone(v), "Celular inválido!"),
  });

  static deleteAccountSchema = z.object({
    targetId: z.string().min(2, "Target ID obrigatório"),
  });

  static inviteUserSchema = z.object({
    email: z.email("E-mail inválido!"),
    companyId: z.string().min(1, "Empresa obrigatória"),
  });
}
