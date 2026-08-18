import { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { CompanyAuditDocument } from "functions-shared";

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

const UNKNOWN_NAME = "(desconhecido)";

/** UIDs de admin cujo nome ainda precisa ser resolvido (actor sem nome denormalizado + todo target). */
export function collectAuditAdminUids(docs: QueryDocumentSnapshot[]): string[] {
  const uids = new Set<string>();
  for (const doc of docs) {
    const audit = doc.data() as CompanyAuditDocument;
    if (!audit.actorName) uids.add(audit.actorUid);
    if (audit.targetUid) uids.add(audit.targetUid);
  }
  return [...uids];
}

export function mapAuditLogDoc(
  doc: QueryDocumentSnapshot,
  nameByUid: Map<string, string>,
): AuditLogDTO {
  const audit = doc.data() as CompanyAuditDocument;

  const actorName =
    audit.actorName ?? nameByUid.get(audit.actorUid) ?? UNKNOWN_NAME;
  const targetName = audit.targetUid ?
    (nameByUid.get(audit.targetUid) ?? UNKNOWN_NAME) :
    null;

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
