export interface CompanyOperationalResponsibleUids {
  cronograma?: string;
  campanhas?: string;
  cs?: string;
}

export interface CompanyOperationalRecord {
  companyId: string;
  driveUrl?: string;
  metaAdsAccountId?: string;
  hasMetaApiKey: boolean;
  responsibleUids?: CompanyOperationalResponsibleUids;
  updatedAt: number;
  updatedBy: string;
}

export interface SaveCompanyOperationalDTO {
  companyId: string;
  driveUrl?: string;
  metaAdsAccountId?: string;
  metaApiKey?: string;
  responsibleUids?: CompanyOperationalResponsibleUids;
}
