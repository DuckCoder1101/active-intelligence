import { httpsCallable } from 'firebase/functions';

import type {
  CompanyInternalTask,
  SaveCompanyInternalTaskDTO,
} from '@/models/company-internal-task.model';
import { functions } from '@/utils/firebase.util';

export default class CompanyInternalTaskService {
  private static listCallable = httpsCallable<
    { companyId?: string } | undefined,
    CompanyInternalTask[]
  >(functions, 'listCompanyInternalTasksHandler');

  private static saveCallable = httpsCallable<
    SaveCompanyInternalTaskDTO & { companyId?: string },
    CompanyInternalTask
  >(functions, 'saveCompanyInternalTaskHandler');

  private static deleteCallable = httpsCallable<
    { companyInternalTaskId: string; companyId?: string },
    boolean
  >(functions, 'deleteCompanyInternalTaskHandler');

  // `companyId` só é necessário quando quem chama é admin/owner testando o
  // portal do cliente — para um usuário 'user' o backend já resolve pelo
  // próprio token, mas mandamos sempre que disponível pra cobrir os dois casos.
  static async listCompanyInternalTasks(
    companyId?: string,
  ): Promise<CompanyInternalTask[]> {
    const r = await this.listCallable(companyId ? { companyId } : undefined);
    return r.data;
  }

  static async saveCompanyInternalTask(
    data: SaveCompanyInternalTaskDTO,
    companyId?: string,
  ): Promise<CompanyInternalTask> {
    const r = await this.saveCallable({ ...data, companyId });
    return r.data;
  }

  static async deleteCompanyInternalTask(
    companyInternalTaskId: string,
    companyId?: string,
  ): Promise<void> {
    await this.deleteCallable({ companyInternalTaskId, companyId });
  }
}
