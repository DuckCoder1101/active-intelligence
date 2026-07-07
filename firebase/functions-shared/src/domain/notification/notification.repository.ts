import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

import { database } from '../../utils/firebase';
import { NotificationDocument } from './notification.document';
import { NotificationDTO, NotifyAdminsDTO } from './notification.dtos';

export default class NotificationRepository {
  private static notificationsCollection = database.collection('notifications');

  static async notifyAdmins(
    targetUids: string[],
    data: NotifyAdminsDTO,
  ): Promise<void> {
    if (targetUids.length === 0) return;

    await this.notificationsCollection.add({
      targetUids,
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  static async listForUser(uid: string): Promise<NotificationDTO[]> {
    const snapshot = await this.notificationsCollection
      .where('targetUids', 'array-contains', uid)
      .orderBy('createdAt', 'desc')
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

  static async markRead(uid: string, notificationId: string): Promise<void> {
    const ref = this.notificationsCollection.doc(notificationId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Notificação não encontrada.');
    }

    const data = doc.data() as NotificationDocument;
    if (!data.targetUids.includes(uid)) {
      throw new HttpsError('permission-denied', 'Acesso negado!');
    }

    const remaining = data.targetUids.filter((target) => target !== uid);

    if (remaining.length === 0) {
      await ref.delete();
    } else {
      await ref.update({ targetUids: FieldValue.arrayRemove(uid) });
    }
  }
}
