import {FieldValue, Transaction} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {database} from "../../utils/firebase";

import {CompanyAuditDocument} from "./company-audit.document";

type CreateAuditData = Omit<CompanyAuditDocument, "createdAt">;

export class AuditRepository {
  private static companiesCollection = database.collection("companies");

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

  static log(companyId: string, data: CreateAuditData): void {
    const ref = this.companiesCollection
      .doc(companyId)
      .collection("audits")
      .doc();

    ref.set({...data, createdAt: FieldValue.serverTimestamp()}).catch((err) => {
      logger.warn("AuditRepository.log: falha ao salvar auditoria", {
        companyId,
        action: data.action,
        err: String(err),
      });
    });
  }
}
