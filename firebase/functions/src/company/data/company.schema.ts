import z from 'zod';

import { BrazilianState } from '../../shared/enums/brazilianState.enum';
import { checkCnpj } from '../../shared/validations/checkCNPJ';
import { BusinessSector } from '../enums/businessSector.enum';
import { RevenueRange } from '../enums/revenueRange.enum';
import { CompanyStage } from '../enums/companyStage.emum';

export default class CompanySchema {
  static registerSchema = z.object({
    companyId: z.string().nullish().transform((v) => v ?? undefined),

    displayName: z.string().min(2, 'Nome muito curto!'),

    legalInformation: z.object({
      legalName: z.string().nullish().transform((v) => v ?? undefined),
      tradeName: z.string().nullish().transform((v) => v ?? undefined),
      documentNumber: z
        .string()
        .transform((v) => v.replace(/\D/g, ''))
        .refine(checkCnpj, 'CNPJ inválido!'),
    }),

    companyStage: z.enum(CompanyStage).default(CompanyStage.comercial),

    contact: z.object({
      email: z.email('E-mail inválido!'),
      phone: z.string().transform((v) => v.replace(/\D/g, '')),
    }),

    business: z
      .object({
        businessSector: z.enum(BusinessSector).nullish().transform((v) => v ?? undefined),
        customSegment: z.string().nullish().transform((v) => v ?? undefined),
        cnae: z.string().nullish().transform((v) => v ?? undefined),
        revenueRange: z.enum(RevenueRange).nullish().transform((v) => v ?? undefined),
        quantityOfEmployees: z.number().int().nonnegative().nullish().transform((v) => v ?? undefined),
        quantityOfBrokers: z.number().int().nonnegative().nullish().transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    location: z.object({
      address: z.string().nullish().transform((v) => v ?? undefined),
      number: z.string().nullish().transform((v) => v ?? undefined),
      complement: z.string().nullish().transform((v) => v ?? undefined),
      neighborhood: z.string().nullish().transform((v) => v ?? undefined),
      city: z.string().min(1, 'Cidade obrigatória!'),
      state: z.enum(BrazilianState),
      zipCode: z
        .string()
        .transform((v) => v.replace(/\D/g, ''))
        .refine((v) => v.length === 8, 'CEP inválido!'),
    }),

    social: z
      .object({
        websiteUrl: z
          .string()
          .nullish()
          .transform((v) => v || undefined)
          .pipe(z.string().url('URL inválida!').optional()),
        instagramUsername: z.string().nullish().transform((v) => v ?? undefined),
        linkedInUsername: z.string().nullish().transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    extra: z
      .object({
        observations: z.string().nullish().transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
