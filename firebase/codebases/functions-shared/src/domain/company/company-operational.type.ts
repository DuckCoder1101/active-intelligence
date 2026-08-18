import { z } from "zod";
import CompanyOperationalSchema from "./company-operational.schema";
import { CompanyOperationalResponsibleUids } from "./company-operational.document";

export type SaveCompanyOperationalDTO = z.infer<
  typeof CompanyOperationalSchema.saveSchema
>;

export interface CompanyOperationalDTO {
  companyId: string;
  driveUrl?: string;
  metaAdsAccountId?: string;
  hasMetaApiKey: boolean;
  responsibleUids?: CompanyOperationalResponsibleUids;
  updatedAt: number;
  updatedBy: string;
}
