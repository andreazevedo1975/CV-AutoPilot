export enum ApplicationStatus {
  Aplicou = 'Candidatou-se',
  Visualizado = 'Visualizado',
  Entrevistando = 'Em Entrevista',
  Oferta = 'Oferta Recebida',
  Rejeitado = 'Rejeitado',
  Ignorado = 'Ignorado (Ghosting)',
}

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  dateApplied: string;
  jobUrl?: string;
  status: ApplicationStatus;
  phone?: string;
  email?: string;
  reminderDate?: string;
  notes?: string;
}

export interface CV {
  id:string;
  name: string;
  content: string;
  yearsOfExperience?: number;
  portfolioLinks?: string[];
}

export interface GenerationHistoryItem {
  id: string;
  type: 'Otimização de Currículo' | 'Carta de Apresentação';
  inputCv: string;
  inputJobDescription: string;
  output: string;
  timestamp: string;
}

export interface LeadHistoryItem {
  id: string;
  type: 'Busca de Leads';
  searchTerm: string;
  location: string;
  leads: Lead[];
  timestamp: string;
}

export type HistoryItem = GenerationHistoryItem | LeadHistoryItem;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

export interface Lead {
  companyName: string;
  contactInfo: string;
  notes: string;
}

export interface CVLayout {
    id: string;
    name: string;
    description: string;
    keyFeatures: string[];
    previewContent: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  body: string;
}

export type Theme = 'light' | 'dark';