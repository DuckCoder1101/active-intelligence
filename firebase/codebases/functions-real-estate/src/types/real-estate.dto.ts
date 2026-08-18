import type { PropertyFeature, PropertyType } from "functions-shared";

import type {
  DocumentationStatus,
  Furnishings,
  RealEstateCondition,
  RealEstateCondominium,
  RealEstateOwner,
  RealEstatePurpose,
  RealEstateStatus,
} from "./real-estate.document";

export interface RealEstateDTO {
  realEstateId: string;
  companyId: string;
  status: RealEstateStatus;

  code: string;
  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;

  owner: RealEstateOwner;

  condominium?: RealEstateCondominium;

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

  salePrice?: number;
  rentPrice?: number;
  iptuValue?: number;
  acceptsFinancing: boolean;
  acceptsExchange: boolean;
  negotiable: boolean;

  features: PropertyFeature[];

  photos: string[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  tourUrl?: string;

  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;

  visibleOnWebsite: boolean;
  featured: boolean;
  publicDescription?: string;
  portals?: string[];

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveRealEstateDTO {
  companyId: string;
  realEstateId?: string;
  status?: RealEstateStatus;

  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;

  owner: RealEstateOwner;

  condominium?: RealEstateCondominium;

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

  usableAreaM2?: number;
  totalAreaM2?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpots?: number;
  floor?: number;
  buildingFloors?: number;
  condition?: RealEstateCondition;
  furnishings?: Furnishings;

  salePrice?: number;
  rentPrice?: number;
  iptuValue?: number;
  acceptsFinancing?: boolean;
  acceptsExchange?: boolean;
  negotiable?: boolean;

  features?: PropertyFeature[];

  photos?: string[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  tourUrl?: string;

  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;

  visibleOnWebsite?: boolean;
  featured?: boolean;
  publicDescription?: string;
  portals?: string[];
}
