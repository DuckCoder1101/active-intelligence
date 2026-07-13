import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {z} from "zod";

import {onCallHandler, requireAccess} from "functions-shared";

import {
  ContractedServiceRepository,
} from "../repositories/contracted-service.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório")
    .max(60, "Máximo 60 caracteres"),
});

export const saveContractedServiceHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  logger.info("saveContractedService", {name: data.name});

  return ContractedServiceRepository.save(data.name);
});
