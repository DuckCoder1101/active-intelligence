import { database, FieldValue } from '@shared/firebase';
import {
  UserProfileDTO,
  RegisterUserDTO,
  UserResumeDTO,
} from '../types/user.dtos';
import { HttpsError } from 'firebase-functions/https';
import { UserDocument } from '../types/user.document';
import { UserAccessLevel } from '@shared/types/authenticatedUser.type';

export default class UserRepository {
  private static cpfsCollection = database.collection('cpfs');
  private static usersCollection = database.collection('users');

  static async save(uid: string, email: string, data: RegisterUserDTO) {
    await database.runTransaction(async (tx) => {
      const adminRef = this.usersCollection.doc(uid);
      const cpfRef = this.cpfsCollection.doc(data.cpf);

      tx.set(cpfRef, {
        uid,
      });

      tx.set(adminRef, {
        name: data.name,
        email: email,
        cpf: data.cpf,
        phone: data.phone,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  static async getProfile(
    uid: string,
    accessLevel: UserAccessLevel,
  ): Promise<UserProfileDTO> {
    const doc = await this.usersCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    const user = doc.data() as UserDocument;

    return {
      uid: doc.id,
      ...user,

      createdAt: user.createdAt.toMillis(),
      updatedAt: user.updatedAt.toMillis(),

      accessLevel,
    };
  }

  static async getResumeByUid(uid: string): Promise<UserResumeDTO> {
    const doc = await this.usersCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    const user = doc.data() as UserDocument;

    return {
      uid: uid,
      name: user.name,
    };
  }

  static async cpfExists(cpf: string): Promise<boolean> {
    const doc = await this.cpfsCollection.doc(cpf).get();
    return doc.exists;
  }

  static async findUidByCpf(cpf: string): Promise<string | null> {
    const doc = await this.cpfsCollection.doc(cpf).get();
    if (!doc.exists) return null;
    return (doc.data() as { uid: string }).uid;
  }

  static async updateAccessLevel(uid: string, newAccessLevel: UserAccessLevel) {
    const ref = this.usersCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    await ref.set(
      {
        accessLevel: newAccessLevel,
      },
      {
        merge: true,
      },
    );
  }
}
