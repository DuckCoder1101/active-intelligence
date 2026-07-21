import type { ScriptGuideBlock } from "./guide.document";

export interface GuideDTO {
  guideId: string;
  sequence: number;
  name: string;
  label?: string;
  driveUrl?: string;
  socialUrl?: string;
  intentTags: string[];
  platformTags: string[];
  formatTags: string[];
  scriptPrompt: string;
  scriptGuide: ScriptGuideBlock[];
  assignedCompanyIds: string[];
  createdAt: number;
  updatedAt: number;
}

// Subconjunto seguro para exibição fora do admin (Portal do Cliente e link
// público): sem assignedCompanyIds (lista interna de clientes) nem
// scriptPrompt (ferramenta interna de criação).
export interface GuideContentDTO {
  guideId: string;
  name: string;
  driveUrl?: string;
  socialUrl?: string;
  intentTags: string[];
  platformTags: string[];
  formatTags: string[];
  scriptGuide: ScriptGuideBlock[];
}

export interface SaveGuideDTO {
  guideId?: string;
  // Rótulo opcional digitado pelo usuário. O nome final e exibido
  // (GuideDTO.name) é sempre gerado pelo backend: "G-001" ou, com rótulo,
  // "G-001-MeuGuia".
  name?: string;
  driveUrl?: string;
  socialUrl?: string;
  intentTags?: string[];
  platformTags?: string[];
  formatTags?: string[];
  scriptPrompt?: string;
  scriptGuide?: ScriptGuideBlock[];
  assignedCompanyIds?: string[];
}
