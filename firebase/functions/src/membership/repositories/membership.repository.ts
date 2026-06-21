import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';
import { database } from '@shared/firebase';
import {
  ListMembershipDTO,
  RemoveMembershipDTO,
  SaveMembershipDTO,
} from '../types/membership.dtos';
import { MembershipDocument } from '../types/membership.document';
import { CompanyResumeDTO } from '../../company/types/company.type';
import UserRepository from '../../user/repositories/user.repository';
import { CompanyRepository } from '../../company/repositories/company.repository';

export class MembershipRepository {
  private static membershipsCollection = database.collection('memberships');
  private static companiesCollection = database.collection('companies');

  private static docRef(uid: string, companyId: string) {
    return this.membershipsCollection.doc(`${uid}_${companyId}`);
  }

  static async saveMembership(
    data: SaveMembershipDTO,
    tx: Transaction,
  ): Promise<boolean> {
    const ref = this.docRef(data.uid, data.companyId);
    const doc = await tx.get(ref);
    const isNew = !doc.exists;

    if (isNew) {
      tx.set(ref, {
        ...data,
        joinedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(ref, data, { merge: true });
    }

    return isNew;
  }

  static async deleteMembership(
    { uid, companyId }: RemoveMembershipDTO,
    tx: Transaction,
  ): Promise<void> {
    const ref = this.docRef(uid, companyId);
    const doc = await tx.get(ref);

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Membro não encontrado!');
    }

    tx.delete(ref);
  }

  static async getCompanyResumesForUser(
    uid: string,
  ): Promise<CompanyResumeDTO[]> {
    const snapshot = await this.membershipsCollection
      .select('companyId')
      .where('uid', '==', uid)
      .get();

    if (snapshot.empty) return [];

    const uniqueCompanyIds = [
      ...new Set(snapshot.docs.map((doc) => doc.data().companyId as string)),
    ];
    const refs = uniqueCompanyIds.map((id) => this.companiesCollection.doc(id));

    const companyDocs = await database.getAll(...refs, {
      fieldMask: ['displayName'],
    });

    return companyDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({
        companyId: doc.id,
        displayName: doc.data()!.displayName,
      }));
  }

  static async getMembershipsByUid(uid: string): Promise<ListMembershipDTO[]> {
    const snapshot = await this.membershipsCollection
      .select('companyId', 'role', 'joinedAt')
      .where('uid', '==', uid)
      .get();

    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const membership = doc.data() as MembershipDocument;

        const [user, company] = await Promise.all([
          UserRepository.getResumeByUid(uid),
          CompanyRepository.getCompanyResumeById(membership.companyId),
        ]);

        return {
          user,
          company,
          role: membership.role,
          joinedAt: membership.joinedAt.toMillis(),
        } satisfies ListMembershipDTO;
      }),
    );
  }

  static async getMembershipsByCompanyId(
    companyId: string,
  ): Promise<ListMembershipDTO[]> {
    const snapshot = await this.membershipsCollection
      .select('uid', 'role', 'joinedAt')
      .where('companyId', '==', companyId)
      .get();

    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const membership = doc.data() as MembershipDocument;

        const [user, company] = await Promise.all([
          UserRepository.getResumeByUid(membership.uid),
          CompanyRepository.getCompanyResumeById(companyId),
        ]);

        return {
          user,
          company,
          role: membership.role,
          joinedAt: membership.joinedAt.toMillis(),
        } satisfies ListMembershipDTO;
      }),
    );
  }
}
