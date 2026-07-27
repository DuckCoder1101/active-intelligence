import { httpsCallable } from 'firebase/functions';

import type {
  AuditLogModel,
  WorkspaceAuditLogModel,
} from '@/models/audit.model';
import type {
  CompanyOperationalRecord,
  SaveCompanyOperationalDTO,
} from '@/models/company-operational.model';
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

  private static updateCompanyStatusCallable = httpsCallable<
    { companyId: string; active: boolean },
    boolean
  >(functions, 'updateCompanyStatusHandler');

  private static listAuditLogsCallable = httpsCallable<
    { companyId: string },
    AuditLogModel[]
  >(functions, 'listAuditLogsHandler');

  private static listWorkspaceAuditLogsCallable = httpsCallable<
    { companyIds?: string[]; limit?: number },
    WorkspaceAuditLogModel[]
  >(functions, 'listWorkspaceAuditLogsHandler');

  private static getCompanyOperationalRecordCallable = httpsCallable<
    { companyId: string },
    CompanyOperationalRecord
  >(functions, 'getCompanyOperationalRecordHandler');

  private static saveCompanyOperationalRecordCallable = httpsCallable<
    SaveCompanyOperationalDTO,
    boolean
  >(functions, 'saveCompanyOperationalRecordHandler');

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

  static async updateCompanyStatus(
    companyId: string,
    active: boolean,
  ): Promise<void> {
    await this.updateCompanyStatusCallable({ companyId, active });
  }

  static async listAuditLogs(companyId: string): Promise<AuditLogModel[]> {
    const result = await this.listAuditLogsCallable({ companyId });
    return result.data;
  }

  static async listWorkspaceAuditLogs(
    companyIds: string[],
  ): Promise<WorkspaceAuditLogModel[]> {
    const result = await this.listWorkspaceAuditLogsCallable(
      companyIds.length > 0 ? { companyIds } : {},
    );
    return result.data;
  }

  static async getOperationalRecord(
    companyId: string,
  ): Promise<CompanyOperationalRecord> {
    const result = await this.getCompanyOperationalRecordCallable({
      companyId,
    });
    return result.data;
  }

  static async saveOperationalRecord(
    data: SaveCompanyOperationalDTO,
  ): Promise<void> {
    await this.saveCompanyOperationalRecordCallable(data);
  }
}
