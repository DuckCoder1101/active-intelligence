import { Timestamp } from "firebase-admin/firestore";

export const PLAN_BILLING_TYPES = ["mrr", "tcv"] as const;
export type PlanBillingType = (typeof PLAN_BILLING_TYPES)[number];

export const PLAN_FEATURES = [
  "schedule",
  "crm",
  "real-estate",
  "library",
] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

export interface PlanDocument {
  name: string;
  billingType: PlanBillingType;
  value: number;
  features: PlanFeature[];
  taskLimit: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
