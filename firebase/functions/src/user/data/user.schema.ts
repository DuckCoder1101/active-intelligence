import z from 'zod';

import { checkCpf } from '../../shared/validations/checkCPF';
import { AccessLevels } from '../constants/accessLevels.const';
import { checkPhone } from '@shared/validations/checkPhone';
import { ADMIN_PERMISSIONS } from '@shared/constants/permissions.const';

export default class UserSchema {
  static registerUserSchema = z.object({
    name: z.string().trim().min(6, 'Nome muito curto!'),

    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine(checkCpf, 'CPF inválido!'),

    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? v.replace(/\D/g, '') : undefined))
      .refine((v) => v === undefined || checkPhone(v), 'Celular inválido!'),
  });

  static updateAccessLevelSchema = z.object({
    targetUid: z.string().min(1),
    newAccessLevel: z.enum(AccessLevels),
  });

  static updateUserSchema = z.object({
    targetUid: z.string().min(1),
    name: z.string().trim().min(3, 'Nome muito curto!').nullish().transform((v) => v ?? undefined),
    phone: z
      .string()
      .nullish()
      .transform((v) => (v ? v.replace(/\D/g, '') : undefined))
      .refine((v) => v === undefined || checkPhone(v), 'Celular inválido!'),
  });

  static deleteUserSchema = z.object({
    targetUid: z.string().min(1),
  });

  static updatePermissionsSchema = z.object({
    targetUid: z.string().min(1),
    permissions: z.array(z.enum(ADMIN_PERMISSIONS)),
  });

  static inviteUserSchema = z.object({
    email: z.string().email('E-mail inválido!'),
  });
}
