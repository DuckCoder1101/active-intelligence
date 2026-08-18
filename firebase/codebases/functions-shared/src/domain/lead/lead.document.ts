import { Timestamp } from "firebase-admin/firestore";

import { PropertyFeature, PROPERTY_FEATURES } from "../real-estate/propertyFeature.enum";
import type { PropertyType } from "../real-estate/propertyType.enum";

export const LEAD_PREFERENCES = PROPERTY_FEATURES;
export type LeadPreference = PropertyFeature;

export const BUSINESS_TYPES = ["compra", "venda", "locacao", "outro"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const PURPOSES = [
  "moradia_propria",
  "investimento",
  "segunda_residencia",
  "realocacao",
] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PAYMENT_METHODS = [
  "a_vista",
  "financiamento",
  "fgts",
  "consorcio",
  "permuta",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TEMPERATURES = ["frio", "morno", "quente"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export const DEAL_STATUSES = ["aberto", "vendido", "perdido"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const LEAD_SOURCES = ["manual", "facebook_ads"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface LeadDocument {
  companyId: string;
  funnelId: string;
  status: string;
  dealStatus: DealStatus;

  // Sessão 1 — Contato
  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds: string[];
  assignedTo: string[];
  notes?: string;

  // Sessão 2 — Intenção/Negócio
  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

  // Sessão 3 — Perfil de busca
  city?: string;
  state?: string;
  neighborhoods: string[];
  acceptsNearbyNeighborhoods: boolean;
  priceMin: number;
  priceMax: number;
  propertySizeM2?: number;
  bedrooms?: number;
  suites?: number;
  parkingSpots?: number;
  floor?: number;
  preferences: LeadPreference[];

  // Sessão 4 — Qualificação
  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit: boolean;
  decidesAlone: boolean;
  decidesWith?: string;
  consultedOtherRealtor: boolean;
  temperature?: Temperature;

  // Origem externa — ausente/"manual" para leads criados pela tela do CRM.
  // Preenchidos só quando o lead nasce de uma integração (ex.: Facebook Ads).
  source?: LeadSource;
  externalLeadId?: string;
  sourcePageId?: string;
  sourceFormId?: string;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
