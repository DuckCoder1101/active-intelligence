import { HttpsError } from 'firebase-functions/https';
import type { ZodError } from 'zod';

import { onCallHandler } from '@shared/utils/onCallHandler';
import { getAuthenticatedUser } from '@shared/utils/getAuthenticatedUser';
import CompanySchema from '../data/company.schema';
import { CompanyRepository } from '../repositories/company.repository';

const FIELD_LABELS: Record<string, string> = {
  displayName: 'Nome de exibição',
  'legalInformation.documentNumber': 'CNPJ',
  'legalInformation.legalName': 'Razão social',
  'legalInformation.tradeName': 'Nome fantasia',
  'contact.email': 'E-mail',
  'contact.phone': 'Telefone',
  companyStage: 'Estágio',
  'business.businessSector': 'Setor de atuação',
  'business.customSegment': 'Segmento',
  'business.cnae': 'CNAE',
  'business.revenueRange': 'Faturamento',
  'business.quantityOfEmployees': 'Funcionários',
  'business.quantityOfBrokers': 'Corretores',
  'location.address': 'Endereço',
  'location.number': 'Número',
  'location.complement': 'Complemento',
  'location.neighborhood': 'Bairro',
  'location.city': 'Cidade',
  'location.state': 'Estado',
  'location.zipCode': 'CEP',
  'social.websiteUrl': 'Site',
  'social.instagramUsername': 'Instagram',
  'social.linkedInUsername': 'LinkedIn',
};

function formatZodErrors(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      const label = FIELD_LABELS[path] ?? path;
      return `${label}: ${issue.message}`;
    })
    .join('\n');
}

export const saveCompanyHandler = onCallHandler(async (req) => {
  const { accessLevel } = getAuthenticatedUser(req);

  if (accessLevel !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado!');
  }

  const { success, data, error } = CompanySchema.registerSchema.safeParse(req.data);

  if (!success) {
    throw new HttpsError('invalid-argument', formatZodErrors(error));
  }

  await CompanyRepository.saveCompany(data);

  return true;
});
