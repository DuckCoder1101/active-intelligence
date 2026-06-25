import { Timestamp } from 'firebase-admin/firestore';
import { BrazilianState } from '../../shared/enums/brazilianState.enum';
import { BusinessSector } from '../enums/businessSector.enum';
import { CompanyStage } from '../enums/companyStage.emum';
import { RevenueRange } from '../enums/revenueRange.enum';

export interface CompanyDocument {
  displayName: string;

  cnpjIndex: string;

  legalInformation: {
    legalName?: string;
    tradeName?: string;
    documentNumber: string;
  };

  companyStage: CompanyStage;

  contact: {
    email: string;
    phone: string;
  };

  business?: {
    businessSector?: BusinessSector;
    customSegment?: string;
    cnae?: string;
    revenueRange?: RevenueRange;
    quantityOfEmployees?: number;
    quantityOfBrokers?: number;
  };

  location: {
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: BrazilianState;
    zipCode: string;
  };

  social?: {
    websiteUrl?: string;
    instagramUsername?: string;
    linkedInUsername?: string;
  };

  extra?: {
    observations?: string;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
