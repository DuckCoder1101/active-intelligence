// Reexportados para não quebrar os imports existentes no módulo — os valores
// canônicos agora vivem em functions-shared, compartilhados com o cadastro
// de imóveis (real-estate) e com a integração de Lead Ads (meta-integration).
export {
  BUSINESS_TYPES,
  DEAL_STATUSES,
  LEAD_PREFERENCES,
  LEAD_SOURCES,
  PAYMENT_METHODS,
  PROPERTY_TYPES,
  PURPOSES,
  TEMPERATURES,
} from "functions-shared";
export type {
  BusinessType,
  DealStatus,
  LeadDocument,
  LeadPreference,
  LeadSource,
  PaymentMethod,
  Purpose,
  PropertyType,
  Temperature,
} from "functions-shared";
