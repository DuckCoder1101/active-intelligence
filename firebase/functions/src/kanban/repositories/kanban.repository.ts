import { HttpsError } from 'firebase-functions/https';
import { database, FieldValue } from '@shared/firebase';
import {
  KanbanColumnDocument,
  DEFAULT_COLUMNS,
} from '../types/kanban.document';
import { KanbanColumnDTO, SaveColumnDTO } from '../types/kanban.dto';

export class KanbanRepository {
  private static col = database.collection('kanban_columns');
  private static tasksCol = database.collection('tasks');

  static async listAll(): Promise<KanbanColumnDTO[]> {
    const snap = await this.col.orderBy('order', 'asc').get();

    if (snap.empty) {
      const batch = database.batch();
      for (const c of DEFAULT_COLUMNS) {
        batch.set(this.col.doc(c.id), {
          name: c.name,
          color: c.color,
          order: c.order,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      const seeded = await this.col.orderBy('order', 'asc').get();
      return seeded.docs.map((doc) => {
        const data = doc.data() as KanbanColumnDocument;
        return {
          columnId: doc.id,
          name: data.name,
          color: data.color,
          order: data.order,
        };
      });
    }

    return snap.docs.map((doc) => {
      const data = doc.data() as KanbanColumnDocument;
      return {
        columnId: doc.id,
        name: data.name,
        color: data.color,
        order: data.order,
      };
    });
  }

  static async save(data: SaveColumnDTO): Promise<KanbanColumnDTO> {
    const snap = await this.col.orderBy('order', 'desc').limit(1).get();
    const maxOrder = snap.empty
      ? -1
      : (snap.docs[0].data() as KanbanColumnDocument).order;

    const ref = data.columnId ? this.col.doc(data.columnId) : this.col.doc();
    const isNew = !data.columnId;

    await ref.set(
      {
        name: data.name,
        color: data.color,
        order: data.order ?? maxOrder + 1,
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      {
        merge: true,
      },
    );

    const saved = await ref.get();
    const newData = saved.data() as KanbanColumnDocument;

    return {
      columnId: saved.id,
      name: newData.name,
      color: newData.color,
      order: newData.order,
    };
  }

  static async delete(columnId: string): Promise<{ movedTo: string | null }> {
    const colSnap = await this.col.orderBy('order', 'asc').get();
    if (colSnap.empty)
      throw new HttpsError('not-found', 'Quadro não encontrado!');

    const remaining = colSnap.docs.filter((d) => d.id !== columnId);
    if (remaining.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Não é possível excluir o último quadro.',
      );
    }

    const fallbackId = remaining[0].id;
    const taskSnap = await this.tasksCol.where('status', '==', columnId).get();

    const batch = database.batch();
    for (const doc of taskSnap.docs) {
      batch.update(doc.ref, {
        status: fallbackId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    batch.delete(this.col.doc(columnId));
    await batch.commit();

    return { movedTo: taskSnap.size > 0 ? fallbackId : null };
  }
}
