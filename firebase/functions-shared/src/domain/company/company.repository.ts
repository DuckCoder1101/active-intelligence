import { FieldValue } from "firebase-admin/firestore";
import { auth, bucket, database } from "../../utils/firebase";
import {
  CompanyFullDTO,
  CompanyResumeDTO,
  RegisterCompanyDTO,
} from "./company.type";
import { CompanyDocument } from "./company.document";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

/** Firestore: `companies` (top-level). Also owns the monthly task-usage counter embedded on each company doc. */
export class CompanyRepository {
  private static companiesCollection = database.collection("companies");

  static async findByCnpj(cnpjIndex: string): Promise<string | null> {
    const snap = await this.companiesCollection
      .where("cnpjIndex", "==", cnpjIndex)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].id;
  }

  /** Transactional upsert enforcing CNPJ uniqueness (`already-exists` if another company already has this CNPJ). */
  static async saveCompany({
    companyId,
    ...companyData
  }: RegisterCompanyDTO): Promise<void> {
    const cnpjIndex = companyData.legalInformation.documentNumber;

    const ref = companyId
      ? this.companiesCollection.doc(companyId)
      : this.companiesCollection.doc();

    await database.runTransaction(async (tx) => {
      const existingSnap = await tx.get(
        this.companiesCollection.where("cnpjIndex", "==", cnpjIndex).limit(1),
      );
      const existingId = existingSnap.empty ? null : existingSnap.docs[0].id;

      if (existingId && existingId !== ref.id) {
        throw new HttpsError(
          "already-exists",
          "CNPJ já cadastrado para outra empresa!",
        );
      }

      tx.set(
        ref,
        {
          ...companyData,
          cnpjIndex,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  /**
   * Deletes a company and cascades cleanup across every collection/Storage
   * path scoped to it — subcollections, top-level docs keyed by `companyId`,
   * the company's users (Firestore doc + Auth account + avatar), and Storage
   * files under `client/{companyId}/`. Operates on raw Firestore paths
   * instead of importing other codebases' repositories, since those live in
   * separate deploy units that don't depend on `functions-shared`.
   */
  static async deleteCompany(companyId: string): Promise<void> {
    const ref = this.companiesCollection.doc(companyId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Empresa não encontrada!");
    }

    await Promise.all([
      this.deleteCompanyUsers(companyId),
      this.deleteQueryInBatches(ref.collection("audits")),
      this.deleteQueryInBatches(ref.collection("personal_tasks")),
      this.deleteQueryInBatches(ref.collection("real_estate")),
      this.deleteQueryInBatches(ref.collection("counters")),
      this.deleteQueryInBatches(ref.collection("crm_origins")),
      this.deleteQueryInBatches(ref.collection("crm_tags")),
      this.deleteCrmFunnels(ref),
      this.deleteQueryInBatches(ref.collection("leads")),
      this.deleteQueryInBatches(
        database.collection("tasks").where("companyId", "==", companyId),
      ),
      this.deleteQueryInBatches(
        database
          .collection("finance_transactions")
          .where("companyId", "==", companyId),
      ),
      this.deleteQueryInBatches(
        database
          .collection("notifications")
          .where("companyId", "==", companyId),
      ),
      database
        .collection("company_operational")
        .doc(companyId)
        .delete()
        .catch(() => undefined),
    ]);

    await Promise.all([ref.delete(), this.deleteCompanyStorage(companyId)]);
  }

  /** Deletes every doc matched by a query in chunks of 500 (Firestore batch limit), looping until exhausted. */
  private static async deleteQueryInBatches(
    query: FirebaseFirestore.Query,
    batchSize = 500,
  ): Promise<void> {
    for (;;) {
      const snap = await query.limit(batchSize).get();
      if (snap.empty) return;

      const batch = database.batch();
      snap.docs.forEach((snapshotDoc) => batch.delete(snapshotDoc.ref));
      await batch.commit();

      if (snap.size < batchSize) return;
    }
  }

  /** `crm_funnels` nests `crm_columns` per funnel, so each funnel's columns must be cleared before the funnel doc itself. */
  private static async deleteCrmFunnels(
    companyRef: FirebaseFirestore.DocumentReference,
  ): Promise<void> {
    const funnelsSnap = await companyRef.collection("crm_funnels").get();

    await Promise.all(
      funnelsSnap.docs.map((funnelDoc) =>
        this.deleteQueryInBatches(funnelDoc.ref.collection("crm_columns")),
      ),
    );

    await this.deleteQueryInBatches(companyRef.collection("crm_funnels"));
  }

  /** Deletes every `company_users` doc for this company along with its Auth account and avatar file (mirrors `deleteAccount`). */
  private static async deleteCompanyUsers(companyId: string): Promise<void> {
    const usersCollection = database.collection("company_users");
    const snap = await usersCollection
      .where("companyId", "==", companyId)
      .get();

    if (snap.empty) return;

    await Promise.all(
      snap.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        await auth.deleteUser(uid).catch((err) =>
          logger.warn("deleteCompany: falha ao deletar Auth do usuário", {
            companyId,
            uid,
            err: String(err),
          }),
        );
        await bucket
          .file(`users/${uid}/avatar`)
          .delete()
          .catch((err) =>
            logger.warn("deleteCompany: falha ao deletar avatar do usuário", {
              companyId,
              uid,
              err: String(err),
            }),
          );
      }),
    );

    await this.deleteQueryInBatches(
      usersCollection.where("companyId", "==", companyId),
    );
  }

  /** Best-effort cleanup of `client/{companyId}/` — covers task attachments and real-estate media alike. */
  private static async deleteCompanyStorage(companyId: string): Promise<void> {
    await bucket
      .deleteFiles({ prefix: `client/${companyId}/` })
      .catch((err) =>
        logger.warn("deleteCompany: falha ao limpar storage", {
          companyId,
          err: String(err),
        }),
      );
  }

  static async getCompanyById(companyId: string): Promise<CompanyFullDTO> {
    const doc = await this.companiesCollection.doc(companyId).get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Empresa não encontrada!");
    }

    const company = doc.data() as CompanyDocument;

    return {
      ...company,
      companyId,
      createdAt: company.createdAt.toMillis(),
      updatedAt: company.updatedAt.toMillis(),
    };
  }

  static async getCompanyResumeById(
    companyId: string,
  ): Promise<CompanyResumeDTO> {
    const doc = await this.companiesCollection.doc(companyId).get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Empresa não encontrada!");
    }

    const { displayName } = doc.data() as CompanyDocument;

    return {
      companyId,
      displayName,
    };
  }

  static async getAllCompanyResumes(): Promise<CompanyResumeDTO[]> {
    const snapshot = await this.companiesCollection.select("displayName").get();

    return snapshot.docs.map((doc) => ({
      companyId: doc.id,
      displayName: doc.data().displayName as string,
    }));
  }

  static async getAllCompanies(): Promise<CompanyFullDTO[]> {
    const snapshot = await this.companiesCollection.get();

    return snapshot.docs.map((doc) => {
      const company = doc.data() as CompanyDocument;
      return {
        ...company,
        companyId: doc.id,
        createdAt: company.createdAt?.toMillis() ?? 0,
        updatedAt: company.updatedAt?.toMillis() ?? 0,
      };
    });
  }

  /** Transactionally checks the company's monthly task limit and increments the counter; throws `resource-exhausted` once the limit is hit. */
  static async checkAndIncrementUsage(companyId: string): Promise<void> {
    const ref = this.companiesCollection.doc(companyId);
    const yearMonth = CompanyRepository.currentYearMonth();

    await database.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpsError("not-found", "Empresa não encontrada!");
      }

      const company = snap.data() as CompanyDocument;
      const limit = company.monthlyTaskLimit;

      if (limit !== undefined && limit !== null) {
        const usage = company.taskUsage;
        const currentCount =
          usage?.yearMonth === yearMonth ? (usage.count ?? 0) : 0;

        if (currentCount >= limit) {
          throw new HttpsError(
            "resource-exhausted",
            `Limite mensal de ${limit} tarefas atingido. Para ampliar o seu ` +
              "plano, entre em contato com a equipe da Guará ou aguarde o " +
              "próximo mês.",
          );
        }

        const newCount = (usage?.yearMonth === yearMonth ? usage.count : 0) + 1;
        tx.update(ref, {
          taskUsage: { yearMonth, count: newCount },
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
  }

  /** Read-only peek at the current month's usage/limit — does not throw if the company is missing (returns zeroed defaults). */
  static async getTaskUsage(
    companyId: string,
  ): Promise<{ used: number; limit: number | null; yearMonth: string }> {
    const snap = await this.companiesCollection.doc(companyId).get();
    const company = snap.data() as CompanyDocument | undefined;
    const yearMonth = CompanyRepository.currentYearMonth();
    const limit = company?.monthlyTaskLimit ?? null;
    const usage = company?.taskUsage;
    const used = usage?.yearMonth === yearMonth ? (usage.count ?? 0) : 0;
    return { used, limit, yearMonth };
  }

  private static currentYearMonth(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }
}
