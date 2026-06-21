import z from 'zod';

import { checkCpf } from '../../shared/validations/checkCPF';
import { AccessLevels } from '../constants/accessLevels.const';
import { checkPhone } from '@shared/validations/checkPhone';

export default class UserSchema {
  static registerSchema = z.object({
    name: z.string().trim().min(6, 'Nome muito curto!'),

    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine(checkCpf, 'CPF inválido!'),

    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine(checkPhone, 'Celular inválido!')
      .optional(),
  });

  static updateAccessLevelSchema = z.object({
    targetUid: z.string().min(1),
    newAccessLevel: z.enum(AccessLevels),
  });
}
