import { httpsCallable } from 'firebase/functions';

import type { Plan, SavePlanDTO } from '@/models/plan.model';
import { functions } from '@/utils/firebase.util';

export default class PlanService {
  private static listPlansCallable = httpsCallable<void, Plan[]>(
    functions,
    'listPlansHandler',
  );

  private static savePlanCallable = httpsCallable<SavePlanDTO, Plan>(
    functions,
    'savePlanHandler',
  );

  private static deletePlanCallable = httpsCallable<
    { planId: string },
    void
  >(functions, 'deletePlanHandler');

  static async listPlans(): Promise<Plan[]> {
    const r = await this.listPlansCallable();
    return r.data;
  }

  static async savePlan(dto: SavePlanDTO): Promise<Plan> {
    const r = await this.savePlanCallable(dto);
    return r.data;
  }

  static async deletePlan(planId: string): Promise<void> {
    await this.deletePlanCallable({ planId });
  }
}
