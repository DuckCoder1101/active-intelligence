import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";

import {
  IntegrationEnvironment,
  IntegrationSettingsDocument,
} from "../types/integration-settings.document";

/** Firestore: `integration_settings` (top-level), one fixed document per integration. Only stores `environment` — the API key lives in an env var, never in the database. */
export class IntegrationSettingsRepository {
  private static col = database.collection("integration_settings");

  static async getEnvironment(integrationId: string): Promise<{
    environment?: IntegrationEnvironment;
    updatedAt?: number;
  }> {
    const snap = await this.col.doc(integrationId).get();
    if (!snap.exists) {
      return {};
    }
    const data = snap.data() as IntegrationSettingsDocument;
    return { environment: data.environment, updatedAt: data.updatedAt?.toMillis() };
  }

  static async saveEnvironment(
    integrationId: string,
    environment: IntegrationEnvironment,
  ): Promise<{ environment?: IntegrationEnvironment; updatedAt?: number }> {
    const ref = this.col.doc(integrationId);
    await ref.set(
      { environment, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return this.getEnvironment(integrationId);
  }
}
