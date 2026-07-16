import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import { AdminRepository, CompanyAuditDocument } from "functions-shared";

export interface AuditLogDTO {
  id: string;
  companyId: string;
  action: CompanyAuditDocument["action"];
  actorName: string;
  targetName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  details: string | null;
  createdAt: number;
}

export async function mapAuditLogDoc(
  doc: QueryDocumentSnapshot,
): Promise<AuditLogDTO> {
  const audit = doc.data() as CompanyAuditDocument;

  const [actorName, targetName] = await Promise.all([
    audit.actorName ?
      Promise.resolve(audit.actorName) :
      AdminRepository.getResumeByUid(audit.actorUid)
        .then((r) => r.name)
        .catch((err) => {
          logger.warn("mapAuditLogDoc: falha ao resolver actor", {
            uid: audit.actorUid,
            err: String(err),
          });
          return "(desconhecido)";
        }),
    audit.targetUid ?
      AdminRepository.getResumeByUid(audit.targetUid)
        .then((r) => r.name)
        .catch((err) => {
          logger.warn("mapAuditLogDoc: falha ao resolver target", {
            uid: audit.targetUid,
            err: String(err),
          });
          return "(desconhecido)";
        }) :
      Promise.resolve(null),
  ]);

  return {
    id: doc.id,
    // audits é subcoleção de companies/{companyId}
    companyId: doc.ref.parent.parent?.id ?? "",
    action: audit.action,
    actorName,
    targetName,
    taskId: audit.taskId ?? null,
    taskTitle: audit.taskTitle ?? null,
    details: audit.details ?? null,
    createdAt: audit.createdAt.toMillis(),
  };
}
