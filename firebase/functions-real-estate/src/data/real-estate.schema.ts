import { z } from "zod";

import { PROPERTY_FEATURES, PROPERTY_TYPES } from "functions-shared";
import {
  DOCUMENTATION_STATUSES,
  FURNISHINGS_OPTIONS,
  REAL_ESTATE_CONDITIONS,
  REAL_ESTATE_PURPOSES,
  REAL_ESTATE_STATUSES,
} from "../types/real-estate.document";

const ownerSchema = z.object({
  name: z.string().min(1, "Nome do proprietário obrigatório"),
  phone: z.string().min(1, "Telefone do proprietário obrigatório"),
  email: z
    .email("E-mail inválido")
    .nullish()
    .transform((v) => v ?? undefined),
});

const condominiumSchema = z.object({
  condominiumFee: z
    .number()
    .nullish()
    .transform((v) => v ?? undefined),
  condominiumName: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export default class RealEstateSchema {
  static saveSchema = z.object({
    companyId: z.string().min(1, "companyId obrigatório"),
    realEstateId: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    status: z
      .enum(REAL_ESTATE_STATUSES)
      .nullish()
      .transform((v) => v ?? undefined),

    title: z
      .string()
      .max(60, "Título deve ter no máximo 60 caracteres")
      .nullish()
      .transform((v) => v ?? undefined),
    description: z
      .string()
      .max(2500, "Descrição deve ter no máximo 2500 caracteres")
      .nullish()
      .transform((v) => v ?? undefined),
    propertyType: z.enum(PROPERTY_TYPES, {
      message: "Tipo de imóvel inválido",
    }),
    propertyTypeOther: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    purposes: z
      .array(z.enum(REAL_ESTATE_PURPOSES))
      .min(1, "Selecione ao menos uma finalidade"),
    internalNotes: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    owner: ownerSchema,

    condominium: condominiumSchema
      .nullish()
      .transform((v) => v ?? undefined),

    address: z.string().min(1, "Endereço obrigatório"),
    addressNumber: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    complement: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    neighborhood: z.string().min(1, "Bairro obrigatório"),
    city: z.string().min(1, "Cidade obrigatória"),
    region: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    state: z.string().min(1, "Estado obrigatório"),
    zipCode: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    lat: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    lng: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    block: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    usableAreaM2: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    totalAreaM2: z
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
    bathrooms: z
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
    buildingFloors: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    condition: z
      .enum(REAL_ESTATE_CONDITIONS)
      .nullish()
      .transform((v) => v ?? undefined),
    furnishings: z
      .enum(FURNISHINGS_OPTIONS)
      .nullish()
      .transform((v) => v ?? "nao"),

    salePrice: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    rentPrice: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    iptuValue: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    acceptsFinancing: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    acceptsExchange: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    negotiable: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),

    features: z
      .array(z.enum(PROPERTY_FEATURES))
      .nullish()
      .default([])
      .transform((v) => v ?? []),

    photos: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
    coverPhotoUrl: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    videoUrl: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    tourUrl: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    registryNumber: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    documentationStatus: z
      .enum(DOCUMENTATION_STATUSES)
      .nullish()
      .transform((v) => v ?? undefined),
    iptuNumber: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),

    visibleOnWebsite: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    featured: z
      .boolean()
      .nullish()
      .transform((v) => v ?? false),
    publicDescription: z
      .string()
      .nullish()
      .transform((v) => v ?? undefined),
    portals: z
      .array(z.string())
      .nullish()
      .default([])
      .transform((v) => v ?? []),
  });

  static updateStatusSchema = z.object({
    companyId: z.string().min(1, "companyId obrigatório"),
    realEstateId: z.string().min(1, "realEstateId obrigatório"),
    status: z.enum(REAL_ESTATE_STATUSES, { message: "Status inválido" }),
  });
}
