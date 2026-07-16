import type {
  BusinessType,
  LeadPreference,
  PaymentMethod,
  PropertyType,
  Purpose,
  Temperature,
} from "./lead.document";

export interface LeadDTO {
  leadId: string;
  companyId: string;
  status: string;

  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds: string[];
  assignedTo: string[];
  notes?: string;

  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

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

  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit: boolean;
  decidesAlone: boolean;
  decidesWith?: string;
  consultedOtherRealtor: boolean;
  temperature?: Temperature;

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveLeadDTO {
  leadId?: string;
  status?: string;

  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds?: string[];
  assignedTo?: string[];
  notes?: string;

  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

  city?: string;
  state?: string;
  neighborhoods?: string[];
  acceptsNearbyNeighborhoods?: boolean;
  priceMin?: number;
  priceMax?: number;
  propertySizeM2?: number;
  bedrooms?: number;
  suites?: number;
  parkingSpots?: number;
  floor?: number;
  preferences?: LeadPreference[];

  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit?: boolean;
  decidesAlone?: boolean;
  decidesWith?: string;
  consultedOtherRealtor?: boolean;
  temperature?: Temperature;
}
