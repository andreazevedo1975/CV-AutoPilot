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
}

export interface CV {
  id: string;
  name: string;
  content: string;
}

export interface GenerationHistoryItem {
  id: string;
  type: 'Otimização de Currículo' | 'Carta de Apresentação';
  inputCv: string;
  inputJobDescription: string;
  output: string;
  timestamp: string;
}

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