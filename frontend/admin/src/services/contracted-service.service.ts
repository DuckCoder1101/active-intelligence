import { httpsCallable } from 'firebase/functions';

import type { ContractedService } from '@/models/contracted-service.model';
import { functions } from '@/utils/firebase.util';

export default class ContractedServiceService {
  private static listContractedServicesCallable = httpsCallable<
    void,
    ContractedService[]
  >(functions, 'listContractedServicesHandler');

  private static saveContractedServiceCallable = httpsCallable<
    { name: string },
    ContractedService
  >(functions, 'saveContractedServiceHandler');

  static async listContractedServices(): Promise<ContractedService[]> {
    const result = await this.listContractedServicesCallable();
    return result.data;
  }

  static async saveContractedService(
    name: string,
  ): Promise<ContractedService> {
    const result = await this.saveContractedServiceCallable({ name });
    return result.data;
  }
}
