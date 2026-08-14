import { HttpsError } from "firebase-functions/https";
import { FieldValue, WriteBatch } from "firebase-admin/firestore";

import { assertUniqueField, database } from "functions-shared";
import {
  DEFAULT_TASK_CATEGORIES,
  TaskCategoryDocument,
  TaskSubcategoryDocument,
} from "../types/task-category.document";
import {
  SaveTaskCategoryDTO,
  SaveTaskSubcategoryDTO,
  TaskCategoryDTO,
  TaskSubcategoryDTO,
} from "../types/task-category.dto";

// Firestore permite no máximo 500 operações por batch. Categorias/subcategorias
// com muitas tarefas vinculadas precisam ser aplicadas em vários batches — perde
// a atomicidade de um único commit, mas é o jeito padrão de contornar o limite.
const FIRESTORE_BATCH_LIMIT = 500;

async function commitInChunks(
  writers: Array<(batch: WriteBatch) => void>,
): Promise<void> {
  for (let i = 0; i < writers.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = database.batch();
    for (const writer of writers.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
      writer(batch);
    }
    await batch.commit();
  }
}

/**
 * Firestore: `task_categories` (top-level), with sub-collection
 * `task_categories/{categoryId}/task_subcategories`; also reads `tasks` (top-level) to
 * reassign/unlink tasks on delete.
 */
export class TaskCategoryRepository {
  private static col = database.collection("task_categories");
  private static tasksCol = database.collection("tasks");

  private static subcategoriesCol(categoryId: string) {
    return this.col.doc(categoryId).collection("task_subcategories");
  }

  private static async subcategoriesFor(
    categoryId: string,
  ): Promise<TaskSubcategoryDTO[]> {
    const snap = await this.subcategoriesCol(categoryId)
      .orderBy("order", "asc")
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data() as TaskSubcategoryDocument;
      return { subcategoryId: doc.id, name: data.name, order: data.order };
    });
  }

  /** Seeds `DEFAULT_TASK_CATEGORIES` if the collection is empty, then joins each category's subcategories. */
  static async listAll(): Promise<TaskCategoryDTO[]> {
    let snap = await this.col.orderBy("order", "asc").get();

    if (snap.empty) {
      const batch = database.batch();
      for (const category of DEFAULT_TASK_CATEGORIES) {
        batch.set(this.col.doc(category.id), {
          name: category.name,
          color: category.color,
          order: category.order,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      snap = await this.col.orderBy("order", "asc").get();
    }

    return Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data() as TaskCategoryDocument;
        return {
          categoryId: doc.id,
          name: data.name,
          color: data.color,
          order: data.order,
          subcategories: await this.subcategoriesFor(doc.id),
        };
      }),
    );
  }

  static async saveCategory(
    data: SaveTaskCategoryDTO,
  ): Promise<TaskCategoryDTO> {
    const snap = await this.col.orderBy("order", "desc").limit(1).get();
    const maxOrder = snap.empty
      ? -1
      : (snap.docs[0].data() as TaskCategoryDocument).order;

    const ref = data.categoryId ? this.col.doc(data.categoryId) : this.col.doc();
    const isNew = !data.categoryId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Categoria não encontrada.");
      }
    }

    await assertUniqueField(this.col, "name", data.name, {
      excludeId: ref.id,
      label: "Esse nome de categoria",
    });
    await assertUniqueField(this.col, "color", data.color, {
      excludeId: ref.id,
      label: "Essa cor",
    });

    await ref.set(
      {
        name: data.name,
        color: data.color,
        order: data.order ?? maxOrder + 1,
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    const newData = saved.data() as TaskCategoryDocument;
    return {
      categoryId: saved.id,
      name: newData.name,
      color: newData.color,
      order: newData.order,
      subcategories: await this.subcategoriesFor(saved.id),
    };
  }

  /**
   * Reassigns tasks in this category to a fallback category, deletes the
   * subcategories, and deletes the category itself — all batched in chunks of
   * `FIRESTORE_BATCH_LIMIT` (500) via `commitInChunks`.
   */
  static async deleteCategory(
    categoryId: string,
  ): Promise<{ movedTo: string | null }> {
    const snap = await this.col.orderBy("order", "asc").get();
    const target = snap.docs.find((d) => d.id === categoryId);
    if (!target) {
      throw new HttpsError("not-found", "Categoria não encontrada.");
    }

    const remaining = snap.docs.filter((d) => d.id !== categoryId);
    if (remaining.length === 0) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir a última categoria.",
      );
    }

    const fallback = remaining.sort(
      (a, b) =>
        (a.data() as TaskCategoryDocument).order -
        (b.data() as TaskCategoryDocument).order,
    )[0];

    const taskSnap = await this.tasksCol
      .where("categoryId", "==", categoryId)
      .get();
    const subcategoriesSnap = await this.subcategoriesCol(categoryId).get();

    const writers: Array<(batch: WriteBatch) => void> = [
      ...taskSnap.docs.map(
        (doc) => (batch: WriteBatch) =>
          batch.update(doc.ref, {
            categoryId: fallback.id,
            subcategoryId: null,
            updatedAt: FieldValue.serverTimestamp(),
          }),
      ),
      ...subcategoriesSnap.docs.map(
        (doc) => (batch: WriteBatch) => batch.delete(doc.ref),
      ),
      (batch: WriteBatch) => batch.delete(this.col.doc(categoryId)),
    ];
    await commitInChunks(writers);

    return { movedTo: taskSnap.size > 0 ? fallback.id : null };
  }

  static async saveSubcategory(
    data: SaveTaskSubcategoryDTO,
  ): Promise<TaskSubcategoryDTO> {
    const categoryRef = this.col.doc(data.categoryId);
    const categorySnap = await categoryRef.get();
    if (!categorySnap.exists) {
      throw new HttpsError("not-found", "Categoria não encontrada.");
    }

    const col = this.subcategoriesCol(data.categoryId);
    const snap = await col.orderBy("order", "desc").limit(1).get();
    const maxOrder = snap.empty
      ? -1
      : (snap.docs[0].data() as TaskSubcategoryDocument).order;

    const ref = data.subcategoryId ? col.doc(data.subcategoryId) : col.doc();
    const isNew = !data.subcategoryId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Subcategoria não encontrada.");
      }
    }

    await assertUniqueField(col, "name", data.name, {
      excludeId: ref.id,
      label: "Esse nome de subcategoria",
    });

    await ref.set(
      {
        name: data.name,
        order: data.order ?? maxOrder + 1,
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    const newData = saved.data() as TaskSubcategoryDocument;
    return { subcategoryId: saved.id, name: newData.name, order: newData.order };
  }

  /** Unlinks tasks pointing at this subcategory and deletes it, batched via `commitInChunks`. */
  static async deleteSubcategory(
    categoryId: string,
    subcategoryId: string,
  ): Promise<void> {
    const ref = this.subcategoriesCol(categoryId).doc(subcategoryId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Subcategoria não encontrada.");
    }

    const taskSnap = await this.tasksCol
      .where("subcategoryId", "==", subcategoryId)
      .get();

    const writers: Array<(batch: WriteBatch) => void> = [
      ...taskSnap.docs.map(
        (doc) => (batch: WriteBatch) =>
          batch.update(doc.ref, {
            subcategoryId: null,
            updatedAt: FieldValue.serverTimestamp(),
          }),
      ),
      (batch: WriteBatch) => batch.delete(ref),
    ];
    await commitInChunks(writers);
  }
}
