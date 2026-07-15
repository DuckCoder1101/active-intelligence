import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import { database } from "../../utils/firebase";
import AdminRepository from "../admin/admin.repository";
import { AdminDocument } from "../admin/admin.document";
import CompanyUserRepository from "../company-user/company-user.repository";
import { CompanyUserDocument } from "../company-user/company-user.document";
import { NotificationDocument } from "./notification.document";
import {
  NotificationContentDTO,
  NotificationDTO,
  NotificationFilterDTO,
} from "./notification.dtos";

const INVALID_TOKEN_ERROR_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

type TokenOwner = { uid: string; collection: "admins" | "company-users" };

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default class NotificationRepository {
  private static notificationsCollection = database.collection("notifications");
  private static adminsCollection = database.collection("admins");
  private static companyUsersCollection = database.collection("company-users");

  static async notify(
    filter: NotificationFilterDTO,
    data: NotificationContentDTO,
  ): Promise<void> {
    const targetUids = await this.resolveTargetUids(filter);
    if (targetUids.length === 0) return;

    await this.notificationsCollection.add({
      targetUids,
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });

    await this.sendPush(targetUids, data);
  }

  static async listForUser(uid: string): Promise<NotificationDTO[]> {
    const snapshot = await this.notificationsCollection
      .where("targetUids", "array-contains", uid)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as NotificationDocument;
      return {
        notificationId: doc.id,
        type: data.type,
        message: data.message,
        taskId: data.taskId,
        companyId: data.companyId,
        createdAt: data.createdAt.toMillis(),
      };
    });
  }

  static async countForUser(uid: string): Promise<number> {
    const snapshot = await this.notificationsCollection
      .where("targetUids", "array-contains", uid)
      .count()
      .get();

    return snapshot.data().count;
  }

  static async markRead(uid: string, notificationId: string): Promise<void> {
    const ref = this.notificationsCollection.doc(notificationId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Notificação não encontrada.");
    }

    const data = doc.data() as NotificationDocument;
    if (!data.targetUids.includes(uid)) {
      throw new HttpsError("permission-denied", "Acesso negado!");
    }

    const remaining = data.targetUids.filter((target) => target !== uid);

    if (remaining.length === 0) {
      await ref.delete();
    } else {
      await ref.update({ targetUids: FieldValue.arrayRemove(uid) });
    }
  }

  private static async resolveTargetUids(
    filter: NotificationFilterDTO,
  ): Promise<string[]> {
    const uidLists = await Promise.all([
      Promise.resolve(filter.uids ?? []),
      filter.permission ?
        AdminRepository.listUidsWithPermission(filter.permission) :
        Promise.resolve([]),
      filter.accessLevel === "owner" || filter.accessLevel === "admin" ?
        AdminRepository.listUidsByAccessLevel(filter.accessLevel) :
        Promise.resolve([]),
      filter.accessLevel === "user" && filter.companyId ?
        CompanyUserRepository.listUidsByCompany(filter.companyId) :
        Promise.resolve([]),
    ]);

    return [...new Set(uidLists.flat())];
  }

  private static async sendPush(
    uids: string[],
    data: NotificationContentDTO,
  ): Promise<void> {
    try {
      const { tokens, tokenOwners } = await this.resolveFcmTokens(uids);
      if (tokens.length === 0) return;

      for (const tokenChunk of chunk(tokens, 500)) {
        const response = await getMessaging().sendEachForMulticast({
          tokens: tokenChunk,
          notification: { title: "Guará", body: data.message },
          data: {
            type: data.type,
            ...(data.taskId && { taskId: data.taskId }),
            ...(data.companyId && { companyId: data.companyId }),
          },
        });

        await this.pruneInvalidTokens(
          tokenChunk,
          response.responses,
          tokenOwners,
        );
      }
    } catch (error) {
      logger.error("NotificationRepository.sendPush failed", error);
    }
  }

  private static async resolveFcmTokens(
    uids: string[],
  ): Promise<{ tokens: string[]; tokenOwners: Map<string, TokenOwner> }> {
    const tokens: string[] = [];
    const tokenOwners = new Map<string, TokenOwner>();

    for (const uidChunk of chunk(uids, 100)) {
      const adminRefs = uidChunk.map((uid) => this.adminsCollection.doc(uid));
      const companyUserRefs = uidChunk.map((uid) =>
        this.companyUsersCollection.doc(uid),
      );

      const [adminSnaps, companyUserSnaps] = await Promise.all([
        database.getAll(...adminRefs),
        database.getAll(...companyUserRefs),
      ]);

      for (const snap of adminSnaps) {
        if (!snap.exists) continue;
        const admin = snap.data() as AdminDocument;
        for (const token of admin.fcmTokens ?? []) {
          tokens.push(token);
          tokenOwners.set(token, { uid: snap.id, collection: "admins" });
        }
      }

      for (const snap of companyUserSnaps) {
        if (!snap.exists) continue;
        const companyUser = snap.data() as CompanyUserDocument;
        for (const token of companyUser.fcmTokens ?? []) {
          tokens.push(token);
          tokenOwners.set(token, { uid: snap.id, collection: "company-users" });
        }
      }
    }

    return { tokens, tokenOwners };
  }

  private static async pruneInvalidTokens(
    tokens: string[],
    responses: { success: boolean; error?: { code: string } }[],
    tokenOwners: Map<string, TokenOwner>,
  ): Promise<void> {
    const removals: Promise<void>[] = [];

    responses.forEach((response, index) => {
      if (response.success) return;
      const code = response.error?.code;
      if (!code || !INVALID_TOKEN_ERROR_CODES.includes(code)) {
        return;
      }

      const token = tokens[index];
      const owner = tokenOwners.get(token);
      if (!owner) return;

      removals.push(
        owner.collection === "admins" ?
          AdminRepository.removeFcmToken(owner.uid, token) :
          CompanyUserRepository.removeFcmToken(owner.uid, token),
      );
    });

    await Promise.allSettled(removals);
  }
}
