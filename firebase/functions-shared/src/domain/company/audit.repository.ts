import { FieldValue, Transaction } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { database } from "../../utils/firebase";

import { CompanyAuditDocument } from "./company-audit.document";

type CreateAuditData = Omit<CompanyAuditDocument, "createdAt">;

/**
 * Firestore: `companies/{companyId}/audits`. Write-only — no read/list/getById here,
 * this repo exists purely to record entries; querying is done ad hoc by callers
 * (e.g. `listAuditLogs` in functions-company) directly against the collection.
 */
export class AuditRepository {
  private static companiesCollection = database.collection("companies");

  /** Writes an audit entry inside a caller-supplied transaction — use when the audit must be atomic with another write. */
  static create(
    companyId: string,
    data: CreateAuditData,
    tx: Transaction,
  ): void {
    const ref = this.companiesCollection
      .doc(companyId)
      .collection("audits")
      .doc();

    tx.set(ref, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  /** Fire-and-forget write — not awaited by callers; failures are logged and swallowed, never thrown. */
  static log(companyId: string, data: CreateAuditData): void {
    const ref = this.companiesCollection
      .doc(companyId)
      .collection("audits")
      .doc();

    ref
      .set({ ...data, createdAt: FieldValue.serverTimestamp() })
      .catch((err) => {
        logger.warn("AuditRepository.log: falha ao salvar auditoria", {
          companyId,
          action: data.action,
          err: String(err),
        });
      });
  }
}
