import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { database } from '@shared/firebase';

import { CompanyAuditDocument } from '../types/company-audit.document';

type CreateAuditData = Omit<CompanyAuditDocument, 'createdAt'>;

export class AuditRepository {
  private static companiesCollection = database.collection('companies');

  static create(
    companyId: string,
    data: CreateAuditData,
    tx: Transaction,
  ): void {
    const ref = this.companiesCollection
      .doc(companyId)
      .collection('audits')
      .doc();

    tx.set(ref, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}
