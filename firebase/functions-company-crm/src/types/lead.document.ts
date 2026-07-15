import { Timestamp } from "firebase-admin/firestore";

export const BUSINESS_TYPES = ["compra", "venda", "locacao", "outro"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const PROPERTY_TYPES = [
  "apartamento",
  "casa",
  "terreno",
  "chacara",
  "casa_de_condominio",
  "casa_comercial",
  "cobertura",
  "terreno_em_condominio",
  "salao_comercial",
  "sala_comercial",
  "ponto_comercial",
  "galpao",
  "rural",
  "studio_kitnet",
  "outro",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PURPOSES = [
  "moradia_propria",
  "investimento",
  "segunda_residencia",
  "realocacao",
] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PAYMENT_METHODS = [
  "a_vista",
  "financiamento",
  "fgts",
  "consorcio",
  "permuta",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TEMPERATURES = ["frio", "morno", "quente"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

// Espelhado em frontend/shared/src/models/lead.model.ts — mantenha as duas
// listas em sincronia.
export const LEAD_PREFERENCES = [
  // Estrutura do imóvel
  "elevador",
  "portaria_24h_portao_eletronico",
  "andar_alto_ou_terreo",
  "varanda_gourmet",
  "sacada",
  "area_servico_separada",
  "dependencia_empregada",
  "armarios_planejados",
  "ar_condicionado",
  "aquecimento_gas_solar",
  // Vagas e garagem
  "vaga_coberta",
  "vaga_demarcada",
  "vaga_2_mais_carros",
  "vaga_moto",
  // Lazer e área comum
  "piscina",
  "academia",
  "salao_festas",
  "espaco_gourmet_churrasqueira",
  "playground",
  "quadra_poliesportiva",
  "espaco_pet",
  "coworking",
  "bicicletario",
  // Segurança
  "portaria_24h",
  "circuito_cameras",
  "controle_acesso_biometrico",
  // Localização e entorno
  "proximo_escola",
  "proximo_transporte_publico",
  "proximo_mercado_comercio",
  "vista_livre",
  "rua_tranquila",
  "facil_acesso_rodovia",
  // Condições especiais
  "aceita_pet",
  "mobiliado",
  "acessibilidade",
  "imovel_novo_planta_pronto",
  "documentacao_regularizada",
  "baixa_taxa_condominio",
  // Sustentabilidade
  "painel_solar",
  "captacao_agua_chuva",
  "certificacao_sustentavel",
] as const;
export type LeadPreference = (typeof LEAD_PREFERENCES)[number];

export interface LeadDocument {
  companyId: string;
  status: string;

  // Sessão 1 — Contato
  name: string;
  phone: string;
  email?: string;
  originId: string;
  referredBy?: string;
  tagIds: string[];
  assignedTo: string[];

  // Sessão 2 — Intenção/Negócio
  businessType: BusinessType;
  businessTypeOther?: string;
  propertyType?: PropertyType;
  propertyTypeOther?: string;
  purpose?: Purpose;

  // Sessão 3 — Perfil de busca
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

  // Sessão 4 — Qualificação
  paymentMethod?: PaymentMethod;
  hasApprovedOrSimulatedCredit: boolean;
  decidesAlone: boolean;
  decidesWith?: string;
  consultedOtherRealtor: boolean;
  temperature?: Temperature;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
