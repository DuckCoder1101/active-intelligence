import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/https';

import { database } from '../../utils/firebase';
import { NotificationDocument } from './notification.document';
import { NotificationDTO, NotifyAdminsDTO } from './notification.dtos';

export default class NotificationRepository {
  private static notificationsCollection = database.collection('notifications');

  static async notifyAdmins(
    recipientUids: string[],
    data: NotifyAdminsDTO,
  ): Promise<void> {
    if (recipientUids.length === 0) return;

    const batch = database.batch();

    for (const recipientUid of recipientUids) {
      const ref = this.notificationsCollection.doc();
      batch.set(ref, {
        recipientUid,
        ...data,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }

  static async listForUser(uid: string): Promise<NotificationDTO[]> {
    const snapshot = await this.notificationsCollection
      .where('recipientUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as NotificationDocument;
      return {
        notificationId: doc.id,
        type: data.type,
        message: data.message,
        taskId: data.taskId,
        companyId: data.companyId,
        read: data.read,
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
    if (data.recipientUid !== uid) {
      throw new HttpsError('permission-denied', 'Acesso negado!');
    }

    await ref.update({ read: true });
  }
}
