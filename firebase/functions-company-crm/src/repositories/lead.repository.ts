import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

import { database } from 'functions-shared';
import { LeadDocument } from '../types/lead.document';
import { LeadDTO, SaveLeadDTO } from '../types/lead.dto';

function toDTO(id: string, data: LeadDocument): LeadDTO {
  return {
    leadId: id,
    companyId: data.companyId,
    status: data.status,
    name: data.name,
    phone: data.phone,
    email: data.email,
    originId: data.originId,
    referredBy: data.referredBy,
    tagIds: data.tagIds ?? [],
    assignedTo: data.assignedTo ?? [],
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
  private static col = database.collection('leads');

  static async save(
    companyId: string,
    createdBy: string,
    data: SaveLeadDTO,
    defaultStatus: string,
  ): Promise<LeadDTO> {
    const { leadId, ...rest } = data;
    const ref = leadId ? this.col.doc(leadId) : this.col.doc();
    const isNew = !leadId;

    if (!isNew) {
      const existing = await ref.get();
      if (
        !existing.exists ||
        (existing.data() as LeadDocument).companyId !== companyId
      ) {
        throw new HttpsError('permission-denied', 'Lead não encontrado.');
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
    }

    await ref.set(payload, { merge: true });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as LeadDocument);
  }

  static async listByCompany(companyId: string): Promise<LeadDTO[]> {
    const snap = await this.col.where('companyId', '==', companyId).get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as LeadDocument));
  }

  static async getById(companyId: string, leadId: string): Promise<LeadDTO> {
    const doc = await this.col.doc(leadId).get();
    if (!doc.exists || (doc.data() as LeadDocument).companyId !== companyId) {
      throw new HttpsError('not-found', 'Lead não encontrado.');
    }
    return toDTO(doc.id, doc.data() as LeadDocument);
  }

  static async updateStatus(
    companyId: string,
    leadId: string,
    status: string,
  ): Promise<void> {
    const ref = this.col.doc(leadId);
    const doc = await ref.get();
    if (!doc.exists || (doc.data() as LeadDocument).companyId !== companyId) {
      throw new HttpsError('not-found', 'Lead não encontrado.');
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  }

  static async delete(companyId: string, leadId: string): Promise<void> {
    const ref = this.col.doc(leadId);
    const doc = await ref.get();
    if (!doc.exists || (doc.data() as LeadDocument).companyId !== companyId) {
      throw new HttpsError('not-found', 'Lead não encontrado.');
    }
    await ref.delete();
  }
}
