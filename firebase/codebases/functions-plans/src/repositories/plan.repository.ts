import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import { PlanDocument } from "../types/plan.document";
import { PlanDTO, SavePlanDTO } from "../types/plan.dto";

function toDTO(id: string, data: PlanDocument): PlanDTO {
  return {
    planId: id,
    name: data.name,
    billingType: data.billingType,
    value: data.value,
    features: data.features,
    taskLimit: data.taskLimit,
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

/** Firestore: `plans` (top-level, global — not company-scoped since plans are global). */
export class PlanRepository {
  private static col = database.collection("plans");

  static async listAll(): Promise<PlanDTO[]> {
    const snap = await this.col.orderBy("name", "asc").get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as PlanDocument));
  }

  static async save(data: SavePlanDTO): Promise<PlanDTO> {
    const { planId, ...rest } = data;
    const ref = planId ? this.col.doc(planId) : this.col.doc();
    const isNew = !planId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Plano não encontrado.");
      }
    }

    const payload: Record<string, unknown> = {
      ...rest,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(payload, { merge: true });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as PlanDocument);
  }

  static async delete(planId: string): Promise<void> {
    const ref = this.col.doc(planId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Plano não encontrado.");
    }
    await ref.delete();
  }
}
