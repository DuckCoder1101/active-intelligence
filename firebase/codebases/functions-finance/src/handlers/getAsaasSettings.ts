import { onCallHandler, requireAccess } from "functions-shared";
import { IntegrationSettingsRepository } from "../repositories/integration-settings.repository";
import { IntegrationSettingsStatusDTO } from "../types/integration-settings.document";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-settings" as const],
};

/**
 * Returns the Asaas integration status. `configured` reflects the ASAAS_API_KEY
 * env var (functions-finance/.env), never a Firestore-stored key.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-settings"]}).
 * Schema: none.
 */
export const getAsaasSettingsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  const { environment, updatedAt } =
    await IntegrationSettingsRepository.getEnvironment("asaas");
  const result: IntegrationSettingsStatusDTO = {
    configured: !!process.env.ASAAS_API_KEY,
    environment,
    updatedAt,
  };
  return result;
});
