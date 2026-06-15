import { database, FieldValue } from '@shared/firebase';
import { UserProfileDTO, RegisterUserDTO } from '../types/admin.dtos';
import { HttpsError } from 'firebase-functions/https';
import { UserDocument } from '../types/admin.document';
import { UserAccessLevel } from '@shared/types/authenticatedUser.type';

export default class UserRepository {
  private static cpfIndexesCollection = database.collection('cpf');
  private static usersCollection = database.collection('users');

  static async saveUser(uid: string, data: RegisterUserDTO) {
    await database.runTransaction(async (tx) => {
      const adminRef = this.usersCollection.doc(uid);
      const cpfRef = this.cpfIndexesCollection.doc(data.cpf);

      tx.set(cpfRef, {
        uid,
      });

      tx.set(adminRef, {
        uid,
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  static async getUserProfile(
    uid: string,
    accessLevel: UserAccessLevel,
  ): Promise<UserProfileDTO> {
    const doc = await this.usersCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!!');
    }

    const user = doc.data() as UserDocument;

    return {
      ...user,

      createdAt: user.createdAt.toMillis(),
      updatedAt: user.updatedAt.toMillis(),

      accessLevel,
    };
  }

  static async cpfExists(cpf: string): Promise<boolean> {
    const doc = await this.cpfIndexesCollection.doc(cpf).get();
    return doc.exists;
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
