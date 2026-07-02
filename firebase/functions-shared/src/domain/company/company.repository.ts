import { FieldValue } from 'firebase-admin/firestore';
import { database } from '../../utils/firebase';
import {
  CompanyFullDTO,
  CompanyResumeDTO,
  RegisterCompanyDTO,
} from './company.type';
import { CompanyDocument } from './company.document';
import { HttpsError } from 'firebase-functions/https';

export class CompanyRepository {
  private static companiesCollection = database.collection('companies');

  static async findByCnpj(cnpjIndex: string): Promise<string | null> {
    const snap = await this.companiesCollection
      .where('cnpjIndex', '==', cnpjIndex)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].id;
  }

  static async saveCompany({
    companyId,
    ...companyData
  }: RegisterCompanyDTO): Promise<void> {
    const cnpjIndex = companyData.legalInformation.documentNumber;
    const existingId = await this.findByCnpj(cnpjIndex);

    if (existingId && existingId !== companyId) {
      throw new HttpsError(
        'already-exists',
        'CNPJ já cadastrado para outra empresa!',
      );
    }

    const ref = companyId
      ? this.companiesCollection.doc(companyId)
      : this.companiesCollection.doc();

    await ref.set(
      {
        ...companyData,
        cnpjIndex,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  static async deleteCompany(companyId: string): Promise<void> {
    const ref = this.companiesCollection.doc(companyId);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Empresa não encontrada!');
    }

    await ref.delete();
  }

  static async getCompanyById(companyId: string): Promise<CompanyFullDTO> {
    const doc = await this.companiesCollection.doc(companyId).get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Empresa não encontrada!');
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
      throw new HttpsError('not-found', 'Empresa não encontrada!');
    }

    const { displayName } = doc.data() as CompanyDocument;

    return {
      companyId,
      displayName,
    };
  }

  static async getAllCompanyResumes(): Promise<CompanyResumeDTO[]> {
    const snapshot = await this.companiesCollection.select('displayName').get();

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

  static async checkAndIncrementUsage(companyId: string): Promise<void> {
    const ref = this.companiesCollection.doc(companyId);
    const yearMonth = CompanyRepository.currentYearMonth();

    await database.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Empresa não encontrada.');
      }

      const company = snap.data() as CompanyDocument;
      const limit = company.monthlyTaskLimit;

      if (limit !== undefined && limit !== null) {
        const usage = company.taskUsage;
        const currentCount =
          usage?.yearMonth === yearMonth ? (usage.count ?? 0) : 0;

        if (currentCount >= limit) {
          throw new HttpsError(
            'resource-exhausted',
            `Limite mensal de ${limit} tarefas atingido. Para ampliar o seu plano, entre em contato com a equipe da Guará ou aguarde o próximo mês.`,
          );
        }

        const newCount =
          (usage?.yearMonth === yearMonth ? usage.count : 0) + 1;
        tx.update(ref, {
          taskUsage: { yearMonth, count: newCount },
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
  }

  static async getTaskUsage(
    companyId: string,
  ): Promise<{ used: number; limit: number | null; yearMonth: string }> {
    const snap = await this.companiesCollection.doc(companyId).get();
    const company = snap.data() as CompanyDocument | undefined;
    const yearMonth = CompanyRepository.currentYearMonth();
    const limit = company?.monthlyTaskLimit ?? null;
    const usage = company?.taskUsage;
    const used =
      usage?.yearMonth === yearMonth ? (usage.count ?? 0) : 0;
    return { used, limit, yearMonth };
  }

  private static currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
