import z from 'zod';

import { checkCpf } from '../../shared/validations/checkCPF';
import { AccessLevels } from '../constants/accessLevels.constant';

export default class UserSchema {
  static registerUserSchema = z.object({
    name: z.string().min(6, 'Nome muito curto!'),

    email: z.email('Email inválido!'),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .refine(
        (v) => /[A-Z]/.test(v),
        'Senha deve ter pelo menos uma letra maiúscula',
      )
      .refine(
        (v) => /[a-z]/.test(v),
        'Senha deve ter pelo menos uma letra minúscula',
      )
      .refine((v) => /[0-9]/.test(v), 'Senha deve ter pelo menos um número'),

    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine(checkCpf, 'CPF inválido!'),
  });

  static updateAccessLevelSchema = z.object({
    targetUid: z.string(),
    newAccessLevel: z.enum(AccessLevels),
  });
}
