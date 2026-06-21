import z from 'zod';

import { Role } from '../enums/role.enum';

export default class MembershipSchema {
  static saveMemberSchema = z.object({
    cpf: z.string().min(11, 'CPF inválido!'),
    companyId: z.string().min(1, 'CompanyId muito curto!'),
    role: z.enum(Role, 'Cargo de membro inválido!'),
  });

  static removeMemberSchema = z.object({
    uid: z.string().min(1, 'UId muito curto!'),
    companyId: z.string().min(1, 'CompanyId muito curto!'),
  });
}
