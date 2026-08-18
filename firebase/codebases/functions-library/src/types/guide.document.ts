import { Timestamp } from "firebase-admin/firestore";

export interface ScriptGuideBlock {
  id: string;
  title: string;
  content: string;
}

export interface GuideDocument {
  sequence: number;
  name: string;
  // Rótulo bruto digitado pelo usuário, usado para recompor `name` quando o
  // guia é editado (ex: name = "G-002-MeuGuia", label = "MeuGuia").
  label?: string;
  driveUrl?: string;
  socialUrl?: string;
  intentTags: string[];
  // Plataforma e formato de gravação, unificados num único campo de tags livres.
  platformTags: string[];
  scriptPrompt: string;
  scriptGuide: ScriptGuideBlock[];
  assignedCompanyIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
