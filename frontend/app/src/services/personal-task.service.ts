import { httpsCallable } from 'firebase/functions';

import type { PersonalTask, SavePersonalTaskDTO } from '@/models/personal-task.model';
import { functions } from '@/utils/firebase.util';

export default class PersonalTaskService {
  private static listCallable = httpsCallable<
    { companyId?: string } | undefined,
    PersonalTask[]
  >(functions, 'listPersonalTasksHandler');

  private static saveCallable = httpsCallable<
    SavePersonalTaskDTO & { companyId?: string },
    PersonalTask
  >(functions, 'savePersonalTaskHandler');

  private static deleteCallable = httpsCallable<
    { personalTaskId: string; companyId?: string },
    boolean
  >(functions, 'deletePersonalTaskHandler');

  // `companyId` só é necessário quando quem chama é admin/owner testando o
  // portal do cliente — para um usuário 'user' o backend já resolve pelo
  // próprio token, mas mandamos sempre que disponível pra cobrir os dois casos.
  static async listPersonalTasks(companyId?: string): Promise<PersonalTask[]> {
    const r = await this.listCallable(companyId ? { companyId } : undefined);
    return r.data;
  }

  static async savePersonalTask(
    data: SavePersonalTaskDTO,
    companyId?: string,
  ): Promise<PersonalTask> {
    const r = await this.saveCallable({ ...data, companyId });
    return r.data;
  }

  static async deletePersonalTask(
    personalTaskId: string,
    companyId?: string,
  ): Promise<void> {
    await this.deleteCallable({ personalTaskId, companyId });
  }
}
