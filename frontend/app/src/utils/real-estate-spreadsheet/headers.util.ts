import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';
import {
  DOCUMENTATION_STATUS_LABELS,
  DOCUMENTATION_STATUSES,
  FURNISHINGS_LABELS,
  FURNISHINGS_OPTIONS,
  PROPERTY_FEATURE_LABELS,
  PROPERTY_FEATURES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  REAL_ESTATE_CONDITION_LABELS,
  REAL_ESTATE_CONDITIONS,
  REAL_ESTATE_PURPOSE_LABELS,
  REAL_ESTATE_PURPOSES,
  REAL_ESTATE_STATUS_LABELS,
  REAL_ESTATE_STATUSES,
} from '@/models/real-estate.model';

/**
 * Cabeçalhos da planilha (modelo, exportação e importação usam os mesmos
 * textos) — campos com " *" são obrigatórios, igual ao formulário de
 * cadastro manual (ver identification-tab/location-tab.component.tsx).
 */
export const H = {
  // Campos obrigatórios primeiro — mesmos 8 marcados com `*` no formulário
  // de cadastro manual (identification-tab/location-tab.component.tsx).
  propertyType: 'Tipo de imóvel *',
  purposes: 'Finalidades *',
  ownerName: 'Proprietário - Nome *',
  ownerPhone: 'Proprietário - Telefone *',
  address: 'Endereço *',
  neighborhood: 'Bairro *',
  city: 'Cidade *',
  state: 'Estado (UF) *',

  code: 'Código',
  title: 'Título',
  description: 'Descrição',
  propertyTypeOther: 'Tipo de imóvel (outro)',
  internalNotes: 'Observações internas',
  ownerEmail: 'Proprietário - E-mail',
  addressNumber: 'Número',
  complement: 'Complemento',
  region: 'Região',
  zipCode: 'CEP',
  block: 'Bloco',
  condominiumName: 'Condomínio - Nome',
  condominiumFee: 'Condomínio - Taxa',
  usableAreaM2: 'Área útil (m²)',
  totalAreaM2: 'Área total (m²)',
  bedrooms: 'Quartos',
  suites: 'Suítes',
  bathrooms: 'Banheiros',
  parkingSpots: 'Vagas',
  floor: 'Andar',
  buildingFloors: 'Andares do prédio',
  condition: 'Condição',
  furnishings: 'Mobiliado',
  salePrice: 'Preço de venda',
  rentPrice: 'Preço de aluguel',
  iptuValue: 'Valor IPTU',
  acceptsFinancing: 'Aceita financiamento',
  acceptsExchange: 'Aceita permuta',
  negotiable: 'Negociável',
  features: 'Comodidades',
  status: 'Status',
  visibleOnWebsite: 'Visível no site',
  featured: 'Destaque',
  publicDescription: 'Descrição pública',
  portals: 'Portais',
  registryNumber: 'Nº registro',
  documentationStatus: 'Situação da documentação',
  iptuNumber: 'Nº IPTU',
} as const;

export type ColumnKey = keyof typeof H;
export const COLUMN_KEYS = Object.keys(H) as ColumnKey[];
export const HEADERS = COLUMN_KEYS.map((k) => H[k]);

export const SHEET_NAME = 'Imóveis';
export const LEGEND_SHEET_NAME = 'Legenda';

/** Texto exibido numa linha só, acima do cabeçalho, em toda planilha gerada. */
export const INSTRUCTION_TEXT =
  'Campos marcados com * são obrigatórios. Consulte a aba "Legenda" para os valores aceitos nos campos de seleção.';

export interface RealEstateSheetData {
  instructionText: string;
  headers: string[];
  dataRows: (string | number)[][];
  referenceRows: (string | number)[][];
}

export function buildSheetData(
  dataRows: (string | number)[][],
): RealEstateSheetData {
  return {
    instructionText: INSTRUCTION_TEXT,
    headers: HEADERS,
    dataRows,
    referenceRows: buildReferenceRows(),
  };
}

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildLookup<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): Map<string, T> {
  const map = new Map<string, T>();
  values.forEach((value) => map.set(normalize(labels[value]), value));
  return map;
}

export const PROPERTY_TYPE_LOOKUP = buildLookup(
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
);
export const REAL_ESTATE_PURPOSE_LOOKUP = buildLookup(
  REAL_ESTATE_PURPOSES,
  REAL_ESTATE_PURPOSE_LABELS,
);
export const REAL_ESTATE_CONDITION_LOOKUP = buildLookup(
  REAL_ESTATE_CONDITIONS,
  REAL_ESTATE_CONDITION_LABELS,
);
export const FURNISHINGS_LOOKUP = buildLookup(
  FURNISHINGS_OPTIONS,
  FURNISHINGS_LABELS,
);
export const REAL_ESTATE_STATUS_LOOKUP = buildLookup(
  REAL_ESTATE_STATUSES,
  REAL_ESTATE_STATUS_LABELS,
);
export const DOCUMENTATION_STATUS_LOOKUP = buildLookup(
  DOCUMENTATION_STATUSES,
  DOCUMENTATION_STATUS_LABELS,
);
export const PROPERTY_FEATURE_LOOKUP = buildLookup(
  PROPERTY_FEATURES,
  PROPERTY_FEATURE_LABELS,
);

function buildReferenceRows(): (string | number)[][] {
  return [
    [
      H.propertyType,
      PROPERTY_TYPES.map((t) => PROPERTY_TYPE_LABELS[t]).join('; '),
    ],
    [
      H.purposes,
      `${REAL_ESTATE_PURPOSES.map((p) => REAL_ESTATE_PURPOSE_LABELS[p]).join('; ')} (separe múltiplos valores com ;)`,
    ],
    [
      H.condition,
      REAL_ESTATE_CONDITIONS.map((c) => REAL_ESTATE_CONDITION_LABELS[c]).join(
        '; ',
      ),
    ],
    [
      H.furnishings,
      FURNISHINGS_OPTIONS.map((f) => FURNISHINGS_LABELS[f]).join('; '),
    ],
    [
      H.status,
      `${REAL_ESTATE_STATUSES.map((s) => REAL_ESTATE_STATUS_LABELS[s]).join('; ')} (deixe em branco em um imóvel novo = Disponível)`,
    ],
    [
      H.documentationStatus,
      DOCUMENTATION_STATUSES.map((d) => DOCUMENTATION_STATUS_LABELS[d]).join(
        '; ',
      ),
    ],
    [H.state, BRAZILIAN_STATES.join('; ')],
    [
      H.features,
      `${PROPERTY_FEATURES.map((f) => PROPERTY_FEATURE_LABELS[f]).join('; ')} (separe múltiplos valores com ;)`,
    ],
    [
      'Campos Sim/Não',
      'Aceita financiamento, Aceita permuta, Negociável, Visível no site, Destaque — use "Sim" ou "Não"',
    ],
    [
      H.code,
      'Deixe em branco para criar um imóvel novo. Preencha com o código (ex: I-001) para atualizar um imóvel existente.',
    ],
  ];
}

