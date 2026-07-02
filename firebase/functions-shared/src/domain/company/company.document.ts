import { Timestamp } from 'firebase-admin/firestore';
import { BrazilianState } from '../../enums/brazilianState.enum';
import { BusinessSector } from './businessSector.enum';
import { CompanyStage } from './companyStage.emum';
import { RevenueRange } from './revenueRange.enum';

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
    zipCode?: string;
  };

  social?: {
    websiteUrl?: string;
    instagramUsername?: string;
    linkedInUsername?: string;
  };

  extra?: {
    observations?: string;
  };

  monthlyTaskLimit?: number;
  taskUsage?: {
    yearMonth: string;
    count: number;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
