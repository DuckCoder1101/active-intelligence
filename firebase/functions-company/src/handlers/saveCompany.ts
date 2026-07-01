import { HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import type { ZodError } from 'zod';

import {
  onCallHandler,
  CompanySchema,
  CompanyRepository,
  requireAccess,
} from 'functions-shared';

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

const ACCESS = {
  minAccessLevel: 'admin' as const,
  permissions: ['manage-clients' as const],
};

export const saveCompanyHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = CompanySchema.registerSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError('invalid-argument', formatZodErrors(error));
  }

  logger.info('saveCompany', { action: data.companyId ? 'update' : 'create', companyId: data.companyId });

  await CompanyRepository.saveCompany(data);

  return true;
});
