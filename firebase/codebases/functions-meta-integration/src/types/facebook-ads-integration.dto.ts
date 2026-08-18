import type { FacebookPageIntegration } from "functions-shared";

/** Formato devolvido pelas callables — timestamps já convertidos para epoch ms. */
export interface FacebookAdsIntegrationDTO {
  connected: boolean;
  fbUserId: string;
  fbUserName: string;
  pages: FacebookPageIntegration[];
  connectedBy: string;
  connectedAt: number;
  updatedAt: number;
}
