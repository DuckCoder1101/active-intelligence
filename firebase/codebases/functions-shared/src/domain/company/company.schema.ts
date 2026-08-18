import { z } from "zod";

import { BrazilianState } from "../../enums/brazilianState.enum";
import { checkCnpj } from "../../validations/checkCNPJ";
import { stripMask } from "../../validations/mask.util";
import { BusinessSector } from "./businessSector.enum";
import { RevenueRange } from "./revenueRange.enum";
import { CompanyStage } from "./companyStage.emum";

const financialObjectSchema = z
  .object({
    contractedServiceIds: z.array(z.string()).default([]),

    contractType: z
      .enum(["mrr", "tcv"])
      .nullish()
      .transform((v) => v ?? undefined),

    administrativeResponsibleUid: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    mrr: z
      .object({
        monthlyValue: z.number().positive("Valor mensal deve ser positivo!"),
        paymentMethod: z.enum(["pix", "boleto", "cartao"]),
        dueDay: z.number().int().min(1).max(31),
        loyaltyMonths: z
          .number()
          .int()
          .positive()
          .nullish()
          .transform((v) => v ?? undefined),
        startDate: z.number(),
        endDate: z
          .number()
          .nullish()
          .transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    tcv: z
      .object({
        totalValue: z.number().positive("Valor total deve ser positivo!"),
        paymentType: z.enum(["avista", "parcelado"]),
        paymentMethod: z
          .enum(["pix", "boleto", "cartao"])
          .nullish()
          .transform((v) => v ?? undefined),
        installments: z
          .number()
          .int()
          .positive()
          .nullish()
          .transform((v) => v ?? undefined),
        installmentValue: z
          .number()
          .positive()
          .nullish()
          .transform((v) => v ?? undefined),
        startDate: z.number(),
        endDate: z.number(),
      })
      .nullish()
      .transform((v) => v ?? undefined),
  })
  .superRefine((financial, ctx) => {
    if (financial.contractType === "mrr" && !financial.mrr) {
      ctx.addIssue({
        code: "custom",
        message: "Dados do contrato recorrente (MRR) obrigatórios!",
        path: ["mrr"],
      });
    }

    if (financial.contractType === "tcv") {
      if (!financial.tcv) {
        ctx.addIssue({
          code: "custom",
          message: "Dados do contrato fechado (TCV) obrigatórios!",
          path: ["tcv"],
        });
      } else if (
        financial.tcv.paymentType === "avista" &&
        !financial.tcv.paymentMethod
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Forma de pagamento obrigatória!",
          path: ["tcv", "paymentMethod"],
        });
      } else if (financial.tcv.paymentType === "parcelado") {
        if (!financial.tcv.installments) {
          ctx.addIssue({
            code: "custom",
            message: "Número de parcelas obrigatório!",
            path: ["tcv", "installments"],
          });
        }
        if (!financial.tcv.installmentValue) {
          ctx.addIssue({
            code: "custom",
            message: "Valor por parcela obrigatório!",
            path: ["tcv", "installmentValue"],
          });
        }
      }
    }
  });

export default class CompanySchema {
  static registerSchema = z.object({
    companyId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    displayName: z.string().min(2, "Nome muito curto!"),

    legalInformation: z.object({
      legalName: z
        .string()
        .min(5, "Razão social muito curta!")
        .max(80, "Razão social muito longa!")
        .nullish()
        .transform((v) => v ?? undefined),
      tradeName: z
        .string()
        .min(5, "Nome fantasia muito curto!")
        .max(80, "Nome fantasia muito longo!")
        .nullish()
        .transform((v) => v ?? undefined),
      // Salvo COM máscara (dígito verificador validado sobre a versão sem máscara).
      documentNumber: z.string().refine(checkCnpj, "CNPJ inválido!"),
    }),

    companyStage: z.enum(CompanyStage).default(CompanyStage.comercial),

    contact: z.object({
      email: z.email("E-mail inválido!").max(60, "E-mail muito longo!"),
      // Salvo COM máscara.
      phone: z.string(),
    }),

    business: z
      .object({
        businessSector: z
          .enum(BusinessSector)
          .nullish()
          .transform((v) => v ?? undefined),
        customSegment: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
        cnae: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
        revenueRange: z
          .enum(RevenueRange)
          .nullish()
          .transform((v) => v ?? undefined),
        quantityOfEmployees: z
          .number()
          .int()
          .nonnegative()
          .nullish()
          .transform((v) => v ?? undefined),
        quantityOfBrokers: z
          .number()
          .int()
          .nonnegative()
          .nullish()
          .transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    location: z.object({
      address: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      number: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      complement: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      neighborhood: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      city: z.string().min(1, "Cidade obrigatória!"),
      state: z.enum(BrazilianState),
      zipCode: z
        .string()
        .nullish()
        .transform((v) => (v ? stripMask(v) : undefined))
        .refine((v) => v === undefined || v.length === 8, "CEP inválido!"),
    }),

    social: z
      .object({
        websiteUrl: z
          .string()
          .max(50, "URL muito longa!")
          .nullish()
          .transform((v) => v || undefined)
          .pipe(z.string().url("URL inválida!").optional()),
        instagramUsername: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
        linkedInUsername: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    extra: z
      .object({
        observations: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),

    financial: financialObjectSchema.nullish().transform((v) => v ?? undefined),

    monthlyTaskLimit: z
      .number()
      .int()
      .positive()
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
