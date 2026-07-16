import { FieldValue } from "firebase-admin/firestore";
import { database } from "../../utils/firebase";
import { CompanyOperationalDocument } from "./company-operational.document";
import {
  CompanyOperationalDTO,
  SaveCompanyOperationalDTO,
} from "./company-operational.type";

export class CompanyOperationalRepository {
  private static collection = database.collection("company_operational");

  static async getByCompanyId(
    companyId: string,
  ): Promise<CompanyOperationalDTO> {
    const doc = await this.collection.doc(companyId).get();

    if (!doc.exists) {
      return { companyId, hasMetaApiKey: false, updatedAt: 0, updatedBy: "" };
    }

    const data = doc.data() as CompanyOperationalDocument;

    return {
      companyId,
      driveUrl: data.driveUrl,
      metaAdsAccountId: data.metaAdsAccountId,
      hasMetaApiKey: !!data.metaApiKey,
      responsibleUids: data.responsibleUids,
      updatedAt: data.updatedAt?.toMillis() ?? 0,
      updatedBy: data.updatedBy ?? "",
    };
  }

  // `ignoreUndefinedProperties` (utils/firebase.ts) means fields left
  // `undefined` here (e.g. metaApiKey when the admin didn't touch it) are
  // never written, so `merge: true` preserves whatever was already saved.
  static async save(
    { companyId, ...rest }: SaveCompanyOperationalDTO,
    updatedBy: string,
  ): Promise<void> {
    const ref = this.collection.doc(companyId);

    await ref.set(
      {
        ...rest,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy,
      },
      { merge: true },
    );
  }
}
