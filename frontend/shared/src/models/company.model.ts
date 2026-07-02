export type CompanyStage = 'comercial' | 'operacional';

export type BusinessSector =
  | 'imobiliaria'
  | 'construtora'
  | 'incorporadora'
  | 'corretor_autonomo'
  | 'outro';

export type RevenueRange =
  | 'UpTo500K'
  | 'From500KTo2M'
  | 'From2MTo5M'
  | 'From5MTo10M'
  | 'From10MTo30M'
  | 'From30MTo100M'
  | 'Above100M';

export interface CompanyResume {
  companyId: string;
  displayName: string;
}

export interface Company {
  companyId: string;
  displayName: string;
  companyStage: CompanyStage;
  legalInformation: {
    legalName?: string;
    tradeName?: string;
    documentNumber: string;
  };
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
    state: string;
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
  createdAt: number;
  updatedAt: number;
}

export interface SaveCompanyDTO {
  companyId?: string;
  displayName: string;
  companyStage?: CompanyStage;
  legalInformation: {
    legalName?: string;
    tradeName?: string;
    documentNumber: string;
  };
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
    state: string;
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
}
