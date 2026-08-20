import { logger } from "firebase-functions";

export interface FacebookInsightAction {
  action_type: string;
  value: string;
}

/**
 * action_types que a Graph API usa para leads de formulários (Lead Ads) e de
 * conversões de pixel/site apontando pro CRM. Verificado apenas contra a
 * documentação pública da Graph API — precisa ser validado com uma conta real
 * após o deploy (ver plano: maior risco de correção da feature).
 */
export const LEAD_ACTION_TYPES = new Set([
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
]);

export function sumLeadActions(actions?: FacebookInsightAction[]): number {
  if (!actions || actions.length === 0) return 0;

  let total = 0;
  for (const action of actions) {
    if (!LEAD_ACTION_TYPES.has(action.action_type)) continue;
    const value = Number(action.value);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}

/**
 * Loga action_types fora da whitelist para permitir ajustá-la com dados reais
 * (ver LEAD_ACTION_TYPES). Não lança erro — é só telemetria.
 */
export function logUnrecognizedActionTypes(
  actions: FacebookInsightAction[] | undefined,
  context: { companyId: string; campaignId: string },
): void {
  if (!actions) return;
  const unrecognized = actions
    .map((a) => a.action_type)
    .filter((type) => !LEAD_ACTION_TYPES.has(type));
  if (unrecognized.length === 0) return;

  logger.info("syncFacebookAdsInsights: action_types não reconhecidos", {
    ...context,
    unrecognized,
  });
}
