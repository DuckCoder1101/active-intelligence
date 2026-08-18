import type { PlanBillingType, PlanFeature } from "./plan.document";

export interface PlanDTO {
  planId: string;
  name: string;
  billingType: PlanBillingType;
  value: number;
  features: PlanFeature[];
  taskLimit: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavePlanDTO {
  planId?: string;
  name: string;
  billingType: PlanBillingType;
  value: number;
  features: PlanFeature[];
  taskLimit: number;
}
