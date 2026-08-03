import { onCallHandler, requireAccess } from "functions-shared";

import {
  ContractedServiceRepository,
} from "../repositories/contracted-service.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

/**
 * Lists contracted-service catalog entries.
 * Auth: `requireAccess` — minAccessLevel "admin", permission "manage-finance".
 * Schema: none.
 */
export const listContractedServicesHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);
  return ContractedServiceRepository.listAll();
});
