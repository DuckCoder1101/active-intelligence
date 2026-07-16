import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  database,
  requireAccess,
  CompanyAuditDocument,
} from "functions-shared";

import { mapAuditLogDoc } from "../utils/audit-log.mapper";

const ACCESS = {
  minAccessLevel: "admin" as const,
};

const schema = z.object({
  companyIds: z.array(z.string().min(1)).max(50).optional(),
  limit: z.number().int().min(1).max(300).optional(),
});

export const listWorkspaceAuditLogsHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data } = schema.safeParse(req.data ?? {});

  if (!success) {
    throw new HttpsError("invalid-argument", "Parâmetros inválidos!");
  }

  const limit = data.limit ?? 200;

  logger.info("listWorkspaceAuditLogs", {
    companyCount: data.companyIds?.length ?? 0,
    limit,
  });

  let docs;

  if (data.companyIds && data.companyIds.length > 0) {
    const snapshots = await Promise.all(
      data.companyIds.map((companyId) =>
        database
          .collection("companies")
          .doc(companyId)
          .collection("audits")
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get(),
      ),
    );

    docs = snapshots
      .flatMap((snapshot) => snapshot.docs)
      .sort((a, b) => {
        const aData = a.data() as CompanyAuditDocument;
        const bData = b.data() as CompanyAuditDocument;
        return bData.createdAt.toMillis() - aData.createdAt.toMillis();
      })
      .slice(0, limit);
  } else {
    const snapshot = await database
      .collectionGroup("audits")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    docs = snapshot.docs;
  }

  return Promise.all(docs.map(mapAuditLogDoc));
});
