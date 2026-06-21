import { httpsCallable } from 'firebase/functions';

import { functions } from '@/utils/firebase.util';

import type { Company, CompanyResume, SaveCompanyDTO } from '@t/company.model';

export default class CompanyService {
  private static listCompaniesCallable = httpsCallable<void, Company[]>(
    functions,
    'listCompaniesHandler',
  );

  private static getMyCompaniesCallable = httpsCallable<void, CompanyResume[]>(
    functions,
    'getMyCompaniesHandler',
  );

  private static saveCompanyCallable = httpsCallable<SaveCompanyDTO, boolean>(
    functions,
    'saveCompanyHandler',
  );

  private static deleteCompanyCallable = httpsCallable<
    { companyId: string },
    boolean
  >(functions, 'deleteCompanyHandler');

  static async listCompanies(): Promise<Company[]> {
    const result = await this.listCompaniesCallable();
    return result.data;
  }

  static async getMyCompanies(): Promise<CompanyResume[]> {
    const result = await this.getMyCompaniesCallable();
    return result.data;
  }

  static async saveCompany(data: SaveCompanyDTO): Promise<void> {
    await this.saveCompanyCallable(data);
  }

  static async deleteCompany(companyId: string): Promise<void> {
    await this.deleteCompanyCallable({ companyId });
  }
}
