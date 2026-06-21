import z from 'zod';

import { BrazilianState } from '../../shared/enums/brazilianState.enum';
import { checkCnpj } from '../../shared/validations/checkCNPJ';
import { BusinessSector } from '../enums/businessSector.enum';
import { RevenueRange } from '../enums/revenueRange.enum';
import { CompanyStage } from '../enums/companyStage.emum';

export default class CompanySchema {
  static registerSchema = z.object({
    companyId: z.string().optional(),

    displayName: z.string().min(2, 'Nome muito curto!'),

    legalInformation: z.object({
      legalName: z.string().optional(),
      tradeName: z.string().optional(),
      documentNumber: z
        .string()
        .transform((v) => v.replace(/\D/g, ''))
        .refine(checkCnpj, 'CNPJ inválido!'),
    }),

    companyStage: z.enum(CompanyStage),

    contact: z
      .object({
        email: z.email('E-mail inválido!').optional(),
        phone: z
          .string()
          .transform((v) => v.replace(/\D/g, ''))
          .optional(),
      })
      .optional(),

    business: z.object({
      businessSector: z.enum(BusinessSector),
      customSegment: z.string().optional(),
      cnae: z.string().optional(),
      revenueRange: z.enum(RevenueRange).optional(),
      quantityOfEmployees: z.number().int().nonnegative().optional(),
      quantityOfBrokers: z.number().int().nonnegative().optional(),
    }),

    location: z.object({
      address: z.string().min(1, 'Endereço obrigatório!'),
      number: z.string().min(1, 'Número obrigatório!'),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().min(1, 'Cidade obrigatória!'),
      state: z.enum(BrazilianState),
      zipCode: z
        .string()
        .transform((v) => v.replace(/\D/g, ''))
        .refine((v) => v.length === 8, 'CEP inválido!'),
    }),

    social: z
      .object({
        websiteUrl: z.url('URL inválida!').optional(),
        instagramUsername: z.string().optional(),
        linkedInUsername: z.string().optional(),
      })
      .optional(),

    extra: z
      .object({
        observations: z.string().optional(),
      })
      .optional(),
  });
}
