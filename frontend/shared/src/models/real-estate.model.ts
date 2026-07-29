export const REAL_ESTATE_STATUSES = [
  'disponivel',
  'reservado',
  'vendido',
  'alugado',
  'inativo',
] as const;
export type RealEstateStatus = (typeof REAL_ESTATE_STATUSES)[number];
export const REAL_ESTATE_STATUS_LABELS: Record<RealEstateStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  alugado: 'Alugado',
  inativo: 'Inativo',
};

export const REAL_ESTATE_PURPOSES = ['venda', 'locacao'] as const;
export type RealEstatePurpose = (typeof REAL_ESTATE_PURPOSES)[number];
export const REAL_ESTATE_PURPOSE_LABELS: Record<RealEstatePurpose, string> = {
  venda: 'Venda',
  locacao: 'Locação',
};

export const REAL_ESTATE_CONDITIONS = ['novo', 'usado', 'na_planta'] as const;
export type RealEstateCondition = (typeof REAL_ESTATE_CONDITIONS)[number];
export const REAL_ESTATE_CONDITION_LABELS: Record<RealEstateCondition, string> = {
  novo: 'Novo',
  usado: 'Usado',
  na_planta: 'Na planta',
};

export const FURNISHINGS_OPTIONS = ['sim', 'nao', 'parcialmente'] as const;
export type Furnishings = (typeof FURNISHINGS_OPTIONS)[number];
export const FURNISHINGS_LABELS: Record<Furnishings, string> = {
  sim: 'Sim',
  nao: 'Não',
  parcialmente: 'Parcialmente',
};

export const DOCUMENTATION_STATUSES = ['regularizado', 'pendente'] as const;
export type DocumentationStatus = (typeof DOCUMENTATION_STATUSES)[number];
export const DOCUMENTATION_STATUS_LABELS: Record<DocumentationStatus, string> = {
  regularizado: 'Regularizado',
  pendente: 'Pendente',
};

// Espelhado de frontend/shared/src/models/lead.model.ts (PROPERTY_TYPES) —
// mantenha as duas listas em sincronia.
export const PROPERTY_TYPES = [
  'apartamento',
  'casa',
  'terreno',
  'chacara',
  'casa_de_condominio',
  'casa_comercial',
  'cobertura',
  'terreno_em_condominio',
  'salao_comercial',
  'sala_comercial',
  'ponto_comercial',
  'galpao',
  'rural',
  'studio_kitnet',
  'outro',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  chacara: 'Chácara',
  casa_de_condominio: 'Casa de condomínio',
  casa_comercial: 'Casa comercial',
  cobertura: 'Cobertura',
  terreno_em_condominio: 'Terreno em condomínio',
  salao_comercial: 'Salão comercial',
  sala_comercial: 'Sala comercial',
  ponto_comercial: 'Ponto comercial',
  galpao: 'Galpão',
  rural: 'Rural',
  studio_kitnet: 'Studio/kitnet',
  outro: 'Outro',
};

// Espelhado de frontend/shared/src/models/lead.model.ts (LEAD_PREFERENCES),
// renomeado para descrever comodidades do imóvel em si — mantenha as duas
// listas em sincronia.
export const PROPERTY_FEATURES = [
  'elevador',
  'portaria_24h_portao_eletronico',
  'andar_alto_ou_terreo',
  'varanda_gourmet',
  'sacada',
  'area_servico_separada',
  'dependencia_empregada',
  'armarios_planejados',
  'ar_condicionado',
  'aquecimento_gas_solar',
  'vaga_coberta',
  'vaga_demarcada',
  'vaga_2_mais_carros',
  'vaga_moto',
  'piscina',
  'academia',
  'salao_festas',
  'espaco_gourmet_churrasqueira',
  'playground',
  'quadra_poliesportiva',
  'espaco_pet',
  'coworking',
  'bicicletario',
  'portaria_24h',
  'circuito_cameras',
  'controle_acesso_biometrico',
  'proximo_escola',
  'proximo_transporte_publico',
  'proximo_mercado_comercio',
  'vista_livre',
  'rua_tranquila',
  'facil_acesso_rodovia',
  'aceita_pet',
  'mobiliado',
  'acessibilidade',
  'imovel_novo_planta_pronto',
  'documentacao_regularizada',
  'baixa_taxa_condominio',
  'painel_solar',
  'captacao_agua_chuva',
  'certificacao_sustentavel',
] as const;
export type PropertyFeature = (typeof PROPERTY_FEATURES)[number];

export const PROPERTY_FEATURE_LABELS: Record<PropertyFeature, string> = {
  elevador: 'Elevador',
  portaria_24h_portao_eletronico: 'Portaria 24h / portão eletrônico',
  andar_alto_ou_terreo: 'Andar alto / andar térreo',
  varanda_gourmet: 'Varanda / varanda gourmet',
  sacada: 'Sacada',
  area_servico_separada: 'Área de serviço separada',
  dependencia_empregada: 'Dependência de empregada (quarto/banheiro de serviço)',
  armarios_planejados: 'Armários planejados (cozinha, quartos)',
  ar_condicionado: 'Ar-condicionado instalado',
  aquecimento_gas_solar: 'Aquecimento a gás/solar',
  vaga_coberta: 'Vaga coberta',
  vaga_demarcada: 'Vaga demarcada (não rotativa)',
  vaga_2_mais_carros: 'Vaga para 2+ carros',
  vaga_moto: 'Vaga para moto',
  piscina: 'Piscina',
  academia: 'Academia',
  salao_festas: 'Salão de festas',
  espaco_gourmet_churrasqueira: 'Espaço gourmet/churrasqueira',
  playground: 'Playground / brinquedoteca',
  quadra_poliesportiva: 'Quadra poliesportiva',
  espaco_pet: 'Espaço pet / pet place',
  coworking: 'Coworking / espaço de estudos',
  bicicletario: 'Bicicletário',
  portaria_24h: 'Portaria 24h',
  circuito_cameras: 'Circuito de câmeras',
  controle_acesso_biometrico: 'Controle de acesso biométrico/facial',
  proximo_escola: 'Próximo a escola',
  proximo_transporte_publico: 'Próximo a transporte público/metrô',
  proximo_mercado_comercio: 'Próximo a mercado/comércio',
  vista_livre: 'Vista livre / vista para o mar-parque-cidade',
  rua_tranquila: 'Rua tranquila / pouco movimento',
  facil_acesso_rodovia: 'Fácil acesso a rodovia',
  aceita_pet: 'Aceita pet',
  mobiliado: 'Mobiliado / semimobiliado',
  acessibilidade: 'Acessibilidade (rampas, elevador adaptado)',
  imovel_novo_planta_pronto: 'Imóvel novo / na planta / pronto pra morar',
  documentacao_regularizada: 'Documentação regularizada (para financiamento)',
  baixa_taxa_condominio: 'Baixa taxa de condomínio',
  painel_solar: 'Painel solar',
  captacao_agua_chuva: 'Captação de água da chuva',
  certificacao_sustentavel: 'Certificação sustentável (LEED, etc.)',
};

export interface PropertyFeatureGroup {
  label: string;
  features: PropertyFeature[];
}

export const PROPERTY_FEATURE_GROUPS: PropertyFeatureGroup[] = [
  {
    label: 'Estrutura do imóvel',
    features: [
      'elevador',
      'portaria_24h_portao_eletronico',
      'andar_alto_ou_terreo',
      'varanda_gourmet',
      'sacada',
      'area_servico_separada',
      'dependencia_empregada',
      'armarios_planejados',
      'ar_condicionado',
      'aquecimento_gas_solar',
    ],
  },
  {
    label: 'Vagas e garagem',
    features: ['vaga_coberta', 'vaga_demarcada', 'vaga_2_mais_carros', 'vaga_moto'],
  },
  {
    label: 'Lazer e área comum (condomínio)',
    features: [
      'piscina',
      'academia',
      'salao_festas',
      'espaco_gourmet_churrasqueira',
      'playground',
      'quadra_poliesportiva',
      'espaco_pet',
      'coworking',
      'bicicletario',
    ],
  },
  {
    label: 'Segurança',
    features: ['portaria_24h', 'circuito_cameras', 'controle_acesso_biometrico'],
  },
  {
    label: 'Localização e entorno',
    features: [
      'proximo_escola',
      'proximo_transporte_publico',
      'proximo_mercado_comercio',
      'vista_livre',
      'rua_tranquila',
      'facil_acesso_rodovia',
    ],
  },
  {
    label: 'Condições especiais',
    features: [
      'aceita_pet',
      'mobiliado',
      'acessibilidade',
      'imovel_novo_planta_pronto',
      'documentacao_regularizada',
      'baixa_taxa_condominio',
    ],
  },
  {
    label: 'Sustentabilidade',
    features: ['painel_solar', 'captacao_agua_chuva', 'certificacao_sustentavel'],
  },
];

export interface RealEstateOwner {
  name: string;
  phone: string;
  email?: string;
}

export interface RealEstateCondominium {
  condominiumFee?: number;
  condominiumName?: string;
}

export interface RealEstate {
  realEstateId: string;
  companyId: string;
  status: RealEstateStatus;

  code: string;
  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;

  owner: RealEstateOwner;

  condominium?: RealEstateCondominium;

  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  region?: string;
  state: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
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
  furnishings: Furnishings;

  salePrice?: number;
  rentPrice?: number;
  iptuValue?: number;
  acceptsFinancing: boolean;
  acceptsExchange: boolean;
  negotiable: boolean;

  features: PropertyFeature[];

  photos: string[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  tourUrl?: string;

  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;

  visibleOnWebsite: boolean;
  featured: boolean;
  publicDescription?: string;
  portals?: string[];

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveRealEstateDTO {
  companyId: string;
  realEstateId?: string;
  status?: RealEstateStatus;

  title?: string;
  description?: string;
  propertyType: PropertyType;
  propertyTypeOther?: string;
  purposes: RealEstatePurpose[];
  internalNotes?: string;

  owner: RealEstateOwner;

  condominium?: RealEstateCondominium;

  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  region?: string;
  state: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
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

  photos?: string[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  tourUrl?: string;

  registryNumber?: string;
  documentationStatus?: DocumentationStatus;
  iptuNumber?: string;

  visibleOnWebsite?: boolean;
  featured?: boolean;
  publicDescription?: string;
  portals?: string[];
}
