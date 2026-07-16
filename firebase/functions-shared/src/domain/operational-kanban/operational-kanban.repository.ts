import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "../../utils/firebase";
import {
  OperationalKanbanColumnDocument,
  DEFAULT_COLUMNS,
  PROTECTED_COLUMN_IDS,
} from "./operational-kanban.document";
import {
  OperationalKanbanColumnDTO,
  SaveOperationalKanbanColumnDTO,
} from "./operational-kanban.dtos";

export class OperationalKanbanRepository {
  private static col = database.collection("operational_kanban_columns");
  private static tasksCol = database.collection("tasks");

  static async listAll(): Promise<OperationalKanbanColumnDTO[]> {
    const snap = await this.col.orderBy("order", "asc").get();

    if (snap.empty) {
      const batch = database.batch();
      for (const column of DEFAULT_COLUMNS) {
        batch.set(this.col.doc(column.id), {
          name: column.name,
          color: column.color,
          order: column.order,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      const seeded = await this.col.orderBy("order", "asc").get();

      return seeded.docs.map((doc) => {
        const data = doc.data() as OperationalKanbanColumnDocument;
        return {
          columnId: doc.id,
          name: data.name,
          color: data.color,
          order: data.order,
        };
      });
    }

    return snap.docs.map((doc) => {
      const data = doc.data() as OperationalKanbanColumnDocument;
      return {
        columnId: doc.id,
        name: data.name,
        color: data.color,
        order: data.order,
      };
    });
  }

  static async save(
    data: SaveOperationalKanbanColumnDTO,
  ): Promise<OperationalKanbanColumnDTO> {
    const snap = await this.col.orderBy("order", "desc").limit(1).get();
    const maxOrder = snap.empty ?
      -1 :
      (snap.docs[0].data() as OperationalKanbanColumnDocument).order;

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
    const newData = saved.data() as OperationalKanbanColumnDocument;

    return {
      columnId: saved.id,
      name: newData.name,
      color: newData.color,
      order: newData.order,
    };
  }

  static async delete(columnId: string): Promise<{ movedTo: string | null }> {
    if (PROTECTED_COLUMN_IDS.includes(columnId)) {
      throw new HttpsError(
        "failed-precondition",
        "Este quadro é usado pelo fluxo de aprovação do cliente e não " +
          "pode ser excluído.",
      );
    }

    const colSnap = await this.col.orderBy("order", "asc").get();
    if (colSnap.empty) {
      throw new HttpsError("not-found", "Quadro não encontrado!");
    }

    const remaining = colSnap.docs.filter((d) => d.id !== columnId);
    if (remaining.length === 0) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir o último quadro.",
      );
    }

    const fallbackId = remaining[0].id;
    const taskSnap = await this.tasksCol.where("status", "==", columnId).get();

    const batch = database.batch();
    for (const doc of taskSnap.docs) {
      batch.update(doc.ref, {
        status: fallbackId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    batch.delete(this.col.doc(columnId));
    await batch.commit();

    return {
      movedTo: taskSnap.size > 0 ? fallbackId : null,
    };
  }
}
