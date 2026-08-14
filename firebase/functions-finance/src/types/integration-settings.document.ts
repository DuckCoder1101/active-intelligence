import { Timestamp } from "firebase-admin/firestore";

export const INTEGRATION_ENVIRONMENTS = ["sandbox", "production"] as const;
export type IntegrationEnvironment = (typeof INTEGRATION_ENVIRONMENTS)[number];

/** `apiKey` is never persisted here — it comes from the `ASAAS_API_KEY` env var (see functions-finance/.env). */
export interface IntegrationSettingsDocument {
  environment: IntegrationEnvironment;
  updatedAt: Timestamp;
}

/** `configured` reflects whether the integration's env var is set, not Firestore state. */
export interface IntegrationSettingsStatusDTO {
  configured: boolean;
  environment?: IntegrationEnvironment;
  updatedAt?: number;
}
