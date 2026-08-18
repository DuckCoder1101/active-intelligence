import { Timestamp } from "firebase-admin/firestore";

export interface CompanyOperationalResponsibleUids {
  cronograma?: string;
  campanhas?: string;
  cs?: string;
}

export interface CompanyOperationalDocument {
  driveUrl?: string;
  metaAdsAccountId?: string;
  metaApiKey?: string;
  responsibleUids?: CompanyOperationalResponsibleUids;
  updatedAt: Timestamp;
  updatedBy: string;
}
