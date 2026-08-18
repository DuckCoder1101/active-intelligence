import { Timestamp } from "firebase-admin/firestore";

import type { PropertyFeature, PropertyType } from "functions-shared";

export const REAL_ESTATE_STATUSES = [
  "disponivel",
  "reservado",
  "vendido",
  "alugado",
  "inativo",
] as const;
export type RealEstateStatus = (typeof REAL_ESTATE_STATUSES)[number];

export const REAL_ESTATE_PURPOSES = ["venda", "locacao"] as const;
export type RealEstatePurpose = (typeof REAL_ESTATE_PURPOSES)[number];

export const REAL_ESTATE_CONDITIONS = ["novo", "usado", "na_planta"] as const;
export type RealEstateCondition = (typeof REAL_ESTATE_CONDITIONS)[number];

export const FURNISHINGS_OPTIONS = ["sim", "nao", "parcialmente"] as const;
export type Furnishings = (typeof FURNISHINGS_OPTIONS)[number];

export const DOCUMENTATION_STATUSES = ["regularizado", "pendente"] as const;
export type DocumentationStatus = (typeof DOCUMENTATION_STATUSES)[number];

export interface RealEstateOwner {
  name: string;
  phone: string;
  email?: string;
}

export interface RealEstateCondominium {
  condominiumFee?: number;
  condominiumName?: string;
}

export interface RealEstateDocument {
  companyId: string;
  status: RealEstateStatus;

  // Identificação
  code: string;
  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;

  // Proprietário
  owner: RealEstateOwner;

  // Ativado somente quando "Está em condomínio?" estiver marcado
  condominium?: RealEstateCondominium;

  // Localização
  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  region?: string;
  state: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
  block?: string;

  // Características
  usableAreaM2?: number;
  totalAreaM2?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpots?: number;
  floor?: number;
  buildingFloors?: number;
  condition?: RealEstateCondition;
  furnishings: Furnishings;

  // Valores
  salePrice?: number;
  rentPrice?: number;
  iptuValue?: number;
  acceptsFinancing: boolean;
  acceptsExchange: boolean;
  negotiable: boolean;

  // Comodidades
  features: PropertyFeature[];

  // Mídia
  photos: string[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  tourUrl?: string;

  // Documentação
  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;

  // Publicação
  visibleOnWebsite: boolean;
  featured: boolean;
  publicDescription?: string;
  portals?: string[];

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
