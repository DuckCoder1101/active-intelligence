import z from 'zod';

export class CompanyUserSchema {
  static inviteUserSchema = z.object({
    email: z.email('Email inválido!'),
    companyId: z.string().min(1, 'ID de cliente inválido!'),
  });
}
