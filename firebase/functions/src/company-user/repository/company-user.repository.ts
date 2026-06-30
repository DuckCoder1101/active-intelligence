import { database } from '@shared/utils/firebase';
import { HttpsError } from 'firebase-functions/https';
import { CompanyUserListDTO } from '../types/company-user.dtos';
import { CompanyUserDocument } from '../types/company-user.document';
import {
  CompleteProfileDTO,
  UpdateProfileDTO,
  UserProfileDTO,
} from '../../user/types/user.dto';
import { FieldValue } from 'firebase-admin/firestore';

export default class CompanyUserRepository {
  private static usersCollection = database.collection('company-users');

  static async create(
    uid: string,
    email: string,
    companyId: string,
    data: CompleteProfileDTO,
  ) {
    const ref = this.usersCollection.doc(uid);
    await ref.set({
      companyId,
      name: data.name,
      email,
      cpf: data.cpf,
      phone: data.phone,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  static async getProfile(uid: string): Promise<UserProfileDTO> {
    const doc = await this.usersCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    const user = doc.data() as CompanyUserDocument;

    return {
      uid: doc.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cpf: user.cpf,
      createdAt: user.createdAt.toMillis(),
      updatedAt: user.updatedAt.toMillis(),
    };
  }

  static async update({ targetId, ...data }: UpdateProfileDTO) {
    await this.usersCollection.doc(targetId).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  static async delete(uid: string) {
    const ref = this.usersCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    await ref.delete();
  }

  static async getResumeByUid(uid: string): Promise<{ uid: string; name: string }> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new HttpsError('not-found', 'Usuário não encontrado!');
    const user = doc.data() as CompanyUserDocument;
    return { uid, name: user.name };
  }

  static async listByCompany(companyId: string): Promise<CompanyUserListDTO[]> {
    const snapshot = await this.usersCollection
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const user = doc.data() as CompanyUserDocument;
      return {
        uid: doc.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        createdAt: user.createdAt.toMillis(),
        updatedAt: user.updatedAt.toMillis(),
      };
    });
  }
}
