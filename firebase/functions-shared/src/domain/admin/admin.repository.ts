import { database, auth } from "../../utils/firebase";
import { AdminResumeDTO, AdminProfileDTO } from "./admin.dtos";
import { HttpsError } from "firebase-functions/https";
import { AdminDocument } from "./admin.document";
import { FieldValue } from "firebase-admin/firestore";
import {
  CompleteProfileDTO,
  UpdateProfileDTO,
  UserProfileDTO,
} from "../user/user.dto";
import { AdminPermission } from "../../types/accessLevel.type";

export default class AdminRepository {
  private static adminsCollection = database.collection("admins");

  static async create(uid: string, email: string, data: CompleteProfileDTO) {
    const adminRef = this.adminsCollection.doc(uid);

    await adminRef.set({
      name: data.name,
      email: email,
      cpf: data.cpf,
      phone: data.phone,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  static async getProfile(uid: string): Promise<UserProfileDTO> {
    const doc = await this.adminsCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Administrador não encontrado!");
    }

    const admin = doc.data() as AdminDocument;

    return {
      ...admin,
      uid: doc.id,
      createdAt: admin.createdAt.toMillis(),
      updatedAt: admin.updatedAt.toMillis(),
    };
  }

  static async listAll(): Promise<AdminProfileDTO[]> {
    const snapshot = await this.adminsCollection
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) return [];

    const profileDocs = snapshot.docs.map((doc) => ({
      uid: doc.id,
      data: doc.data() as AdminDocument,
    }));

    const { users } = await auth.getUsers(
      profileDocs.map(({ uid }) => ({ uid })),
    );
    const claimsMap = new Map(users.map((u) => [u.uid, u.customClaims ?? {}]));

    return profileDocs.map(({ uid, data }) => {
      const claims = claimsMap.get(uid) ?? {};
      return {
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        accessLevel: (claims["accessLevel"] ?? "admin") as
          AdminProfileDTO["accessLevel"],
        permissions: (claims["permissions"] ?? []) as string[],
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      };
    });
  }

  static async update({ targetId, ...data }: UpdateProfileDTO) {
    const ref = this.adminsCollection.doc(targetId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Administrador não encontrado!");
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
    const ref = this.adminsCollection.doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Administrador não encontrado!");
    }

    await ref.delete();
  }

  static async listUidsWithPermission(
    permission: AdminPermission,
  ): Promise<string[]> {
    const admins = await this.listAll();
    return admins
      .filter(
        (a) => a.accessLevel === "owner" || a.permissions.includes(permission),
      )
      .map((a) => a.uid);
  }

  static async listUidsByAccessLevel(
    level: "owner" | "admin",
  ): Promise<string[]> {
    const admins = await this.listAll();
    return admins
      .filter((a) => a.accessLevel === level)
      .map((a) => a.uid);
  }

  static async addFcmToken(uid: string, token: string): Promise<void> {
    await this.adminsCollection.doc(uid).update({
      fcmTokens: FieldValue.arrayUnion(token),
    });
  }

  static async removeFcmToken(uid: string, token: string): Promise<void> {
    await this.adminsCollection.doc(uid).update({
      fcmTokens: FieldValue.arrayRemove(token),
    });
  }

  static async getResumeByUid(uid: string): Promise<AdminResumeDTO> {
    const doc = await this.adminsCollection.doc(uid).get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Administrador não encontrado!");
    }

    const admin = doc.data() as AdminDocument;

    return { uid, name: admin.name };
  }
}
