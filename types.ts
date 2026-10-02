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
  salaryExpectation?: string;
  location?: string;
}

export interface CV {
  id:string;
  name: string;
  content: string;
  yearsOfExperience?: number;
  portfolioLinks?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  skills?: string[];
}

export interface ExtractedSkillsResult {
  technicalSkills: string[];
  softSkills: string[];
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
  timestamp?: string;
}

export interface Lead {
  companyName: string;
  contactInfo: string;
  notes: string;
}

export type RHPlatformId = 'catho' | 'empregos' | 'linkedin' | 'infojobs' | 'gupy' | 'vagas';

export interface RHPlatformAccount {
  id: RHPlatformId;
  name: string;
  domain: string;
  badgeColor: string;
  accentBg: string;
  loginUrl: string;
  searchJobUrlTemplate: string;
  searchCandidateUrlTemplate: string;
  usernameOrEmail: string;
  password: string; // Armazenado com segurança no localStorage do navegador do usuário
  accountType: 'Candidato' | 'Recrutador / Empresa' | 'Assinante VIP / Premium';
  hasCredentials: boolean;
  enabledForSearch: boolean;
  lastVerified?: string;
  authNotes?: string;
}

export type CandidateStatus = 'Novo' | 'Contatado' | 'Em Análise' | 'Entrevista' | 'Aprovado' | 'Banco de Reserva';

export interface CandidateProfile {
  id: string;
  name: string;
  headline: string;
  location: {
    neighborhood?: string;
    city: string;
    state: string; // UF (ex: SP, RJ, MG)
  };
  summary: string;
  skills: string[];
  experienceHighlights?: string[];
  education?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    portfolio?: string;
    otherUrls?: string[];
  };
  sourceUrls: { title: string; uri: string }[];
  notes?: string;
  status: CandidateStatus;
  addedAt: string;
  fullCvText?: string;
  matchScore?: number;
  seniority?: string;
  portalSource?: string; // 'Catho' | 'Empregos.com.br' | 'LinkedIn' | 'InfoJobs' | 'Gupy' | 'Vagas.com' | 'Web 360°'
  requiresAuth?: boolean;
  portalProfileId?: string;
  authenticatedDirectUrl?: string;
}

export type WorkModel = 'Presencial' | 'Híbrido' | 'Home Office' | 'Todos';

export interface LocalJob {
  id: string;
  title: string;
  company: string;
  location: {
    neighborhood?: string;
    city: string;
    state: string; // UF
  };
  workModel: string;
  salaryOrRange?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  sourceUrls: { title: string; uri: string }[];
  applyUrlOrContact: string;
  notes?: string;
  postedDate?: string;
  portalSource?: string; // 'Catho' | 'Empregos.com.br' | 'LinkedIn' | 'InfoJobs' | 'Gupy' | 'Vagas.com' | 'Web 360°'
  requiresAuth?: boolean;
  portalJobId?: string;
  authenticatedDirectUrl?: string;
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

export interface InterviewEvaluation {
  score: number; // 0-100
  executiveVerdict: string; // Ex: "Aprovado com Louvor", "Forte Potencial", "Necessita Calibrar Métricas"
  starAnalysis: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  strengths: string[];
  improvements: string[];
  cLevelRewrite: string; // How Dra. Valéria would answer
  nextQuestion?: string;
  overallTip: string;
}

export interface InterviewTurn {
  id: string;
  questionNumber: number;
  question: string;
  competency: string;
  userAnswer: string;
  durationSeconds?: number;
  evaluation?: InterviewEvaluation;
  timestamp: string;
}

export interface InterviewConfig {
  targetRole: string;
  seniority: string;
  focusArea: string;
  companyTarget?: string;
}

export interface InterviewSessionRecord {
  id: string;
  date: string;
  targetRole: string;
  seniority: string;
  focusArea: string;
  companyTarget?: string;
  averageScore: number;
  verdictGrade: string;
  turns: InterviewTurn[];
  competenciesTested: string[];
  durationMinutes?: number;
  evolutionNotes?: string;
}

// Types for Senior Job Understanding, CV Tailoring and ATS Optimization
export interface JobKeywordItem {
  keyword: string;
  relevance: 'Crítica' | 'Alta' | 'Média';
  category: 'Hard Skill' | 'Ferramenta / Stack' | 'Metodologia' | 'Liderança & Negócios';
  inOriginalCv: boolean;
  integrated: boolean;
}

export interface JobAnalysisResult {
  targetRole: string;
  companyName?: string;
  seniorityLevel: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista / Lead' | 'C-Level / Diretoria';
  coreMission: string;
  topKeywords: JobKeywordItem[];
  mandatoryRequirements: string[];
  desiredCompetencies: string[];
}

export interface CandidateAuditResult {
  detectedSpecialization: string;
  yearsOfExperienceEstimated: number;
  initialMatchScore: number;
  projectedMatchScore: number;
  identifiedStrengths: string[];
  criticalWeaknessesFixed: string[];
  missingKeywordsIntegrated: string[];
}

export interface TailoredCVExperience {
  role: string;
  company: string;
  period: string;
  location?: string;
  scopeDescription?: string;
  achievementsXYZ: string[];
}

export interface TailoredCVModel {
  layoutId: 'executive-c-level' | 'tech-ats-master' | 'product-growth' | 'hybrid-specialist' | 'clean-swiss';
  layoutName: string;
  layoutRationale: string;
  designPillars: string[];
  header: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  executiveSummary: string;
  competencyMatrix: {
    hardSkills: string[];
    toolsAndTech: string[];
    methodologies: string[];
    leadershipAndSoft: string[];
  };
  experiences: TailoredCVExperience[];
  education: Array<{ course: string; institution: string; year?: string }>;
  certifications: string[];
  projects: Array<{ title: string; description: string; link?: string }>;
  fullText: string;
  recruiterTips: string[];
}

export interface TailoredCVOutput {
  jobAnalysis: JobAnalysisResult;
  candidateAudit: CandidateAuditResult;
  tailoredCV: TailoredCVModel;
}

// Types for Regional Job Heatmap in LeadFinder
export interface RegionHeatPoint {
  state: string;
  regionName: string;
  jobVolume: number;
  heatIntensity: number; // 0-100
  averageSalary: string;
  demandStatus: '🔥 Demanda Máxima' | '⚡ Em Alta Expansão' | '📍 Sólido & Estável';
  workModelDistribution: { remote: number; hybrid: number; onsite: number };
  topHiringHubs: string[];
}

export type Theme = 'light' | 'dark';

// Types for Job Match Analyzer (Analista de Vagas)
export interface JobAlignmentPillars {
  hardSkillsScore: number;       // 0-100
  seniorityScore: number;        // 0-100
  educationScore: number;        // 0-100
  businessImpactScore: number;   // 0-100
}

export interface JobAlignmentKeyword {
  keyword: string;
  category: 'Hard Skill' | 'Ferramenta / Stack' | 'Metodologia' | 'Soft Skill / Liderança';
  importance: 'Crítica' | 'Alta' | 'Desejável';
  status: 'matched' | 'missing' | 'partial';
  contextSnippet?: string;
  recommendation?: string;
}

export interface JobAdjustmentSuggestion {
  section: 'Resumo Profissional' | 'Experiência Profissional' | 'Competências' | 'Formação & Certificações';
  priority: 'Crítica' | 'Alta' | 'Média';
  diagnosis: string;
  actionableStep: string;
  beforeExample?: string;
  afterExample?: string; // Reescrito com fórmula XYZ
}

export interface JobMatchAnalysis {
  id: string;
  timestamp: string;
  jobTitle: string;
  companyName?: string;
  seniorityRequired: string;
  overallMatchScore: number;     // 0-100%
  executiveVerdict: string;      // ex: "Alta Compatibilidade ATS (88%)"
  verdictSummary: string;
  alignmentPillars: JobAlignmentPillars;
  matchedStrengths: string[];
  criticalGaps: string[];
  keywordsAnalysis: JobAlignmentKeyword[];
  adjustmentSuggestions: JobAdjustmentSuggestion[];
  interviewAnticipatedQuestions: {
    question: string;
    whyItWillBeAsked: string;
    suggestedAnswerStrategy: string;
  }[];
  quickWins: string[];
  rawJobDescriptionSnippet?: string;
  cvNameAnalyzed?: string;
}

// Types for CV Contact Extractor (Extrator de Contatos & Dossiê de Candidatura)
export interface CVContactAddress {
  fullAddress: string;
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
}

export interface ExtractedCVContact {
  id: string;
  extractedAt: string;
  sourceType: 'file_upload' | 'text_paste' | 'web_search' | 'database';
  sourceName: string;
  fullName: string;
  photoUrl?: string; // Foto do candidato extraída do currículo (base64 Data URL ou link)
  hasPhoto?: boolean; // Indica se o currículo original continha foto
  photoDetectedSource?: 'pdf_render' | 'docx_embedded' | 'image_upload' | 'user_manual' | 'online_avatar';
  email: string;
  phone: string;
  targetRole: string; // Vaga no qual quer se candidatar / cargo pretendido
  address: CVContactAddress;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  seniority?: string;
  salaryExpectation?: string;
  workModel?: 'Remoto' | 'Híbrido' | 'Presencial' | 'Indiferente';
  professionalSummary?: string;
  keySkills?: string[];
  education?: string;
  experienceYears?: number | string;
  recentCompany?: string;
  extractionConfidence?: number; // 0-100%
  rawCvSnippet?: string;
  notes?: string;
  tags?: string[];
}

export type UserRole = 'admin' | 'trial' | 'guest';

export interface ExternalNetworkInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  isExternal: boolean;
  detectedAt: string;
}

export interface NetworkTrialRecord {
  networkId: string; // IP ou hash da rede externa
  ip: string;
  firstActivatedAt: string;
  expiresAt: string;
  lastLoginAt: string;
  city?: string;
  country?: string;
  isp?: string;
  accessCount: number;
}

export interface TestLoginAccount {
  id: number;
  email: string;
  name: string;
  defaultPassword: string;
  aliases: string[];
}

export interface TestLoginRecord {
  id: number;
  email: string;
  firstActivatedAt?: string;
  expiresAt?: string;
  lastLoginAt?: string;
  lastIp?: string;
  expiredIp?: string; // O IP com o qual o prazo expirou
  renewalCount: number;
  lastRenewedAt?: string;
  accessCount: number;
  ipHistory: string[];
}

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  isUnlimited: boolean;
  trialExpiresAt?: string; // ISO String se for temporário
  trialActivatedAt?: string;
  networkIp?: string;
  networkLocation?: string;
  createdAt: string;
  renewalCount?: number;
  isRenewed?: boolean;
  testAccountId?: number;
}

export interface BatchQueueItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progressMessage?: string;
  extractedContact?: ExtractedCVContact;
  error?: string;
  processedAt?: string;
}

export type JobFormAutofillPortal = 
  | 'universal'
  | 'gupy'
  | 'linkedin'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'vagas_catho'
  | 'infojobs';

export interface JobFormField {
  id: string;
  category: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'screening' | 'custom';
  label: string;
  value: string;
  fieldType: 'text' | 'textarea' | 'select' | 'number';
  suggestedAlternatives?: string[];
  platformKey?: string;
  tips?: string;
  confidenceScore?: number;
  isCustom?: boolean;
}

export interface JobFormAutofillResult {
  jobTitle: string;
  companyName: string;
  targetPortal: JobFormAutofillPortal;
  atsCompatibilityScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  fields: JobFormField[];
  browserFillScript: string;
  quickAnswersSummary: string;
  generatedAt: string;
}

export interface SalaryPercentiles {
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export interface SenioritySalaryTier {
  seniority: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista / Lead' | 'Diretoria / C-Level';
  cltMin: number;
  cltMax: number;
  cltAvg: number;
  pjMin?: number;
  pjMax?: number;
  pjAvg?: number;
}

export interface SalaryBenchmarkResult {
  id: string;
  jobTitle: string;
  location: string;
  companyName?: string;
  currency: string; // 'BRL' | 'USD' | 'EUR'
  targetSeniority: string;
  marketAverageClt: number;
  marketAveragePj?: number;
  percentiles: SalaryPercentiles;
  seniorityTiers: SenioritySalaryTier[];
  candidateExpectedSalary?: number;
  marketComparison?: {
    status: 'above' | 'aligned' | 'below';
    percentageDiff: number;
    verdict: string;
  };
  marketTrendsSummary: string;
  commonBenefits: string[];
  negotiationTips: string[];
  sources: { title: string; uri: string }[];
  analyzedAt: string;
}

export interface StrategyTacticalAdjustment {
  id: string;
  category: 'cv' | 'targeting' | 'positioning' | 'networking';
  impact: 'critical' | 'high' | 'medium';
  title: string;
  problemIdentified: string;
  solutionAction: string;
  exampleOrTemplate?: string;
}

export interface RejectionPatternInsight {
  patternType: string;
  severity: 'high' | 'medium' | 'low';
  observation: string;
  affectedCompaniesSample?: string[];
  suggestedCorrection: string;
}

export interface CareerStrategyAnalysisResult {
  id: string;
  generatedAt: string;
  overallDiagnosis: {
    headline: string;
    stageVerdict: string;
    funnelEfficiencyScore: number; // 0 - 100
    summaryText: string;
    rejectionVelocityTrend: 'improving' | 'stable' | 'deteriorating';
    primaryBottleneck: string;
  };
  rejectionPatterns: RejectionPatternInsight[];
  cvTacticalAdjustments: StrategyTacticalAdjustment[];
  targetingTacticalAdjustments: StrategyTacticalAdjustment[];
  actionPlan30Days: {
    week: string;
    focus: string;
    tasks: string[];
  }[];
  atsOptimizationTips: string[];
}

export interface OfflineDocument {
  id: string;
  type: 'cv' | 'cover_letter' | 'history_doc';
  title: string;
  content: string;
  sourceId: string;
  savedAt: string;
  sizeBytes: number;
  metadata?: {
    yearsOfExperience?: number;
    portfolioLinks?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    analysis?: string;
    inputJobDescription?: string;
    targetRole?: string;
    companyName?: string;
  };
}

export type OfflineMutationType = 
  | 'APPLICATION_STATUS_UPDATE'
  | 'APPLICATION_CREATE'
  | 'APPLICATION_UPDATE'
  | 'CV_CREATE'
  | 'CV_UPDATE'
  | 'CV_DELETE';

export interface OfflineMutation {
  id: string;
  type: OfflineMutationType;
  entityId: string;
  payload: any;
  timestamp: string;
  description: string;
  synced: boolean;
  syncedAt?: string;
  retryCount?: number;
}

export interface SyncSummary {
  syncedCount: number;
  failedCount: number;
  items: OfflineMutation[];
  timestamp: string;
}

// ==========================================
// Tipos para o Módulo de Análise SWOT Pessoal
// ==========================================

export type SWOTCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

export interface PersonalSWOTItem {
  id: string;
  category: SWOTCategory;
  title: string;
  description: string;
  impactLevel: 'critical' | 'high' | 'medium';
  evidenceSource: string; // Ex: "Detectado em 8 candidaturas com status 'Rejeitado'", "6 anos de experiência validados no CV", "Conversão de 25% em entrevistas"
  tags: string[];
  strategicAction: string; // Ponto de melhoria estratégica sugerido
}

export type CrossSWOTQuadrant = 'SO' | 'WO' | 'ST' | 'WT';

export interface CrossSWOTStrategy {
  id: string;
  quadrant: CrossSWOTQuadrant;
  quadrantName: string; // Ex: "Estratégia SO (Maxi-Maxi): Alavancar Forças em Oportunidades"
  title: string;
  description: string;
  tacticalSteps: string[];
  priority: 'Alta Prioridade (7 Dias)' | 'Médio Prazo (30 Dias)' | 'Longo Prazo (90 Dias)';
  expectedROI: string;
}

export interface PersonalSWOTMetrics {
  overallHealthScore: number; // 0 - 100
  competitivenessIndex: number; // 0 - 100
  marketOpportunityCapture: number; // 0 - 100
  atsVulnerabilityScore: number; // 0 - 100
  totalApplicationsAnalyzed: number;
  totalCVsAnalyzed: number;
  conversionRate: number; // % (Em Entrevista + Oferta) / Total
  ghostingRate: number; // % Ignorado / Total
  rejectionRate: number; // % Rejeitado / Total
  primaryStrengthArea: string;
  criticalBottleneckArea: string;
}

export interface PersonalSWOTActionPlanTask {
  id: string;
  text: string;
  completed: boolean;
  impact: 'crítica' | 'alta' | 'média';
  category: 'cv' | 'candidaturas' | 'habilidade' | 'networking' | 'entrevista';
}

export interface PersonalSWOTActionPlanPhase {
  timeframe: string; // Ex: "7 Dias (Ação Imediata: CV & ATS)"
  focus: string;
  tasks: PersonalSWOTActionPlanTask[];
}

export interface PersonalSWOTAnalysisResult {
  id: string;
  generatedAt: string;
  candidateName: string;
  targetRole: string;
  metrics: PersonalSWOTMetrics;
  strengths: PersonalSWOTItem[];
  weaknesses: PersonalSWOTItem[];
  opportunities: PersonalSWOTItem[];
  threats: PersonalSWOTItem[];
  crossStrategies: CrossSWOTStrategy[];
  actionPlan: PersonalSWOTActionPlanPhase[];
  atsRecommendations: string[];
  pitchPositioningStatement: string;
  executiveSummary: string;
}

export interface PersonalSWOTInput {
  candidateName?: string;
  targetRole?: string;
  applications: Application[];
  cvs: CV[];
  activeCvId?: string;
  generationHistory?: GenerationHistoryItem[];
  interviewSessions?: InterviewSessionRecord[];
  focusNotes?: string;
}

// ==========================================
// Tipos para o Disparador Automático de Currículo
// ==========================================

export type AutoDispatcherMode = 'email' | 'form';

export type DispatchEmailTone = 'executive' | 'technical' | 'consultative' | 'creative';

export interface DispatchRegionTarget {
  state: string; // UF (ex: 'SP', 'RJ', 'MG', 'Nacional / Remoto')
  city: string; // Ex: 'São Paulo', 'Campinas', 'Remoto / Home Office'
  workModel: 'Home Office / Remoto' | 'Híbrido' | 'Presencial' | 'Qualquer Modelo';
}

export interface EmailDispatchPackage {
  id: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  highlightedSkills: string[];
  tone: DispatchEmailTone;
  candidateName: string;
  targetRole: string;
  targetCompany: string;
  region: DispatchRegionTarget;
  mailtoUrl: string;
  gmailWebUrl: string;
  outlookWebUrl: string;
  generatedAt: string;
}

export interface FormDispatchField {
  id: string;
  label: string;
  value: string;
  category: 'personal' | 'summary' | 'experience' | 'skills' | 'location' | 'screening';
  tips?: string;
}

export interface FormDispatchPackage {
  id: string;
  portal: JobFormAutofillPortal;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  region: DispatchRegionTarget;
  fields: FormDispatchField[];
  screeningAnswers: {
    question: string;
    answer: string;
    matchContext: string;
  }[];
  browserAutofillScript: string;
  atsMatchScore: number;
  generatedAt: string;
}

export interface DispatchHistoryRecord {
  id: string;
  mode: AutoDispatcherMode;
  targetRole: string;
  companyName: string;
  destination: string; // e-mail ou portal
  region: string;
  date: string;
  status: 'Disparado' | 'Em Análise' | 'Entrevista' | 'Oferta';
  cvName?: string;
  notes?: string;
  detailsSnippet?: string;
}

export interface SweptJobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  city: string;
  state: string;
  workModel: string;
  portal: string;
  salaryOrRange?: string;
  descriptionSnippet: string;
  requirements: string[];
  applyUrl: string;
  contactEmail?: string;
  recruiterName?: string;
  destinationType: 'email' | 'form';
  atsMatchScore?: number;
  postedDate?: string;
}




