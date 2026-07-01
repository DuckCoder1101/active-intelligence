import { httpsCallable } from 'firebase/functions';

import type { AuditLogModel } from '@/models/audit.model';
import type {
  Company,
  SaveCompanyDTO,
} from '@/models/company.model';
import { functions } from '@/utils/firebase.util';


export default class CompanyService {
  private static listCompaniesCallable = httpsCallable<void, Company[]>(
    functions,
    'listCompaniesHandler',
  );

  private static getCompanyCallable = httpsCallable<
    { companyId: string },
    Company
  >(functions, 'getCompanyHandler');

  private static saveCompanyCallable = httpsCallable<SaveCompanyDTO, boolean>(
    functions,
    'saveCompanyHandler',
  );

  private static deleteCompanyCallable = httpsCallable<
    { companyId: string },
    boolean
  >(functions, 'deleteCompanyHandler');

  private static listAuditLogsCallable = httpsCallable<
    { companyId: string },
    AuditLogModel[]
  >(functions, 'listAuditLogsHandler');

  static async listCompanies(): Promise<Company[]> {
    const result = await this.listCompaniesCallable();
    return result.data;
  }

  static async getCompany(companyId: string): Promise<Company> {
    const result = await this.getCompanyCallable({ companyId });
    return result.data;
  }

  static async saveCompany(data: SaveCompanyDTO): Promise<void> {
    await this.saveCompanyCallable(data);
  }

  static async deleteCompany(companyId: string): Promise<void> {
    await this.deleteCompanyCallable({ companyId });
  }

  static async listAuditLogs(companyId: string): Promise<AuditLogModel[]> {
    const result = await this.listAuditLogsCallable({ companyId });
    return result.data;
  }
}
