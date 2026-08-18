import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler, requireAccess } from "functions-shared";
import { IntegrationSettingsRepository } from "../repositories/integration-settings.repository";
import {
  INTEGRATION_ENVIRONMENTS,
  IntegrationSettingsStatusDTO,
} from "../types/integration-settings.document";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

const schema = z.object({
  environment: z.enum(INTEGRATION_ENVIRONMENTS, {
    message: "Ambiente inválido",
  }),
});

/**
 * Saves the Asaas `environment`. The apiKey is never accepted here — it comes
 * from the ASAAS_API_KEY env var (functions-finance/.env).
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-settings"]}).
 * Schema: inline z.object({environment}).
 */
export const saveAsaasSettingsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveAsaasSettings", { environment: data.environment });

  const { environment, updatedAt } =
    await IntegrationSettingsRepository.saveEnvironment(
      "asaas",
      data.environment,
    );
  const result: IntegrationSettingsStatusDTO = {
    configured: !!process.env.ASAAS_API_KEY,
    environment,
    updatedAt,
  };
  return result;
});
