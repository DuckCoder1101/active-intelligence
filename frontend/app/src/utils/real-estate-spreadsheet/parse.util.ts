import * as XLSX from 'xlsx';

import {
  DOCUMENTATION_STATUS_LOOKUP,
  FURNISHINGS_LOOKUP,
  H,
  HEADERS,
  PROPERTY_FEATURE_LOOKUP,
  PROPERTY_TYPE_LOOKUP,
  REAL_ESTATE_CONDITION_LOOKUP,
  REAL_ESTATE_PURPOSE_LOOKUP,
  REAL_ESTATE_STATUS_LOOKUP,
  SHEET_NAME,
  normalize,
  type ColumnKey,
} from './headers.util';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';
import type {
  DocumentationStatus,
  Furnishings,
  PropertyFeature,
  PropertyType,
  RealEstateCondition,
  RealEstatePurpose,
  RealEstateStatus,
} from '@/models/real-estate.model';

export interface ImportRealEstateRow {
  rowNumber: number;
  code?: string;
  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;
  owner: { name: string; phone: string; email?: string };
  condominium?: { condominiumName?: string; condominiumFee?: number };
  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  region?: string;
  state: string;
  zipCode?: string;
  block?: string;
  usableAreaM2?: number;
  totalAreaM2?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpots?: number;
  floor?: number;
  buildingFloors?: number;
  condition?: RealEstateCondition;
  furnishings?: Furnishings;
  salePrice?: number;
  rentPrice?: number;
  iptuValue?: number;
  acceptsFinancing?: boolean;
  acceptsExchange?: boolean;
  negotiable?: boolean;
  features?: PropertyFeature[];
  status?: RealEstateStatus;
  visibleOnWebsite?: boolean;
  featured?: boolean;
  publicDescription?: string;
  portals?: string[];
  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;
}

export interface ImportRealEstateRowResult {
  rowNumber: number;
  code?: string;
  status: 'created' | 'updated' | 'error';
  message?: string;
}

export interface ImportRealEstateResult {
  created: number;
  updated: number;
  failed: number;
  results: ImportRealEstateRowResult[];
}

/**
 * Acha a linha de cabeçalho dentro das primeiras linhas da planilha, em vez
 * de assumir que é sempre a linha 1 — o modelo/exportação geram uma linha de
 * instrução ACIMA do cabeçalho (ver `INSTRUCTION_TEXT` em headers.util.ts),
 * e usuários podem apagar essa linha ou inserir linhas em branco. Considera
 * "linha de cabeçalho" a primeira que bate com pelo menos metade dos
 * cabeçalhos esperados.
 */
function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => String(c ?? '').trim());
    const matches = HEADERS.filter((h) => cells.includes(h)).length;
    if (matches >= HEADERS.length / 2) {
      return i;
    }
  }
  return 0;
}

export async function parseSpreadsheetFile(
  file: File,
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.includes(SHEET_NAME)
    ? SHEET_NAME
    : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  });

  const headerRowIndex = findHeaderRowIndex(rows);
  const headerRow = (rows[headerRowIndex] ?? []).map((c) =>
    String(c ?? '').trim(),
  );

  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headerRow.forEach((header, i) => {
        if (header) {
          obj[header] = row[i] ?? '';
        }
      });
      return obj;
    });
}

function parseNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : undefined;
  }
  let s = String(raw ?? '').trim();
  if (!s) {
    return undefined;
  }
  s = s.replace(/[^\d,.-]/g, '');
  if (!s) {
    return undefined;
  }
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseBoolean(raw: unknown): boolean | undefined {
  if (typeof raw === 'boolean') {
    return raw;
  }
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) {
    return undefined;
  }
  if (['sim', 'verdadeiro', 'true', '1', 'yes'].includes(s)) {
    return true;
  }
  if (['não', 'nao', 'falso', 'false', '0', 'no'].includes(s)) {
    return false;
  }
  return undefined;
}

/**
 * Converte uma linha bruta da planilha (chaves = cabeçalhos de `H`) no
 * formato aceito pelo `importRealEstateHandler`. Os 8 campos obrigatórios
 * são exatamente os marcados com `*` no formulário de cadastro manual
 * (identification-tab/location-tab.component.tsx) — ver plano da feature.
 */
export function mapRowToImportInput(
  row: Record<string, unknown>,
  rowNumber: number,
): { input?: ImportRealEstateRow; errors: string[] } {
  const errors: string[] = [];
  const str = (key: ColumnKey) => String(row[H[key]] ?? '').trim();

  const code = str('code') || undefined;
  const title = str('title') || undefined;
  const description = str('description') || undefined;

  const propertyTypeRaw = str('propertyType');
  const propertyType = propertyTypeRaw
    ? PROPERTY_TYPE_LOOKUP.get(normalize(propertyTypeRaw))
    : undefined;
  if (!propertyTypeRaw) {
    errors.push(`${H.propertyType} é obrigatório`);
  } else if (!propertyType) {
    errors.push(
      `${H.propertyType}: valor "${propertyTypeRaw}" não reconhecido — veja a aba Legenda`,
    );
  }
  const propertyTypeOther = str('propertyTypeOther') || undefined;

  const purposesRaw = str('purposes');
  const purposes: RealEstatePurpose[] = [];
  if (!purposesRaw) {
    errors.push(`${H.purposes} é obrigatório`);
  } else {
    for (const part of purposesRaw
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)) {
      const value = REAL_ESTATE_PURPOSE_LOOKUP.get(normalize(part));
      if (!value) {
        errors.push(
          `${H.purposes}: valor "${part}" não reconhecido — veja a aba Legenda`,
        );
      } else {
        purposes.push(value);
      }
    }
  }

  const internalNotes = str('internalNotes') || undefined;

  const ownerName = str('ownerName');
  if (!ownerName) {
    errors.push(`${H.ownerName} é obrigatório`);
  } else if (ownerName.length < 5) {
    errors.push(`${H.ownerName} deve ter ao menos 5 caracteres`);
  }
  const ownerPhone = str('ownerPhone');
  if (!ownerPhone) {
    errors.push(`${H.ownerPhone} é obrigatório`);
  }
  const ownerEmail = str('ownerEmail') || undefined;

  const address = str('address');
  if (!address) {
    errors.push(`${H.address} é obrigatório`);
  }
  const addressNumber = str('addressNumber') || undefined;
  const complement = str('complement') || undefined;
  const neighborhood = str('neighborhood');
  if (!neighborhood) {
    errors.push(`${H.neighborhood} é obrigatório`);
  }
  const region = str('region') || undefined;
  const city = str('city');
  if (!city) {
    errors.push(`${H.city} é obrigatório`);
  }
  const stateRaw = str('state').toUpperCase();
  if (!stateRaw) {
    errors.push(`${H.state} é obrigatório`);
  } else if (
    !BRAZILIAN_STATES.includes(stateRaw as (typeof BRAZILIAN_STATES)[number])
  ) {
    errors.push(`${H.state}: "${stateRaw}" não é uma UF válida`);
  }
  const zipCode = str('zipCode') || undefined;
  const block = str('block') || undefined;

  const condominiumName = str('condominiumName') || undefined;
  const condominiumFee = parseNumber(row[H.condominiumFee]);
  const condominium =
    condominiumName || condominiumFee !== undefined
      ? { condominiumName, condominiumFee }
      : undefined;

  const usableAreaM2 = parseNumber(row[H.usableAreaM2]);
  const totalAreaM2 = parseNumber(row[H.totalAreaM2]);
  const bedrooms = parseNumber(row[H.bedrooms]);
  const suites = parseNumber(row[H.suites]);
  const bathrooms = parseNumber(row[H.bathrooms]);
  const parkingSpots = parseNumber(row[H.parkingSpots]);
  const floor = parseNumber(row[H.floor]);
  const buildingFloors = parseNumber(row[H.buildingFloors]);

  const conditionRaw = str('condition');
  const condition = conditionRaw
    ? REAL_ESTATE_CONDITION_LOOKUP.get(normalize(conditionRaw))
    : undefined;
  if (conditionRaw && !condition) {
    errors.push(
      `${H.condition}: valor "${conditionRaw}" não reconhecido — veja a aba Legenda`,
    );
  }

  const furnishingsRaw = str('furnishings');
  const furnishings = furnishingsRaw
    ? FURNISHINGS_LOOKUP.get(normalize(furnishingsRaw))
    : undefined;
  if (furnishingsRaw && !furnishings) {
    errors.push(
      `${H.furnishings}: valor "${furnishingsRaw}" não reconhecido — veja a aba Legenda`,
    );
  }

  const salePrice = parseNumber(row[H.salePrice]);
  const rentPrice = parseNumber(row[H.rentPrice]);
  const iptuValue = parseNumber(row[H.iptuValue]);
  const acceptsFinancing = parseBoolean(row[H.acceptsFinancing]);
  const acceptsExchange = parseBoolean(row[H.acceptsExchange]);
  const negotiable = parseBoolean(row[H.negotiable]);

  const featuresRaw = str('features');
  const features: PropertyFeature[] = [];
  for (const part of featuresRaw
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)) {
    const value = PROPERTY_FEATURE_LOOKUP.get(normalize(part));
    if (!value) {
      errors.push(
        `${H.features}: valor "${part}" não reconhecido — veja a aba Legenda`,
      );
    } else {
      features.push(value);
    }
  }

  const statusRaw = str('status');
  const status = statusRaw
    ? REAL_ESTATE_STATUS_LOOKUP.get(normalize(statusRaw))
    : undefined;
  if (statusRaw && !status) {
    errors.push(
      `${H.status}: valor "${statusRaw}" não reconhecido — veja a aba Legenda`,
    );
  }

  const visibleOnWebsite = parseBoolean(row[H.visibleOnWebsite]);
  const featured = parseBoolean(row[H.featured]);
  const publicDescription = str('publicDescription') || undefined;
  const portalsRaw = str('portals');
  const portals = portalsRaw
    ? portalsRaw
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
    : undefined;

  const registryNumber = str('registryNumber') || undefined;
  const documentationStatusRaw = str('documentationStatus');
  const documentationStatus = documentationStatusRaw
    ? DOCUMENTATION_STATUS_LOOKUP.get(normalize(documentationStatusRaw))
    : undefined;
  if (documentationStatusRaw && !documentationStatus) {
    errors.push(
      `${H.documentationStatus}: valor "${documentationStatusRaw}" não reconhecido — veja a aba Legenda`,
    );
  }
  const iptuNumber = str('iptuNumber') || undefined;

  if (errors.length > 0 || !propertyType) {
    return { errors };
  }

  return {
    errors: [],
    input: {
      rowNumber,
      code,
      title,
      description,
      propertyType,
      propertyTypeOther,
      purposes,
      internalNotes,
      owner: { name: ownerName, phone: ownerPhone, email: ownerEmail },
      condominium,
      address,
      addressNumber,
      complement,
      neighborhood,
      region,
      city,
      state: stateRaw,
      zipCode,
      block,
      usableAreaM2,
      totalAreaM2,
      bedrooms,
      suites,
      bathrooms,
      parkingSpots,
      floor,
      buildingFloors,
      condition,
      furnishings,
      salePrice,
      rentPrice,
      iptuValue,
      acceptsFinancing,
      acceptsExchange,
      negotiable,
      features,
      status,
      visibleOnWebsite,
      featured,
      publicDescription,
      portals,
      registryNumber,
      documentationStatus,
      iptuNumber,
    },
  };
}
