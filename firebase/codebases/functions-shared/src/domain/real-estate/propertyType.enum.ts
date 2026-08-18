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
