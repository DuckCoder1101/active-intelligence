import z from 'zod';
import CompanySchema from './company.schema';
import { CompanyDocument } from './company.document';

export type RegisterCompanyDTO = z.infer<typeof CompanySchema.registerSchema>;

export interface CompanyFullDTO extends Omit<
  CompanyDocument,
  'createdAt' | 'updatedAt'
> {
  companyId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CompanyTaskUsageDTO {
  used: number;
  limit: number | null;
  yearMonth: string;
}

export interface CompanyResumeDTO {
  companyId: string;
  displayName: string;
}
