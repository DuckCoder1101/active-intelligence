import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import {
  RealEstateDocument,
  RealEstateStatus,
} from "../types/real-estate.document";
import { RealEstateDTO, SaveRealEstateDTO } from "../types/real-estate.dto";

function toDTO(id: string, data: RealEstateDocument): RealEstateDTO {
  return {
    realEstateId: id,
    companyId: data.companyId,
    status: data.status ?? "disponivel",

    code: data.code,
    title: data.title,
    description: data.description,
    propertyType: data.propertyType,
    propertyTypeOther: data.propertyTypeOther,
    purposes: data.purposes ?? [],
    internalNotes: data.internalNotes,

    owner: data.owner,

    condominium: data.condominium,

    address: data.address,
    addressNumber: data.addressNumber,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    region: data.region,
    state: data.state,
    zipCode: data.zipCode,
    lat: data.lat,
    lng: data.lng,
    block: data.block,

    usableAreaM2: data.usableAreaM2,
    totalAreaM2: data.totalAreaM2,
    bedrooms: data.bedrooms,
    suites: data.suites,
    bathrooms: data.bathrooms,
    parkingSpots: data.parkingSpots,
    floor: data.floor,
    buildingFloors: data.buildingFloors,
    condition: data.condition,
    furnishings: data.furnishings ?? "nao",

    salePrice: data.salePrice,
    rentPrice: data.rentPrice,
    iptuValue: data.iptuValue,
    acceptsFinancing: data.acceptsFinancing ?? false,
    acceptsExchange: data.acceptsExchange ?? false,
    negotiable: data.negotiable ?? false,

    features: data.features ?? [],

    photos: data.photos ?? [],
    coverPhotoUrl: data.coverPhotoUrl,
    videoUrl: data.videoUrl,
    tourUrl: data.tourUrl,

    registryNumber: data.registryNumber,
    documentationStatus: data.documentationStatus,
    iptuNumber: data.iptuNumber,

    visibleOnWebsite: data.visibleOnWebsite ?? false,
    featured: data.featured ?? false,
    publicDescription: data.publicDescription,
    portals: data.portals ?? [],

    createdBy: data.createdBy,
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

/**
 * Firestore: `companies/{companyId}/real_estate`, plus
 * `companies/{companyId}/counters/real_estate` for atomic sequence allocation.
 */
export class RealEstateRepository {
  private static col(companyId: string) {
    return database
      .collection("companies")
      .doc(companyId)
      .collection("real_estate");
  }

  private static counterRef(companyId: string) {
    return database
      .collection("companies")
      .doc(companyId)
      .collection("counters")
      .doc("real_estate");
  }

  /**
   * Transactional upsert: on create, atomically allocates the next sequential
   * code (`I-001`, `I-002`, ...) from the counter doc before writing.
   */
  static async save(
    companyId: string,
    createdBy: string,
    data: SaveRealEstateDTO,
  ): Promise<RealEstateDTO> {
    const { realEstateId, ...rest } = data;
    const col = this.col(companyId);
    // O realEstateId pode ser pré-gerado no cliente (ex: para permitir upload
    // de mídia antes do primeiro save) — quem decide se é criação ou edição é
    // a existência do documento, não a presença do id.
    const ref = realEstateId ? col.doc(realEstateId) : col.doc();
    const counterRef = this.counterRef(companyId);

    // Existência + alocação de código + escrita precisam ser atômicas: dois
    // saves concorrentes tratando o mesmo id ainda inexistente como "novo"
    // não podem alocar código duplicado nem correr na escrita final.
    await database.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      const isNew = !existing.exists;

      const payload: Record<string, unknown> = {
        ...rest,
        companyId,
        furnishings: rest.furnishings ?? "nao",
        acceptsFinancing: rest.acceptsFinancing ?? false,
        acceptsExchange: rest.acceptsExchange ?? false,
        negotiable: rest.negotiable ?? false,
        features: rest.features ?? [],
        photos: rest.photos ?? [],
        portals: rest.portals ?? [],
        visibleOnWebsite: rest.visibleOnWebsite ?? false,
        featured: rest.featured ?? false,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (isNew) {
        const counterSnap = await transaction.get(counterRef);
        const current = (counterSnap.data()?.value as number | undefined) ?? 0;
        const next = current + 1;
        transaction.set(counterRef, { value: next }, { merge: true });

        payload.createdBy = createdBy;
        payload.createdAt = FieldValue.serverTimestamp();
        payload.status = rest.status ?? "disponivel";
        payload.code = `I-${String(next).padStart(3, "0")}`;
      }

      transaction.set(ref, payload, { merge: true });
    });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as RealEstateDocument);
  }

  static async listByCompany(companyId: string): Promise<RealEstateDTO[]> {
    const snap = await this.col(companyId).get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as RealEstateDocument));
  }

  static async updateStatus(
    companyId: string,
    realEstateId: string,
    status: RealEstateStatus,
  ): Promise<void> {
    const ref = this.col(companyId).doc(realEstateId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Imóvel não encontrado.");
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  }

  static async delete(companyId: string, realEstateId: string): Promise<void> {
    const ref = this.col(companyId).doc(realEstateId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Imóvel não encontrado.");
    }
    await ref.delete();
  }
}
