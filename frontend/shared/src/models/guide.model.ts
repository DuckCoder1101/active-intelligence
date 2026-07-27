export interface ScriptGuideBlock {
  id: string;
  title: string;
  content: string;
}

export interface Guide {
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

// Subconjunto de leitura usado fora do admin: Portal do Cliente e link
// público. Sem assignedCompanyIds nem scriptPrompt.
export interface GuideContent {
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
  // Rótulo opcional digitado pelo usuário. O nome final (Guide.name) é
  // sempre gerado pelo backend: "G-001" ou, com rótulo, "G-001-MeuGuia".
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
