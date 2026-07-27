import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import { GuideDocument } from "../types/guide.document";
import { GuideContentDTO, GuideDTO, SaveGuideDTO } from "../types/guide.dto";

function toDTO(id: string, data: GuideDocument): GuideDTO {
  return {
    guideId: id,
    sequence: data.sequence,
    name: data.name,
    label: data.label,
    driveUrl: data.driveUrl,
    socialUrl: data.socialUrl,
    intentTags: data.intentTags ?? [],
    platformTags: data.platformTags ?? [],
    formatTags: data.formatTags ?? [],
    scriptPrompt: data.scriptPrompt ?? "",
    scriptGuide: data.scriptGuide ?? [],
    assignedCompanyIds: data.assignedCompanyIds ?? [],
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

function toContentDTO(id: string, data: GuideDocument): GuideContentDTO {
  return {
    guideId: id,
    name: data.name,
    driveUrl: data.driveUrl,
    socialUrl: data.socialUrl,
    intentTags: data.intentTags ?? [],
    platformTags: data.platformTags ?? [],
    formatTags: data.formatTags ?? [],
    scriptGuide: data.scriptGuide ?? [],
  };
}

export class GuideRepository {
  // Coleção raiz "library" com um doc singleton fixo ("hub") pendurando as
  // subcoleções de cada seção da Biblioteca (guides agora; playbooks,
  // materials, strategies reservados para o futuro).
  private static col() {
    return database.collection("library").doc("hub").collection("guides");
  }

  private static hubRef() {
    return database.collection("library").doc("hub");
  }

  // Aloca atomicamente o próximo número sequencial (G-001, G-002, ...),
  // guardado no doc singleton "hub". Transação evita duas criações
  // simultâneas reutilizarem o mesmo número.
  private static async nextSequence(): Promise<number> {
    return database.runTransaction(async (tx) => {
      const hubSnap = await tx.get(this.hubRef());
      const current = (hubSnap.data()?.guideSequence as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(this.hubRef(), { guideSequence: next }, { merge: true });
      return next;
    });
  }

  // Leitura informativa do próximo número (sem alocar) — usada para prever
  // o prefixo no modal de criação. O valor real só é atribuído em save().
  static async peekNextSequence(): Promise<number> {
    const hubSnap = await this.hubRef().get();
    const current = (hubSnap.data()?.guideSequence as number | undefined) ?? 0;
    return current + 1;
  }

  static async listAll(): Promise<GuideDTO[]> {
    const snap = await this.col().get();
    return snap.docs
      .map((doc) => toDTO(doc.id, doc.data() as GuideDocument))
      .sort((a, b) => a.sequence - b.sequence);
  }

  static async getById(guideId: string): Promise<GuideDTO> {
    const doc = await this.col().doc(guideId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Guia não encontrado.");
    }
    return toDTO(doc.id, doc.data() as GuideDocument);
  }

  static async save(createdBy: string, data: SaveGuideDTO): Promise<GuideDTO> {
    const { guideId, name: label, ...rest } = data;
    const col = this.col();
    const ref = guideId ? col.doc(guideId) : col.doc();
    const isNew = !guideId;

    let sequence: number;
    if (isNew) {
      sequence = await this.nextSequence();
    } else {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Guia não encontrado.");
      }
      sequence = (existing.data() as GuideDocument).sequence;
    }

    const code = `G-${String(sequence).padStart(3, "0")}`;
    const trimmedLabel = label?.trim();
    const name = trimmedLabel ? `${code}-${trimmedLabel}` : code;

    const payload: Record<string, unknown> = {
      ...rest,
      sequence,
      name,
      label: trimmedLabel ?? FieldValue.delete(),
      intentTags: rest.intentTags ?? [],
      platformTags: rest.platformTags ?? [],
      formatTags: rest.formatTags ?? [],
      scriptPrompt: rest.scriptPrompt ?? "",
      scriptGuide: rest.scriptGuide ?? [],
      assignedCompanyIds: rest.assignedCompanyIds ?? [],
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdBy = createdBy;
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(payload, { merge: true });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as GuideDocument);
  }

  static async delete(guideId: string): Promise<void> {
    const ref = this.col().doc(guideId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Guia não encontrado.");
    }
    await ref.delete();
  }

  static async listByCompany(companyId: string): Promise<GuideContentDTO[]> {
    const snap = await this.col()
      .where("assignedCompanyIds", "array-contains", companyId)
      .get();
    return snap.docs
      .map((doc) => toContentDTO(doc.id, doc.data() as GuideDocument))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getForCompany(
    companyId: string,
    guideId: string,
  ): Promise<GuideContentDTO> {
    const doc = await this.col().doc(guideId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Guia não encontrado.");
    }
    const data = doc.data() as GuideDocument;
    if (!(data.assignedCompanyIds ?? []).includes(companyId)) {
      throw new HttpsError(
        "permission-denied",
        "Este guia não está disponível para sua empresa.",
      );
    }
    return toContentDTO(doc.id, data);
  }

  static async getPublic(guideId: string): Promise<GuideContentDTO> {
    const doc = await this.col().doc(guideId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Guia não encontrado.");
    }
    return toContentDTO(doc.id, doc.data() as GuideDocument);
  }
}
