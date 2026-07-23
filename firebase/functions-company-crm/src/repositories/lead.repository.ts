import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import { DealStatus, LeadDocument } from "../types/lead.document";
import { LeadDTO, SaveLeadDTO } from "../types/lead.dto";

function toDTO(id: string, data: LeadDocument): LeadDTO {
  return {
    leadId: id,
    companyId: data.companyId,
    status: data.status,
    dealStatus: data.dealStatus ?? "aberto",
    name: data.name,
    phone: data.phone,
    email: data.email,
    originId: data.originId,
    referredBy: data.referredBy,
    tagIds: data.tagIds ?? [],
    assignedTo: data.assignedTo ?? [],
    notes: data.notes,
    businessType: data.businessType,
    businessTypeOther: data.businessTypeOther,
    propertyType: data.propertyType,
    propertyTypeOther: data.propertyTypeOther,
    purpose: data.purpose,
    city: data.city,
    state: data.state,
    neighborhoods: data.neighborhoods ?? [],
    acceptsNearbyNeighborhoods: data.acceptsNearbyNeighborhoods ?? false,
    priceMin: data.priceMin,
    priceMax: data.priceMax,
    propertySizeM2: data.propertySizeM2,
    bedrooms: data.bedrooms,
    suites: data.suites,
    parkingSpots: data.parkingSpots,
    floor: data.floor,
    preferences: data.preferences ?? [],
    paymentMethod: data.paymentMethod,
    hasApprovedOrSimulatedCredit: data.hasApprovedOrSimulatedCredit ?? false,
    decidesAlone: data.decidesAlone ?? true,
    decidesWith: data.decidesWith,
    consultedOtherRealtor: data.consultedOtherRealtor ?? false,
    temperature: data.temperature,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

export class LeadRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("leads");
  }

  static async save(
    companyId: string,
    createdBy: string,
    data: SaveLeadDTO,
    defaultStatus: string,
  ): Promise<LeadDTO> {
    const { leadId, ...rest } = data;
    const col = this.col(companyId);
    const ref = leadId ? col.doc(leadId) : col.doc();
    const isNew = !leadId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("permission-denied", "Lead não encontrado.");
      }
    }

    const payload: Record<string, unknown> = {
      ...rest,
      companyId,
      status: rest.status ?? defaultStatus,
      tagIds: rest.tagIds ?? [],
      assignedTo: rest.assignedTo ?? [],
      neighborhoods: rest.neighborhoods ?? [],
      acceptsNearbyNeighborhoods: rest.acceptsNearbyNeighborhoods ?? false,
      priceMin: rest.priceMin ?? 0,
      priceMax: rest.priceMax ?? 1_000_000_000,
      preferences: rest.preferences ?? [],
      hasApprovedOrSimulatedCredit: rest.hasApprovedOrSimulatedCredit ?? false,
      decidesAlone: rest.decidesAlone ?? true,
      consultedOtherRealtor: rest.consultedOtherRealtor ?? false,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdBy = createdBy;
      payload.createdAt = FieldValue.serverTimestamp();
      payload.dealStatus = "aberto";
    }

    await ref.set(payload, { merge: true });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as LeadDocument);
  }

  static async listByCompany(companyId: string): Promise<LeadDTO[]> {
    const snap = await this.col(companyId).get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as LeadDocument));
  }

  static async getById(companyId: string, leadId: string): Promise<LeadDTO> {
    const doc = await this.col(companyId).doc(leadId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Lead não encontrado.");
    }
    return toDTO(doc.id, doc.data() as LeadDocument);
  }

  static async updateStatus(
    companyId: string,
    leadId: string,
    status: string,
  ): Promise<void> {
    const ref = this.col(companyId).doc(leadId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Lead não encontrado.");
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  }

  static async updateDealStatus(
    companyId: string,
    leadId: string,
    dealStatus: DealStatus,
  ): Promise<void> {
    const ref = this.col(companyId).doc(leadId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Lead não encontrado.");
    }
    await ref.update({ dealStatus, updatedAt: FieldValue.serverTimestamp() });
  }

  static async delete(companyId: string, leadId: string): Promise<void> {
    const ref = this.col(companyId).doc(leadId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Lead não encontrado.");
    }
    await ref.delete();
  }
}
