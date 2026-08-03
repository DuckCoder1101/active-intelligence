import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import { ReviewDocument } from "../types/review.document";
import { ReviewDTO, SubmitReviewDTO } from "../types/review.dto";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Firestore: `reviews` (top-level) — companyId/submittedByUid always stored, anonymity only affects the resolved DTO. */
export class ReviewRepository {
  private static reviewsCollection = database.collection("reviews");
  private static companiesCollection = database.collection("companies");
  private static companyUsersCollection = database.collection("company_users");

  static async submit(
    uid: string,
    companyId: string,
    data: SubmitReviewDTO,
  ): Promise<void> {
    await this.reviewsCollection.add({
      companyId,
      submittedByUid: uid,
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Lists all reviews, resolving company/submitter names in batches (no N+1):
   * collects unique companyIds and unique non-anonymous uids, then fetches each
   * set with one chunked `getAll` instead of one read per review.
   */
  static async list(): Promise<ReviewDTO[]> {
    const snapshot = await this.reviewsCollection
      .orderBy("createdAt", "desc")
      .get();

    const docs = snapshot.docs.map((doc) => ({
      reviewId: doc.id,
      data: doc.data() as ReviewDocument,
    }));

    const companyIds = [...new Set(docs.map(({ data }) => data.companyId))];
    const submitterUids = [
      ...new Set(
        docs
          .filter(({ data }) => !data.anonymous)
          .map(({ data }) => data.submittedByUid),
      ),
    ];

    const [companyNames, submitterNames] = await Promise.all([
      this.resolveNames(this.companiesCollection, companyIds, "displayName"),
      this.resolveNames(this.companyUsersCollection, submitterUids, "name"),
    ]);

    return docs.map(({ reviewId, data }) => ({
      reviewId,
      companyName: companyNames.get(data.companyId) ?? "Empresa removida",
      submitterName: data.anonymous
        ? undefined
        : (submitterNames.get(data.submittedByUid) ?? "Usuário removido"),
      anonymous: data.anonymous,
      stars: data.stars,
      comment: data.comment,
      createdAt: data.createdAt.toMillis(),
    }));
  }

  static async delete(reviewId: string): Promise<void> {
    const ref = this.reviewsCollection.doc(reviewId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Avaliação não encontrada.");
    }

    await ref.delete();
  }

  private static async resolveNames(
    collection: FirebaseFirestore.CollectionReference,
    ids: string[],
    nameField: string,
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();

    for (const idChunk of chunk(ids, 100)) {
      const refs = idChunk.map((id) => collection.doc(id));
      const snaps = await database.getAll(...refs);

      for (const snap of snaps) {
        if (!snap.exists) continue;
        const data = snap.data() as Record<string, string>;
        names.set(snap.id, data[nameField]);
      }
    }

    return names;
  }
}
