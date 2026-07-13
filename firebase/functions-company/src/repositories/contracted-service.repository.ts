import {FieldValue} from "firebase-admin/firestore";
import {database} from "functions-shared";

import {
  ContractedServiceDocument,
  ContractedServiceDTO,
} from "../types/contracted-service.type";

export class ContractedServiceRepository {
  private static col = database.collection("contracted_services");

  static async listAll(): Promise<ContractedServiceDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as ContractedServiceDocument;
        return {serviceId: doc.id, name: data.name};
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async save(name: string): Promise<ContractedServiceDTO> {
    const existing = await this.col
      .where("nameIndex", "==", name.trim().toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data() as ContractedServiceDocument;
      return {serviceId: doc.id, name: data.name};
    }

    const ref = this.col.doc();
    await ref.set({
      name: name.trim(),
      nameIndex: name.trim().toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return {serviceId: ref.id, name: name.trim()};
  }
}
