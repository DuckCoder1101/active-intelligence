import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { onCallHandler, database, requireAccess } from "functions-shared";

import { mapAuditLogDoc } from "../utils/audit-log.mapper";

const ACCESS = {
  minAccessLevel: "admin" as const,
};

const schema = z.object({ companyId: z.string().min(1) });

export const listAuditLogsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data } = schema.safeParse(req.data);

  if (!success) {
    throw new HttpsError("invalid-argument", "companyId inválido!");
  }

  logger.info("listAuditLogs", { companyId: data.companyId });

  const snapshot = await database
    .collection("companies")
    .doc(data.companyId)
    .collection("audits")
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) return [];

  return Promise.all(snapshot.docs.map(mapAuditLogDoc));
});
