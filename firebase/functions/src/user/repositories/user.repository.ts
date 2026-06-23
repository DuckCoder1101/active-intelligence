import { database, FieldValue, auth } from '@shared/firebase';
import {
  UserProfileDTO,
  RegisterUserDTO,
  UserResumeDTO,
  UpdateUserDTO,
} from '../types/user.dtos';
import { HttpsError } from 'firebase-functions/https';
import { UserDocument } from '../types/user.document';
import {
  AdminPermission,
  UserAccessLevel,
} from '@shared/types/accessLevel.type';

export default class UserRepository {
  private static cpfsCollection = database.collection('cpfs');
  private static usersCollection = database.collection('users');

  static async save(uid: string, email: string, data: RegisterUserDTO) {
    await database.runTransaction(async (tx) => {
      const adminRef = this.usersCollection.doc(uid);
      const cpfRef = this.cpfsCollection.doc(data.cpf);

      tx.set(cpfRef, { uid });

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
    permissions: AdminPermission[],
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
      permissions,
    };
  }

  static async listAll(): Promise<UserProfileDTO[]> {
    const snapshot = await this.usersCollection
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) return [];

    const uids = snapshot.docs.map((doc) => ({ uid: doc.id }));
    const { users: authUsers } = await auth.getUsers(uids);
    const claimsMap = new Map(
      authUsers.map((u) => [u.uid, u.customClaims ?? {}]),
    );

    return snapshot.docs.map((doc) => {
      const user = doc.data() as UserDocument;
      const claims = claimsMap.get(doc.id) ?? {};
      return {
        uid: doc.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        accessLevel: (claims['accessLevel'] as UserAccessLevel) ?? 'user',
        permissions: (claims['permissions'] as AdminPermission[]) ?? [],
        createdAt: user.createdAt.toMillis(),
        updatedAt: user.updatedAt.toMillis(),
      };
    });
  }

  static async update({ targetUid, ...data }: UpdateUserDTO) {
    const ref = this.usersCollection.doc(targetUid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    await ref.set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  }

  static async delete(uid: string) {
    const ref = this.usersCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    const user = doc.data() as UserDocument;

    await database.runTransaction(async (tx) => {
      tx.delete(ref);
      tx.delete(this.cpfsCollection.doc(user.cpf));
    });

    await auth.deleteUser(uid);
  }

  static async getResumeByUid(uid: string): Promise<UserResumeDTO> {
    const doc = await this.usersCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    const user = doc.data() as UserDocument;

    return { uid, name: user.name };
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

  static async updatePermissions(uid: string, permissions: AdminPermission[]) {
    const ref = this.usersCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    await auth.setCustomUserClaims(uid, {
      ...(await auth.getUser(uid)).customClaims,
      permissions,
    });
  }

  static async updateAccessLevel(uid: string, newAccessLevel: UserAccessLevel) {
    const ref = this.usersCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado!');
    }

    await auth.setCustomUserClaims(uid, {
      accessLevel: newAccessLevel,
      complete: true,
    });
  }
}
