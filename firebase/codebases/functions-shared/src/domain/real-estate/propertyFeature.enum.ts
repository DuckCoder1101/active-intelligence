// Comodidades de imóvel — usado tanto pelo perfil de busca do Lead (CRM)
// quanto pelo cadastro de Imóvel (real-estate).
// Espelhado em frontend/shared/src/models/real-estate.model.ts — mantenha as
// duas listas em sincronia.
export const PROPERTY_FEATURES = [
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
export type PropertyFeature = (typeof PROPERTY_FEATURES)[number];
