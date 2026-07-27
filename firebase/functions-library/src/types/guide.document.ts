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
  platformTags: string[];
  formatTags: string[];
  scriptPrompt: string;
  scriptGuide: ScriptGuideBlock[];
  assignedCompanyIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
