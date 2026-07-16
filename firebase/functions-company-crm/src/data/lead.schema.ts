import { z } from "zod";

import {
  BUSINESS_TYPES,
  LEAD_PREFERENCES,
  PAYMENT_METHODS,
  PROPERTY_TYPES,
  PURPOSES,
  TEMPERATURES,
} from "../types/lead.document";

export default class LeadSchema {
  static saveSchema = z.object({
    companyId: z.string().min(1, "companyId obrigatório"),
    leadId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    status: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    name: z.string().min(1, "Nome obrigatório"),
    phone: z.string().min(1, "Telefone obrigatório"),
    email: z
      .email("E-mail inválido")
      .nullish()
      .transform((v) => v ?? undefined),
    originId: z.string().min(1, "Origem obrigatória"),
    referredBy: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    tagIds: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    assignedTo: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    notes: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    businessType: z.enum(BUSINESS_TYPES, {
      message: "Tipo de negócio inválido",
    }),
    businessTypeOther: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    propertyType: z
      .enum(PROPERTY_TYPES)
      .nullish()
      .transform((v) => v ?? undefined),
    propertyTypeOther: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    purpose: z
      .enum(PURPOSES)
      .nullish()
      .transform((v) => v ?? undefined),

    city: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    state: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    neighborhoods: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    acceptsNearbyNeighborhoods: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    priceMin: z
      .number()
      .nullish()
      .transform((v) => v ?? 0),
    priceMax: z
      .number()
      .nullish()
      .transform((v) => v ?? 1_000_000_000),
    propertySizeM2: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    bedrooms: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    suites: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    parkingSpots: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    floor: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    preferences: z
      .array(z.enum(LEAD_PREFERENCES))
      .nullish()
      .default([])
      .transform((v) => v ?? []),

    paymentMethod: z
      .enum(PAYMENT_METHODS)
      .nullish()
      .transform((v) => v ?? undefined),
    hasApprovedOrSimulatedCredit: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    decidesAlone: z
      .boolean()
      .nullish()
      .transform((v) => v ?? true),
    decidesWith: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    consultedOtherRealtor: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    temperature: z
      .enum(TEMPERATURES)
      .nullish()
      .transform((v) => v ?? undefined),
  });

  static updateStatusSchema = z.object({
    companyId: z.string().min(1, "companyId obrigatório"),
    leadId: z.string().min(1, "leadId obrigatório"),
    status: z.string().min(1, "Status inválido"),
  });
}
