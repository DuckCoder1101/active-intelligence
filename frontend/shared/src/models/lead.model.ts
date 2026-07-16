export const BUSINESS_TYPES = ['compra', 'venda', 'locacao', 'outro'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  compra: 'Compra',
  venda: 'Venda',
  locacao: 'Locação',
  outro: 'Outro',
};

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

export const PURPOSES = [
  'moradia_propria',
  'investimento',
  'segunda_residencia',
  'realocacao',
] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_LABELS: Record<Purpose, string> = {
  moradia_propria: 'Moradia própria',
  investimento: 'Investimento',
  segunda_residencia: 'Segunda residência',
  realocacao: 'Realocação',
};

export const PAYMENT_METHODS = [
  'a_vista',
  'financiamento',
  'fgts',
  'consorcio',
  'permuta',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  a_vista: 'À vista',
  financiamento: 'Financiamento',
  fgts: 'FGTS',
  consorcio: 'Consórcio',
  permuta: 'Permuta',
};

export const TEMPERATURES = ['frio', 'morno', 'quente'] as const;
export type Temperature = (typeof TEMPERATURES)[number];
export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  frio: '🧊 Frio',
  morno: '⛅ Morno',
  quente: '🔥 Quente',
};

export const LEAD_PREFERENCES = [
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
export type LeadPreference = (typeof LEAD_PREFERENCES)[number];

export const LEAD_PREFERENCE_LABELS: Record<LeadPreference, string> = {
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

export interface LeadPreferenceGroup {
  label: string;
  preferences: LeadPreference[];
}

export const LEAD_PREFERENCE_GROUPS: LeadPreferenceGroup[] = [
  {
    label: 'Estrutura do imóvel',
    preferences: [
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
    preferences: ['vaga_coberta', 'vaga_demarcada', 'vaga_2_mais_carros', 'vaga_moto'],
  },
  {
    label: 'Lazer e área comum (condomínio)',
    preferences: [
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
    preferences: ['portaria_24h', 'circuito_cameras', 'controle_acesso_biometrico'],
  },
  {
    label: 'Localização e entorno',
    preferences: [
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
    preferences: [
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
    preferences: ['painel_solar', 'captacao_agua_chuva', 'certificacao_sustentavel'],
  },
];

export interface Lead {
  leadId: string;
  companyId: string;
  status: string;

  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds: string[];
  assignedTo: string[];
  notes?: string;

  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

  city?: string;
  state?: string;
  neighborhoods: string[];
  acceptsNearbyNeighborhoods: boolean;
  priceMin: number;
  priceMax: number;
  propertySizeM2?: number;
  bedrooms?: number;
  suites?: number;
  parkingSpots?: number;
  floor?: number;
  preferences: LeadPreference[];

  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit: boolean;
  decidesAlone: boolean;
  decidesWith?: string;
  consultedOtherRealtor: boolean;
  temperature?: Temperature;

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveLeadDTO {
  leadId?: string;
  status?: string;

  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds?: string[];
  assignedTo?: string[];
  notes?: string;

  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

  city?: string;
  state?: string;
  neighborhoods?: string[];
  acceptsNearbyNeighborhoods?: boolean;
  priceMin?: number;
  priceMax?: number;
  propertySizeM2?: number;
  bedrooms?: number;
  suites?: number;
  parkingSpots?: number;
  floor?: number;
  preferences?: LeadPreference[];

  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit?: boolean;
  decidesAlone?: boolean;
  decidesWith?: string;
  consultedOtherRealtor?: boolean;
  temperature?: Temperature;
}

export interface CrmTag {
  tagId: string;
  name: string;
}

export interface CrmOrigin {
  originId: string;
  name: string;
}

export interface CrmColumn {
  columnId: string;
  name: string;
  color: string;
  order: number;
}

export const CRM_COLUMN_COLOR_PRESETS = [
  { label: 'Cinza', value: '#94a3b8' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Violeta', value: '#8b5cf6' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Verde', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
] as const;
