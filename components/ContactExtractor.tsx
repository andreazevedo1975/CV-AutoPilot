// components/ContactExtractor.tsx - Extrator de Contatos & Dossiê de Candidatura de CV
import React, { useState, useContext, useMemo, useRef } from 'react';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  ExtractedCVContact, 
  Application, 
  ApplicationStatus, 
  CV, 
  CandidateProfile,
  BatchQueueItem 
} from '../types';
import { 
  extractCVContactInfo, 
  extractCVContactFromImage, 
  searchCandidatesOnline 
} from '../services/geminiService';
import { exportContactDossierPdf, downloadVCard } from '../services/contactPdfService';
import { 
  exportContactsToExcel, 
  exportSingleContactToExcel, 
  importContactsFromExcel 
} from '../services/contactExcelService';
import { 
  buildWhatsAppUrl, 
  buildMailtoUrl,
  extractAllPhonesFromText,
  extractPrimaryExactPhone,
  formatExactPhone,
  getWhatsAppCleanDigits,
  resolveCandidateContact,
  extractImagesFromDocx,
  cropImageFromBoundingBox
} from '../utils/contactUtils';
import { INITIAL_CANDIDATES_360 } from '../constants/initialTalents';
import { BRAZIL_STATES, getCitiesByState, getNeighborhoodsByCity } from '../constants/brazilLocations';
import { SearchableSelectDropdown } from './SearchableSelectDropdown';
import {
  ContactIcon,
  UserCheckIcon,
  Phone,
  Mail,
  MapPinIcon,
  SearchIcon,
  Upload,
  Download,
  Copy,
  ExternalLinkIcon,
  Briefcase,
  Sparkles,
  Check,
  Trash,
  EyeIcon,
  DatabaseIcon,
  RefreshCw,
  BuildingIcon,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Bot,
  FileSpreadsheet,
  TableIcon,
  PlusIcon,
  Pencil,
  CameraIcon,
  ImageIcon,
  Clock,
  Layers,
  Play,
  X
} from './icons';

declare const mammoth: any;
declare const pdfjsLib: any;

// Pre-seeded initial extracted contacts
const INITIAL_EXTRACTED_CONTACTS: ExtractedCVContact[] = [
  {
    id: 'contact-demo-1',
    extractedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sourceType: 'file_upload',
    sourceName: 'Curriculo_Lucas_Mendonca_Senior.pdf',
    fullName: 'Lucas Mendonça Arantes',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces&auto=format&q=80',
    hasPhoto: true,
    photoDetectedSource: 'pdf_render',
    email: 'lucas.arantes.dev@gmail.com',
    phone: '(11) 98744-1290',
    targetRole: 'Engenheiro de Software Frontend Sênior',
    address: {
      fullAddress: 'Rua Fradique Coutinho, 1280 - Pinheiros, São Paulo - SP, CEP: 05416-001, Brasil',
      street: 'Rua Fradique Coutinho, 1280',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '05416-001',
      country: 'Brasil'
    },
    linkedinUrl: 'https://linkedin.com/in/lucas-arantes-frontend',
    portfolioUrl: 'https://lucasarantes.tech',
    githubUrl: 'https://github.com/lucas-arantes',
    seniority: 'Sênior',
    salaryExpectation: 'R$ 17.500 CLT / R$ 110/hora PJ',
    workModel: 'Híbrido',
    professionalSummary: 'Engenheiro de Software com mais de 7 anos de experiência focado na construção de arquiteturas web resilientes e de alta performance. Liderou a refatoração do core checkout de fintech líder em SP, reduzindo o LCP em 42%.',
    keySkills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest & RTL', 'Design Systems', 'CI/CD'],
    education: 'Bacharelado em Engenharia de Computação - USP (Poli-USP)',
    experienceYears: '7+ anos',
    recentCompany: 'Vanguarda Pagamentos (Fintech)',
    extractionConfidence: 99,
    notes: 'Candidato com perfil de liderança técnica comprovada e sólida base matemática.'
  },
  {
    id: 'contact-demo-2',
    extractedAt: new Date(Date.now() - 86400000).toISOString(),
    sourceType: 'web_search',
    sourceName: 'Catho & LinkedIn Prospecção',
    fullName: 'Beatriz Vasconcelos Ribeiro',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces&auto=format&q=80',
    hasPhoto: true,
    photoDetectedSource: 'online_avatar',
    email: 'beatriz.v.ribeiro@outlook.com',
    phone: '(11) 97123-8890',
    targetRole: 'Gerente Comercial & Key Accounts B2B',
    address: {
      fullAddress: 'Av. Brigadeiro Faria Lima, 3477 - Itaim Bibi, São Paulo - SP, CEP: 04538-133, Brasil',
      street: 'Av. Brigadeiro Faria Lima, 3477',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '04538-133',
      country: 'Brasil'
    },
    linkedinUrl: 'https://linkedin.com/in/beatriz-vasconcelos-sales',
    seniority: 'Coordenação / Gerência',
    salaryExpectation: 'R$ 16.000 Fixo + Comissão B2B',
    workModel: 'Híbrido',
    professionalSummary: 'Líder comercial com 8+ anos de atuação no fechamento de contas enterprise em SaaS e serviços corporativos. Atingiu 142% da meta anual em 2024 na carteira de Grandes Contas.',
    keySkills: ['Vendas Consultivas B2B', 'Negociação C-Level', 'HubSpot & Salesforce', 'Gestão de Pipeline', 'Liderança de SDRs'],
    education: 'Administração de Empresas - FGV-EAESP',
    experienceYears: '8 anos',
    recentCompany: 'OmniCloud Enterprise',
    extractionConfidence: 97
  }
];

// Sample resumes for instant testing
const SAMPLE_RESUMES = [
  {
    label: 'Engenheiro de Software Sênior (São Paulo - SP)',
    text: `CAMILA ROCHA FERREIRA
São Paulo - SP | camila.rocha.tech@gmail.com | (11) 98455-2231
Endereço: Alameda Jaú, 1420, Apto 81 - Jardim Paulista, São Paulo - SP, CEP: 01420-002
LinkedIn: linkedin.com/in/camila-rocha-tech | GitHub: github.com/camila-rocha

OBJETIVO PROFISSIONAL: Engenheira de Software Sênior / Tech Lead Backend

RESUMO PROFISSIONAL
Engenheira de software com 9 anos de trajetória no desenvolvimento de sistemas distribuídos de alta escala. Forte vivência com microsserviços em Go, Node.js e Java, banco de dados PostgreSQL e mensageria Kafka em nuvem AWS.

EXPERIÊNCIA PROFISSIONAL
Tech Lead Backend | Stone Pagamentos (2022 - Atual)
- Conduzi squad de 7 engenheiros no redesenho do motor de liquidação financeira.
- Reduzi o tempo de processamento em lote de 45 para 12 minutos via concorrência em Go.

Engenheira Backend Sênior | Mercado Livre (2019 - 2022)
- Arquitetei pipelines de eventos Kafka processando mais de 15.000 msgs/segundo.

FORMAÇÃO ACADÊMICA
Bacharelado em Ciências da Computação - UNICAMP (2014 - 2018)
Pretensão Salarial: R$ 18.000 CLT | Modelo: Remoto ou Híbrido`
  },
  {
    label: 'Diretor Financeiro & CFO (Rio de Janeiro - RJ)',
    text: `ROBERTO ALVES GUIMARÃES
Rio de Janeiro - RJ | roberto.guimaraes.cfo@gmail.com | (21) 99876-1120
Endereço: Rua Prudente de Morais, 850, Cobertura - Ipanema, Rio de Janeiro - RJ, CEP: 22420-042
LinkedIn: linkedin.com/in/roberto-guimaraes-finance

OBJETIVO: Diretor Financeiro (CFO) / Head de Controladoria

SÍNTESE EXECUTIVA
Executivo de Finanças com 16 anos de experiência consolidada em governança financeira, M&A, reestruturação de capital de giro e IPO. Gestão de P&L de até R$ 850 milhões anuais.

EXPERIÊNCIA PROFISSIONAL
Diretor Financeiro & RI | Grupo Logística Brasil (2020 - Atual)
- Liderou captação de debêntures de R$ 180M com taxa atrativa.
- Otimizou o EBITDA em 320 bps através de orçamento base zero.

FORMAÇÃO & CERTIFICAÇÕES
Graduação em Economia - IBMEC-RJ | MBA Executivo em Finanças - COPPEAD-UFRJ | CFA Charterholder
Pretensão Salarial: R$ 35.000 + Bônus Executivo | Modelo: Híbrido / Presencial`
  },
  {
    label: 'Analista de RH & Business Partner (Belo Horizonte - MG)',
    text: `JULIANA COSTA NOGUEIRA
Belo Horizonte - MG | juliana.nogueira.rh@outlook.com | (31) 98765-4433
Endereço: Rua dos Inconfidentes, 920 - Savassi, Belo Horizonte - MG, CEP: 30140-120
LinkedIn: linkedin.com/in/juliana-nogueira-rh

VAGA ALVO: HR Business Partner Pleno / Especialista em Atração de Talentos

RESUMO
Profissional de Recursos Humanos com 5 anos de atuação com foco em Business Partnering, recrutamento estratégico tech e gestão de cultura corporativa. Amplo domínio de plataformas ATS (Gupy, Greenhouse, Lever).

COMPETÊNCIAS
Recrutamento & Seleção Tech, People Analytics, Indicadores de RH (Turnover/Time to hire), Avaliação de Desempenho 360°, Gupy.

Pretensão Salarial: R$ 8.500 CLT | Modelo: Híbrido`
  },
  {
    label: 'Arquiteto Cloud & DevOps Sênior (Curitiba - PR)',
    text: `MARCUS VINICIUS SILVEIRA
Curitiba - PR | marcus.silveira.cloud@gmail.com | (41) 99123-5566
Endereço: Rua Padre Anchieta, 2050 - Bigorrilho, Curitiba - PR, CEP: 80730-000
LinkedIn: linkedin.com/in/marcus-silveira-devops

OBJETIVO: Arquiteto Cloud & Especialista DevOps / SRE

RESUMO
Profissional especializado em infraestrutura cloud (AWS e Azure), Kubernetes, Terraform e automação de esteiras CI/CD com 8 anos de experiência. Foco em alta disponibilidade, FinOps e segurança DevSecOps.

EXPERIÊNCIA
Arquiteto Cloud Sênior | TechSolutions Brasil (2021 - Atual)
- Migração de infraestrutura legada para Kubernetes (EKS), reduzindo custos em 35%.
- Implementação de esteiras com GitLab CI e ArgoCD com deploy contínuo seguro.

COMPETÊNCIAS
AWS Certified Solutions Architect, Kubernetes (CKA), Terraform, Docker, Python, Bash, Prometheus, Grafana.

Pretensão Salarial: R$ 20.000 CLT | Modelo: Remoto`
  },
  {
    label: 'Médica do Trabalho & Saúde Ocupacional (Porto Alegre - RS)',
    text: `DRA. AMANDA ALBUQUERQUE PRADO
Porto Alegre - RS | amanda.prado.med@gmail.com | (51) 98112-9988
Endereço: Av. Nilo Peçanha, 2400, Conj 502 - Boa Vista, Porto Alegre - RS, CEP: 91330-002
LinkedIn: linkedin.com/in/dra-amanda-prado-medtrabalho

VAGA ALVO: Coordenadora Médica de Saúde Ocupacional / Médica do Trabalho

RESUMO EXECUTIVO
Médica especialista em Medicina do Trabalho (RQE 34210) com 10 anos de coordenação de programas de saúde corporativa (PCMSO, PGR, eSocial Saúde) para indústrias e grandes empresas multinacionais.

EXPERIÊNCIA
Coordenadora de Saúde Corporativa | Gerdau Brasil (2018 - Atual)
- Gestão de equipe multidisciplinar com 12 profissionais (médicos, enfermeiros e ergonomistas).
- Redução de absenteísmo em 28% através de programas preventivos de ergonomia e saúde mental.

FORMAÇÃO
Graduação em Medicina - UFRGS | Residência Médica em Medicina do Trabalho - HCPA

Pretensão Salarial: R$ 22.000 CLT ou PJ | Modelo: Híbrido / Presencial`
  },
  {
    label: 'Gerente de Operações Logísticas & Supply Chain (Salvador - BA)',
    text: `FELIPE TOLEDO SANTANA
Salvador - BA | felipe.santana.log@hotmail.com | (71) 99654-7722
Endereço: Av. Tancredo Neves, 1632, Torre Sul - Caminho das Árvores, Salvador - BA, CEP: 41820-020
LinkedIn: linkedin.com/in/felipe-santana-supply

OBJETIVO: Gerente de Operações Logísticas / Head de Supply Chain

RESUMO
Executivo de operações e cadeia de suprimentos com 12 anos liderando malhas de distribuição rodoviária e centros de distribuição (CDs) no Nordeste. Especialista em Lean Logistics e WMS.

EXPERIÊNCIA
Gerente Regional de Operações | Ambev Nordeste (2019 - Atual)
- Liderança de CD de 45.000m² com mais de 280 colaboradores diretos e indiretos.
- Atingiu OTIF (On-Time In-Full) de 98.4% com redução no índice de quebras operacionais em 40%.

FORMAÇÃO
Engenharia de Produção - UFBA | MBA em Logística e Supply Chain - FGV

Pretensão Salarial: R$ 17.000 CLT + Benefícios | Modelo: Presencial`
  },
  {
    label: 'Advogada Corporativa & Head de Compliance (Brasília - DF)',
    text: `DANIELLE MEIRELES RAMOS
Brasília - DF | danielle.ramos.juridico@gmail.com | (61) 98234-1100
Endereço: SQS 308 Bloco F, Apto 402 - Asa Sul, Brasília - DF, CEP: 70355-060
LinkedIn: linkedin.com/in/danielle-ramos-compliance

OBJETIVO: Gerente Jurídica / Head de Compliance e Governança (LGPD)

RESUMO
Advogada com 11 anos de sólida prática no contencioso e consultivo estratégico empresarial, contratos internacionais, auditoria e adequação corporativa à LGPD e normas anticorrupção.

EXPERIÊNCIA
Head de Governança e Compliance | Grupo Energia Brasil (2020 - Atual)
- Estruturou o programa de integridade e compliance em conformidade com o FCPA e Lei 12.846/13.
- DPO certificada responsável pela privacidade de dados de mais de 2 milhões de clientes.

FORMAÇÃO & OAB
Direito - UnB (OAB/DF 45.890) | Mestrado em Direito Empresarial e Regulação - IDP

Pretensão Salarial: R$ 21.000 CLT | Modelo: Híbrido`
  },
  {
    label: 'Product Manager Sênior B2B SaaS (Recife - PE)',
    text: `RODRIGO NASCIMENTO LIMA
Recife - PE | rodrigo.lima.pm@gmail.com | (81) 99456-3344
Endereço: Rua do Bom Jesus, 220 - Bairro do Recife (Porto Digital), Recife - PE, CEP: 50030-170
LinkedIn: linkedin.com/in/rodrigo-lima-product

OBJETIVO: Group Product Manager (GPM) / Product Manager Sênior

RESUMO
Gerente de Produto com 7 anos de experiência impulsionando produtos digitais no ecossistema do Porto Digital. Experiência sólida em metodologias ágeis (Scrum, Kanban), discovery contínuo e métricas de crescimento (PLG).

EXPERIÊNCIA
Senior PM | In Loco / Incognia (2021 - Atual)
- Liderou time de 14 pessoas (design, dados e engenharia) focado em soluções antifraude para fintechs.
- Crescimento de 210% no ARR do módulo de autenticação contextual em 18 meses.

FORMAÇÃO
Ciência da Computação - UFPE / CIn | Certificado Product Management - PM3

Pretensão Salarial: R$ 16.500 CLT | Modelo: Remoto`
  },
  {
    label: 'Product Designer Lead & UX/UI (Florianópolis - SC)',
    text: `MARIANA CASTRO VASCONCELLOS
Florianópolis - SC | mariana.castro.ux@gmail.com | (48) 99321-8877
Endereço: Rodovia SC-401, Km 5, Condomínio Alpha - Saco Grande, Florianópolis - SC, CEP: 88032-005
LinkedIn: linkedin.com/in/mariana-castro-design | Portfólio: marianacastro.design

OBJETIVO: Lead Product Designer / Especialista em Design System & UX

RESUMO
Designer de Produto com 8 anos projetando interfaces intuitivas para plataformas enterprise e aplicativos móveis. Especialista em Figma avançado, Design Tokens, pesquisas qualitativas com usuários e acessibilidade WCAG.

EXPERIÊNCIA
Design Lead | RD Station (2020 - Atual)
- Padronizou o Design System em React/Figma com mais de 150 componentes acessíveis.
- Melhorou a taxa de ativação de novos usuários em 34% no primeiro onboarding.

FORMAÇÃO
Design Gráfico e Multimídia - UDESC | Especialização em Interação Humano-Computador - Stanford Online

Pretensão Salarial: R$ 15.000 CLT | Modelo: Remoto`
  },
  {
    label: 'Engenheiro de Dados & Big Data Lead (Campinas - SP)',
    text: `BRUNO HENRIQUE CARVALHO
Campinas - SP | bruno.carvalho.data@gmail.com | (19) 98322-4411
Endereço: Rua Barão de Jaguara, 1150 - Centro, Campinas - SP, CEP: 13015-002
LinkedIn: linkedin.com/in/bruno-carvalho-bigdata

OBJETIVO: Lead Data Engineer / Arquiteto de Dados Modern Data Stack

RESUMO
Engenheiro de dados com 9 anos implementando data lakes, pipelines de streaming e arquiteturas Lakehouse com Databricks, Spark, Snowflake e dbt em nuvem GCP e AWS.

EXPERIÊNCIA
Lead Data Engineer | CI&T (2021 - Atual)
- Construção de Data Lake corporativo processando mais de 5 Terabytes de dados diários.
- Redução de tempo de geração de relatórios de BI em 80% através de modelagem dimensional com dbt.

FORMAÇÃO
Engenharia da Computação - UNICAMP | Mestrado em Ciência da Computação - USP

Pretensão Salarial: R$ 19.500 CLT | Modelo: Híbrido / Remoto`
  }
];

export const ContactExtractor: React.FC = () => {
  const { colors, theme } = useContext(ThemeContext);

  // Active Mode: 'import' | 'batch' | 'search' | 'database'
  const [activeTab, setActiveTab] = useState<'import' | 'batch' | 'search' | 'database'>('import');

  // Stored Data
  const [extractedContacts, setExtractedContacts] = useLocalStorage<ExtractedCVContact[]>(
    'cv_autopilot_extracted_contacts',
    INITIAL_EXTRACTED_CONTACTS
  );
  const [savedCVs] = useLocalStorage<CV[]>('cvs', []);
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [candidateDatabase, setCandidateDatabase] = useLocalStorage<CandidateProfile[]>('candidateDatabase', []);

  // Selected or Currently Displayed Contact
  const [currentContact, setCurrentContact] = useState<ExtractedCVContact | null>(INITIAL_EXTRACTED_CONTACTS[0]);

  // Import State
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch Queue Extraction State (Processamento em fila de lotes de até 10 currículos por vez)
  const MAX_BATCH_CONCURRENCY = 10;
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const batchQueueRef = useRef<BatchQueueItem[]>([]);
  const isProcessingBatchRef = useRef<boolean>(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isBatchMode, setIsBatchMode] = useState(false);
  const cancelBatchRequestedRef = useRef<boolean>(false);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const addMoreBatchFileInputRef = useRef<HTMLInputElement>(null);
  const [batchQueueFilter, setBatchQueueFilter] = useState<'all' | 'completed' | 'pending' | 'error'>('all');

  // Online Search State
  const [searchRole, setSearchRole] = useState('Engenheiro de Software');
  const [searchName, setSearchName] = useState('');
  const [searchState, setSearchState] = useState('SP');
  const [searchCity, setSearchCity] = useState('SÃO PAULO');
  const [searchNeighborhood, setSearchNeighborhood] = useState('Todos');
  const [searchPortal, setSearchPortal] = useState('Web 360° (LinkedIn, Catho, Empregos)');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchResults, setOnlineSearchResults] = useState<ExtractedCVContact[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Database / History Filter & View Mode
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbViewMode, setDbViewMode] = useState<'cards' | 'grid'>('cards');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Contact Form State
  const [newContactForm, setNewContactForm] = useState({
    fullName: '',
    targetRole: '',
    email: '',
    phone: '',
    city: 'SÃO PAULO',
    state: 'SP',
    neighborhood: 'Centro',
    street: '',
    postalCode: '',
    seniority: 'Sênior',
    salaryExpectation: '',
    workModel: 'Híbrido' as 'Remoto' | 'Híbrido' | 'Presencial' | 'Indiferente',
    linkedinUrl: '',
    professionalSummary: ''
  });

  // Phone editing and live validation state
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [editedPhoneValue, setEditedPhoneValue] = useState<string>('');

  // Candidate Photo Lightbox & Management State
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const candidatePhotoInputRef = useRef<HTMLInputElement>(null);

  // Manual contact creation photo
  const [manualPhoto, setManualPhoto] = useState<string | null>(null);
  const manualPhotoInputRef = useRef<HTMLInputElement>(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCandidatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentContact) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated: ExtractedCVContact = {
        ...currentContact,
        photoUrl: dataUrl,
        hasPhoto: true,
        photoDetectedSource: 'user_manual'
      };
      setCurrentContact(updated);
      setExtractedContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      showToast(`Foto do candidato ${updated.fullName} atualizada com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCandidatePhoto = () => {
    if (!currentContact) return;
    const updated: ExtractedCVContact = {
      ...currentContact,
      photoUrl: undefined,
      hasPhoto: false
    };
    setCurrentContact(updated);
    setExtractedContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
    showToast('Foto do candidato removida.');
  };

  // Live phone detection on pasted or imported text
  const detectedLivePhones = useMemo(() => {
    if (!rawText || rawText.trim().length < 10) return [];
    return extractAllPhonesFromText(rawText);
  }, [rawText]);

  // Detected phones for currently selected contact
  const currentContactAvailablePhones = useMemo(() => {
    if (!currentContact) return [];
    const textToScan = `${currentContact.rawCvSnippet || ''}\n${rawText || ''}`;
    const detected = extractAllPhonesFromText(textToScan);
    // Ensure the current contact phone is present in the list
    if (currentContact.phone && !currentContact.phone.includes('Não informado')) {
      const cleanDigits = getWhatsAppCleanDigits(currentContact.phone);
      const exists = detected.some(d => d.cleanDigits === cleanDigits);
      if (!exists) {
        detected.unshift({
          rawMatch: currentContact.phone,
          cleanDigits,
          formatted: formatExactPhone(currentContact.phone),
          phoneWithDdi: `55${cleanDigits}`,
          hasDdi: true,
          hasDdd: true,
          isWhatsApp: true,
          confidence: 99,
          label: 'Principal'
        });
      }
    }
    return detected;
  }, [currentContact?.id, currentContact?.phone, currentContact?.rawCvSnippet, rawText]);

  const handleUpdateContactPhone = (newPhone: string) => {
    if (!currentContact) return;
    const formatted = formatExactPhone(newPhone);
    const updated: ExtractedCVContact = {
      ...currentContact,
      phone: formatted
    };
    setCurrentContact(updated);
    setExtractedContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
    setIsEditingPhone(false);
    showToast(`Telefone do candidato atualizado para: ${formatted}`);
  };

  const handleCopyText = (text: string, keyName: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`${label} copiado com sucesso!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Process Raw Text or Document
  const handleExtractFromText = async (
    textToProcess: string, 
    sourceLabel = 'Texto Inserido',
    visualDataUrl?: string,
    photoUrl?: string
  ) => {
    if ((!textToProcess || textToProcess.trim().length < 15) && !visualDataUrl) {
      setImportError('Insira ou importe o conteúdo do currículo com pelo menos 15 caracteres.');
      return;
    }

    setImportError(null);
    setIsExtracting(true);

    try {
      const contact = await extractCVContactInfo(textToProcess, sourceLabel, visualDataUrl, photoUrl);
      setCurrentContact(contact);

      // Save to history if not already present
      setExtractedContacts(prev => {
        const filtered = prev.filter(c => c.id !== contact.id && c.email !== contact.email);
        return [contact, ...filtered];
      });

      showToast(`Dados completos e contatos de ${contact.fullName} extraídos com sucesso!`);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Falha ao extrair informações de contato do currículo.');
    } finally {
      setIsExtracting(false);
    }
  };

  // 2. Core File Processing to Contact (PDF, DOCX, Imagem OCR, TXT)
  const processFileToContact = async (file: File): Promise<ExtractedCVContact> => {
    // A. Imagem (Scan / Foto / OCR)
    if (file.type.startsWith('image/')) {
      return new Promise<ExtractedCVContact>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const base64Data = ev.target?.result as string;
            const contact = await extractCVContactFromImage(base64Data, file.type, file.name);
            resolve(contact);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
        reader.readAsDataURL(file);
      });
    }

    // B. PDF com renderização de alta resolução e ordenação de coordenadas
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return new Promise<ExtractedCVContact>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            if (typeof pdfjsLib !== 'undefined') {
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
              const typedArray = new Uint8Array(ev.target?.result as ArrayBuffer);
              const pdf = await pdfjsLib.getDocument(typedArray).promise;

              // Renderiza página 1 para detecção visual da foto do candidato
              let pageImageDataUrl = '';
              try {
                const firstPage = await pdf.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  await firstPage.render({ canvasContext: ctx, viewport }).promise;
                  pageImageDataUrl = canvas.toDataURL('image/jpeg', 0.88);
                }
              } catch (renderErr) {
                console.warn('Não foi possível renderizar página para canvas:', renderErr);
              }

              // Extrai texto ordenado por coordenadas (Top-to-Bottom, Left-to-Right)
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = (textContent.items as any[]).slice().sort((a, b) => {
                  const yA = a.transform ? a.transform[5] : 0;
                  const yB = b.transform ? b.transform[5] : 0;
                  if (Math.abs(yA - yB) > 4) return yB - yA;
                  const xA = a.transform ? a.transform[4] : 0;
                  const xB = b.transform ? b.transform[4] : 0;
                  return xA - xB;
                });

                let pageText = '';
                let lastY: number | null = null;
                for (const item of items) {
                  const str = item.str || '';
                  if (!str) continue;
                  const currentY = item.transform ? item.transform[5] : null;
                  if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
                    pageText += '\n';
                  } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
                    pageText += ' ';
                  }
                  pageText += str;
                  lastY = currentY;
                }
                fullText += pageText + '\n\n';
              }

              const contact = await extractCVContactInfo(fullText, file.name, pageImageDataUrl);
              resolve(contact);
            } else {
              const text = new TextDecoder('utf-8').decode(ev.target?.result as ArrayBuffer);
              const contact = await extractCVContactInfo(text, file.name);
              resolve(contact);
            }
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo PDF'));
        reader.readAsArrayBuffer(file);
      });
    }

    // C. Word Document (.docx)
    if (file.name.toLowerCase().endsWith('.docx')) {
      return new Promise<ExtractedCVContact>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const arrayBuffer = ev.target?.result as ArrayBuffer;
            let docText = '';
            if (typeof mammoth !== 'undefined') {
              const result = await mammoth.extractRawText({ arrayBuffer });
              docText = result.value;
            }

            let preExtractedPhoto: string | undefined;
            try {
              const images = await extractImagesFromDocx(arrayBuffer);
              if (images.length > 0) {
                preExtractedPhoto = images[0];
              }
            } catch (imgErr) {
              console.warn('Erro ao extrair imagens embutidas do DOCX:', imgErr);
            }

            const contact = await extractCVContactInfo(docText, file.name, undefined, preExtractedPhoto);
            resolve(contact);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo DOCX'));
        reader.readAsArrayBuffer(file);
      });
    }

    // D. Texto plano (.txt, .md, .rtf)
    return new Promise<ExtractedCVContact>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const text = (ev.target?.result as string) || '';
          const contact = await extractCVContactInfo(text, file.name);
          resolve(contact);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo de texto'));
      reader.readAsText(file);
    });
  };

  // Processamento de Arquivo Individual
  const processSelectedFile = async (file: File) => {
    setFileName(file.name);
    setFileType(file.type);
    setImportError(null);
    setIsExtracting(true);

    try {
      const contact = await processFileToContact(file);
      setCurrentContact(contact);
      setExtractedContacts(prev => {
        const filtered = prev.filter(c => c.id !== contact.id && c.email !== contact.email);
        return [contact, ...filtered];
      });
      showToast(`Dados completos e contatos de ${contact.fullName} extraídos com sucesso!`);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Falha ao extrair informações do currículo.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Funções de sincronização e atualização da Fila (Ref + State)
  const updateSingleQueueItem = (id: string, updates: Partial<BatchQueueItem>) => {
    batchQueueRef.current = batchQueueRef.current.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setBatchQueue([...batchQueueRef.current]);

    const completed = batchQueueRef.current.filter(i => i.status === 'completed').length;
    const total = batchQueueRef.current.length;
    setBatchProgress({
      current: completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  };

  const updateBatchQueueItems = (updatesMap: Map<string, Partial<BatchQueueItem>>) => {
    batchQueueRef.current = batchQueueRef.current.map(item => {
      const update = updatesMap.get(item.id);
      return update ? { ...item, ...update } : item;
    });
    setBatchQueue([...batchQueueRef.current]);

    const completed = batchQueueRef.current.filter(i => i.status === 'completed').length;
    const total = batchQueueRef.current.length;
    setBatchProgress({
      current: completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  };

  // Enfileiramento e Processamento Automático em Lotes de até 10 currículos por vez
  const handleBatchFilesSelected = (filesList: FileList | File[], append: boolean = true) => {
    const rawFiles = Array.from(filesList);
    if (rawFiles.length === 0) return;

    // Filtra arquivos com formatos aceitos (PDF, DOCX, TXT, RTF, Imagens)
    const validFiles = rawFiles.filter(f => 
      f.type.includes('pdf') || 
      f.type.includes('image') || 
      f.type.includes('text') || 
      f.name.toLowerCase().endsWith('.docx') || 
      f.name.toLowerCase().endsWith('.doc') || 
      f.name.toLowerCase().endsWith('.txt') || 
      f.name.toLowerCase().endsWith('.rtf') ||
      f.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      setImportError('Nenhum formato de currículo compatível selecionado (PDF, Word, TXT ou Foto/OCR).');
      return;
    }

    const newQueueItems: BatchQueueItem[] = validFiles.map(f => ({
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type || 'document',
      status: 'pending' as const,
      progressMessage: 'Aguardando processamento no lote'
    }));

    // Se append for true e já existirem itens, adiciona à fila sem descartar arquivos
    const updatedQueue = append && batchQueueRef.current.length > 0 
      ? [...batchQueueRef.current, ...newQueueItems] 
      : newQueueItems;

    batchQueueRef.current = updatedQueue;
    setBatchQueue(updatedQueue);
    setIsBatchMode(true);
    setActiveTab('batch');
    setImportError(null);

    const completedCount = updatedQueue.filter(i => i.status === 'completed').length;
    const totalCount = updatedQueue.length;
    setBatchProgress({
      current: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    });

    showToast(`${newQueueItems.length} currículo(s) adicionado(s) à fila! Processando automaticamente em lotes de até ${MAX_BATCH_CONCURRENCY} simultâneos.`);

    // Inicia imediatamente o processamento automático da fila
    executeBatchQueue();
  };

  // Carrega 3 currículos de exemplo instantâneos em lote para testar a fila
  const handleLoadDemoBatch = () => {
    const demoFiles: File[] = SAMPLE_RESUMES.slice(0, 3).map((sample) => {
      const cleanName = sample.label.split('(')[0].trim().replace(/\s+/g, '_');
      return new File(
        [sample.text],
        `Curriculo_${cleanName}_Demo.txt`,
        { type: 'text/plain' }
      );
    });
    setActiveTab('batch');
    handleBatchFilesSelected(demoFiles, false);
  };

  // Carrega lote completo de 10 currículos de exemplo para demonstrar a capacidade máxima do lote simultâneo
  const handleLoadDemoBatch10 = () => {
    const demoFiles: File[] = SAMPLE_RESUMES.slice(0, 10).map((sample) => {
      const cleanName = sample.label.split('(')[0].trim().replace(/\s+/g, '_');
      return new File(
        [sample.text],
        `Curriculo_${cleanName}_Demo.txt`,
        { type: 'text/plain' }
      );
    });
    setActiveTab('batch');
    handleBatchFilesSelected(demoFiles, false);
  };

  /**
   * Executa a fila de extração processando automaticamente em lotes de até 10 currículos simultâneos
   */
  const executeBatchQueue = async () => {
    // Se já estiver em processamento ativo, o loop em execução absorverá os novos itens pendentes
    if (isProcessingBatchRef.current) return;

    isProcessingBatchRef.current = true;
    setIsProcessingBatch(true);
    cancelBatchRequestedRef.current = false;

    try {
      while (!cancelBatchRequestedRef.current) {
        // Encontra itens com status 'pending' na fila atual
        const currentQueue = batchQueueRef.current;
        const pendingItems = currentQueue.filter(i => i.status === 'pending');

        if (pendingItems.length === 0) {
          // Todos os itens pendentes foram processados
          break;
        }

        // Pega no máximo 10 currículos para o lote ativo da fila
        const currentBatch = pendingItems.slice(0, MAX_BATCH_CONCURRENCY);
        const batchUpdates = new Map<string, Partial<BatchQueueItem>>();

        currentBatch.forEach((item, bIdx) => {
          batchUpdates.set(item.id, {
            status: 'processing',
            progressMessage: `Extraindo com IA & OCR (Lote ativo: item ${bIdx + 1} de até ${MAX_BATCH_CONCURRENCY})...`
          });
        });

        // Marca todos os itens do lote atual como 'processing'
        updateBatchQueueItems(batchUpdates);

        // Dispara o processamento dos até 10 currículos simultaneamente (concorrência total do lote)
        await Promise.allSettled(
          currentBatch.map(async (item) => {
            if (cancelBatchRequestedRef.current) return;

            if (!item.file) {
              updateSingleQueueItem(item.id, {
                status: 'error',
                error: 'Arquivo indisponível para leitura',
                progressMessage: 'Erro: Arquivo indisponível'
              });
              return;
            }

            try {
              const contact = await processFileToContact(item.file);
              if (cancelBatchRequestedRef.current) return;

              // Atualiza item na fila com sucesso e anexa contato
              updateSingleQueueItem(item.id, {
                status: 'completed',
                progressMessage: `Concluído: ${contact.fullName}`,
                extractedContact: contact,
                processedAt: new Date().toISOString()
              });

              // Salva o contato na base histórica global
              setExtractedContacts(prev => {
                const filtered = prev.filter(c => c.id !== contact.id && c.email !== contact.email);
                return [contact, ...filtered];
              });

              // Atualiza contato visualizado no Dossiê
              setCurrentContact(prev => prev || contact);

            } catch (err: any) {
              console.error(`Erro ao extrair ${item.fileName}:`, err);
              updateSingleQueueItem(item.id, {
                status: 'error',
                error: err.message || 'Falha na extração de dados do currículo',
                progressMessage: 'Erro na extração deste currículo'
              });
            }
          })
        );

        // Se o usuário solicitou pausar a fila durante este lote, interrompe
        if (cancelBatchRequestedRef.current) {
          showToast('Processamento da fila em lote pausado pelo usuário.');
          break;
        }
      }
    } finally {
      isProcessingBatchRef.current = false;
      setIsProcessingBatch(false);

      const completed = batchQueueRef.current.filter(i => i.status === 'completed').length;
      const total = batchQueueRef.current.length;
      if (!cancelBatchRequestedRef.current && total > 0 && completed === total) {
        showToast(`🎉 Fila concluída! Todos os ${completed} currículos foram extraídos com sucesso.`);
      }
    }
  };

  // Reprocessa todos os itens que tiveram falha
  const handleRetryErrors = () => {
    const errorItems = batchQueueRef.current.filter(i => i.status === 'error');
    if (errorItems.length === 0) {
      showToast('Nenhum currículo com erro para reprocessar.');
      return;
    }

    const updates = new Map<string, Partial<BatchQueueItem>>();
    errorItems.forEach(item => {
      updates.set(item.id, {
        status: 'pending',
        error: undefined,
        progressMessage: 'Aguardando reprocessamento no lote'
      });
    });

    updateBatchQueueItems(updates);
    showToast(`Reprocessando ${errorItems.length} currículos que apresentaram falha...`);
    executeBatchQueue();
  };

  // Reprocessa um único item com erro
  const handleRetrySingleItem = (itemId: string) => {
    updateSingleQueueItem(itemId, {
      status: 'pending',
      error: undefined,
      progressMessage: 'Aguardando reprocessamento'
    });
    executeBatchQueue();
  };

  const handleCancelBatchQueue = () => {
    cancelBatchRequestedRef.current = true;
    isProcessingBatchRef.current = false;
    setIsProcessingBatch(false);
    showToast('Pausa solicitada. Finalizando itens em andamento...');
  };

  const handleClearBatchQueue = () => {
    if (isProcessingBatch) {
      cancelBatchRequestedRef.current = true;
      isProcessingBatchRef.current = false;
      setIsProcessingBatch(false);
    }
    batchQueueRef.current = [];
    setBatchQueue([]);
    setBatchProgress({ current: 0, total: 0, percentage: 0 });
    setIsBatchMode(false);
    showToast('Fila de processamento em lote limpa.');
  };

  const handleExportBatchToExcel = () => {
    const contactsToExport = batchQueueRef.current
      .filter(i => i.status === 'completed' && i.extractedContact)
      .map(i => i.extractedContact!);

    if (contactsToExport.length === 0) {
      showToast('Nenhum currículo concluído no lote para exportar.');
      return;
    }

    exportContactsToExcel(contactsToExport, `Lote_Curriculos_Extraidos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`${contactsToExport.length} contatos do lote exportados com sucesso para Excel!`);
  };

  const handleSaveBatchToDatabase = () => {
    const contactsToSave = batchQueueRef.current
      .filter(i => i.status === 'completed' && i.extractedContact)
      .map(i => i.extractedContact!);

    if (contactsToSave.length === 0) {
      showToast('Nenhum currículo concluído no lote.');
      return;
    }

    // Converte para CandidateProfile e adiciona ao banco de talentos
    let countAdded = 0;
    setCandidateDatabase(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newProfiles: CandidateProfile[] = [];

      for (const c of contactsToSave) {
        if (!existingIds.has(c.id)) {
          newProfiles.push({
            id: c.id,
            name: c.fullName,
            headline: c.targetRole,
            location: {
              city: c.address.city,
              state: c.address.state
            },
            status: 'Novo',
            matchScore: c.extractionConfidence || 95,
            summary: c.professionalSummary || 'Perfil extraído via importação em lote.',
            skills: c.keySkills || [],
            experienceHighlights: c.experienceYears ? [String(c.experienceYears)] : [],
            education: c.education,
            contactInfo: {
              email: c.email,
              phone: c.phone,
              linkedin: c.linkedinUrl,
              portfolio: c.portfolioUrl
            },
            sourceUrls: c.linkedinUrl 
              ? [{ title: 'LinkedIn', uri: c.linkedinUrl }] 
              : [{ title: c.sourceName || 'Extrator de Contatos', uri: '#' }],
            fullCvText: c.rawCvSnippet || '',
            addedAt: new Date().toISOString()
          });
          countAdded++;
        }
      }

      return [...newProfiles, ...prev];
    });

    showToast(`${countAdded} candidatos do lote salvos no Banco de Talentos!`);
  };

  // Upload de arquivo via input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1 || isBatchMode) {
      handleBatchFilesSelected(files);
    } else {
      processSelectedFile(files[0]);
    }
  };

  // Drag and Drop com suporte a múltiplos arquivos (lote de até 10)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1 || isBatchMode) {
        handleBatchFilesSelected(files);
      } else {
        processSelectedFile(files[0]);
      }
    }
  };

  // 3. Online Search Handler
  const handleOnlineSearch = async () => {
    setIsSearchingOnline(true);
    setSearchError(null);

    const locationString = searchNeighborhood && searchNeighborhood !== 'Todos'
      ? `${searchNeighborhood}, ${searchCity}, ${searchState}`
      : `${searchCity}, ${searchState}`;

    try {
      const results = await searchCandidatesOnline({
        query: searchName.trim() || undefined,
        role: searchRole.trim(),
        location: locationString,
        portal: searchPortal
      });

      setOnlineSearchResults(results);

      // If results returned, set the first as current
      if (results.length > 0) {
        setCurrentContact(results[0]);
        // Also add to global extracted database
        setExtractedContacts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const newItems = results.filter(r => !ids.has(r.id));
          return [...newItems, ...prev];
        });
        showToast(`${results.length} contatos de candidatos localizados na web!`);
      } else {
        setSearchError('Nenhum candidato encontrado com os critérios especificados. Tente ampliar os termos de busca.');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError('Falha ao conectar com o serviço de busca na web. Verifique a conexão.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Export & Action Handlers
  const handleExportPdf = () => {
    if (!currentContact) return;
    try {
      const fileName = exportContactDossierPdf(currentContact);
      showToast(`Dossiê em PDF exportado: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar Dossiê em PDF.');
    }
  };

  const handleExportVCard = () => {
    if (!currentContact) return;
    try {
      const fileName = downloadVCard(currentContact);
      showToast(`vCard exportado (${fileName}) - Abra para salvar no celular/Google Contacts!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar vCard.');
    }
  };

  // Export current contact to native Excel (.xlsx)
  const handleExportCurrentToExcel = () => {
    if (!currentContact) return;
    try {
      const fileName = exportSingleContactToExcel(currentContact);
      showToast(`Planilha Excel gerada: ${fileName}`);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao exportar contato para Excel.');
    }
  };

  // Export entire database to structured Excel (.xlsx)
  const handleExportAllToExcel = () => {
    if (!extractedContacts || extractedContacts.length === 0) {
      showToast('Nenhum contato cadastrado no banco para exportar.');
      return;
    }
    try {
      setIsExportingExcel(true);
      const fileName = exportContactsToExcel(extractedContacts);
      showToast(`Banco de dados Excel (.xlsx) gerado: ${fileName}`);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao exportar banco de dados para Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Import contacts from an Excel spreadsheet (.xlsx, .xls, .csv)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      showToast(`Lendo e mapeando planilha Excel: ${file.name}...`);
      const { imported, count } = await importContactsFromExcel(file);
      
      if (count > 0) {
        setExtractedContacts(prev => {
          const existingEmails = new Set(prev.map(c => c.email.toLowerCase()));
          const newEntries = imported.filter(c => !existingEmails.has(c.email.toLowerCase()));
          return [...newEntries, ...prev];
        });
        setCurrentContact(imported[0]);
        setActiveTab('database');
        setDbViewMode('grid');
        showToast(`${count} contatos importados com sucesso do Excel (${file.name})!`);
      } else {
        showToast('Nenhum contato legível encontrado na planilha.');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao processar planilha Excel.');
    } finally {
      setIsImportingExcel(false);
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = '';
      }
    }
  };

  // Create contact manually to add to the database
  const handleCreateManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactForm.fullName.trim() || !newContactForm.targetRole.trim()) {
      showToast('Preencha pelo menos o Nome Completo e a Vaga Alvo.');
      return;
    }

    const fullAddress = `${newContactForm.street ? newContactForm.street + ', ' : ''}${newContactForm.neighborhood ? newContactForm.neighborhood + ', ' : ''}${newContactForm.city} - ${newContactForm.state}${newContactForm.postalCode ? ', CEP: ' + newContactForm.postalCode : ''}, Brasil`;

    const newContact: ExtractedCVContact = {
      id: 'contact-manual-' + Date.now(),
      extractedAt: new Date().toISOString(),
      sourceType: 'text_paste',
      sourceName: 'Cadastro Manual no Banco',
      fullName: newContactForm.fullName.trim(),
      photoUrl: manualPhoto || undefined,
      hasPhoto: Boolean(manualPhoto),
      photoDetectedSource: manualPhoto ? 'user_manual' : undefined,
      targetRole: newContactForm.targetRole.trim(),
      email: newContactForm.email.trim() || `${newContactForm.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com`,
      phone: newContactForm.phone.trim() || '(11) 98765-4321',
      address: {
        fullAddress,
        street: newContactForm.street.trim() || undefined,
        neighborhood: newContactForm.neighborhood.trim() || undefined,
        city: newContactForm.city.trim(),
        state: newContactForm.state.trim().toUpperCase(),
        postalCode: newContactForm.postalCode.trim() || undefined,
        country: 'Brasil'
      },
      seniority: newContactForm.seniority,
      salaryExpectation: newContactForm.salaryExpectation.trim() || undefined,
      workModel: newContactForm.workModel,
      linkedinUrl: newContactForm.linkedinUrl.trim() || undefined,
      professionalSummary: newContactForm.professionalSummary.trim() || undefined,
      keySkills: ['Liderança Executiva', 'Estratégia Corporativa', 'Gestão de Projetos'],
      extractionConfidence: 100,
      notes: 'Cadastrado diretamente no Banco de Dados'
    };

    setExtractedContacts(prev => [newContact, ...prev]);
    setCurrentContact(newContact);
    setShowAddContactModal(false);
    setManualPhoto(null);
    setNewContactForm({
      fullName: '',
      targetRole: '',
      email: '',
      phone: '',
      city: 'São Paulo',
      state: 'SP',
      neighborhood: '',
      street: '',
      postalCode: '',
      seniority: 'Sênior',
      salaryExpectation: '',
      workModel: 'Híbrido',
      linkedinUrl: '',
      professionalSummary: ''
    });
    showToast(`Candidato ${newContact.fullName} adicionado ao Banco de Dados!`);
  };

  const handleCopyFullDossier = () => {
    if (!currentContact) return;
    const dossierText = `================================================
DOSSIÊ EXECUTIVO DE CONTATO • CV-AUTOPILOT
================================================
👤 Nome Completo: ${currentContact.fullName}
💼 Vaga Alvo / Pretensão: ${currentContact.targetRole}
⭐ Senioridade: ${currentContact.seniority || 'Sênior'}
📍 Endereço Completo: ${currentContact.address.fullAddress}
   • Cidade/UF: ${currentContact.address.city} - ${currentContact.address.state}
   • CEP: ${currentContact.address.postalCode || 'Não informado'}
✉️ E-mail: ${currentContact.email}
📱 Telefone / WhatsApp: ${currentContact.phone}
🔗 LinkedIn: ${currentContact.linkedinUrl || 'Não informado'}
🌐 Portfólio: ${currentContact.portfolioUrl || currentContact.githubUrl || 'Não informado'}
🏢 Empresa Atual/Recente: ${currentContact.recentCompany || 'N/A'}
💰 Pretensão Salarial: ${currentContact.salaryExpectation || 'A combinar'}
🏠 Modelo de Trabalho: ${currentContact.workModel || 'Híbrido'}

📝 Resumo Profissional:
${currentContact.professionalSummary || 'Sem resumo fornecido.'}

🛠️ Competências Principais:
${currentContact.keySkills ? currentContact.keySkills.join(', ') : 'N/A'}

📅 Extraído em: ${new Date(currentContact.extractedAt).toLocaleString('pt-BR')} via ${currentContact.sourceName}
================================================`;

    navigator.clipboard.writeText(dossierText);
    showToast('Dossiê completo copiado para a área de transferência!');
  };

  // Add to Applications Pipeline
  const handleAddToPipeline = () => {
    if (!currentContact) return;

    const existing = applications.find(a => 
      a.jobTitle.toLowerCase() === currentContact.targetRole.toLowerCase() &&
      a.email === currentContact.email
    );

    if (existing) {
      showToast('Este candidato/vaga já está cadastrado no Pipeline.');
      return;
    }

    const newApp: Application = {
      id: 'app-' + Date.now(),
      jobTitle: currentContact.targetRole,
      companyName: currentContact.recentCompany || 'Oportunidade Alvo',
      dateApplied: new Date().toISOString().split('T')[0],
      status: ApplicationStatus.Aplicou,
      phone: currentContact.phone,
      email: currentContact.email,
      notes: `Candidato: ${currentContact.fullName}\nEndereço: ${currentContact.address.fullAddress}\nLinkedIn: ${currentContact.linkedinUrl || 'N/A'}\nExtraído via Extrator de Contatos.`
    };

    setApplications(prev => [newApp, ...prev]);
    showToast(`Adicionado ao Pipeline de Candidaturas com sucesso!`);
  };

  // Save to Talent Pool (Radar 360°)
  const handleSaveToTalentPool = () => {
    if (!currentContact) return;

    const exists = candidateDatabase.some(c => 
      c.name.toLowerCase() === currentContact.fullName.toLowerCase() ||
      c.contactInfo?.email === currentContact.email
    );

    if (exists) {
      showToast('Candidato já salvo no Banco de Talentos (Radar 360°).');
      return;
    }

    const newCandidate: CandidateProfile = {
      id: 'cand-pool-' + Date.now(),
      name: currentContact.fullName,
      headline: currentContact.targetRole,
      location: {
        neighborhood: currentContact.address.neighborhood,
        city: currentContact.address.city,
        state: currentContact.address.state
      },
      summary: currentContact.professionalSummary || 'Candidato extraído via módulo de inteligência de contatos.',
      skills: currentContact.keySkills || [],
      contactInfo: {
        email: currentContact.email,
        phone: currentContact.phone,
        linkedin: currentContact.linkedinUrl,
        portfolio: currentContact.portfolioUrl || currentContact.githubUrl
      },
      sourceUrls: currentContact.linkedinUrl 
        ? [{ title: 'LinkedIn', uri: currentContact.linkedinUrl }] 
        : [{ title: currentContact.sourceName || 'Extrator de Contatos', uri: '#' }],
      status: 'Novo',
      addedAt: new Date().toISOString(),
      matchScore: currentContact.extractionConfidence || 95,
      portalSource: currentContact.sourceName || 'Extrator de Contatos',
      fullCvText: currentContact.rawCvSnippet
    };

    setCandidateDatabase(prev => [newCandidate, ...prev]);
    showToast('Candidato adicionado ao Banco de Talentos do Radar 360°!');
  };

  // Filtered Database List
  const filteredContacts = useMemo(() => {
    if (!dbSearchQuery.trim()) return extractedContacts;
    const q = dbSearchQuery.toLowerCase();
    return extractedContacts.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.targetRole.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.city.toLowerCase().includes(q) ||
      c.address.state.toLowerCase().includes(q)
    );
  }, [extractedContacts, dbSearchQuery]);

  // Export all to CSV
  const handleExportAllCsv = () => {
    if (extractedContacts.length === 0) {
      showToast('Nenhum contato salvo para exportar.');
      return;
    }

    const headers = ['Nome Completo', 'Vaga Alvo', 'E-mail', 'Telefone', 'Endereço Completo', 'Cidade', 'Estado', 'CEP', 'LinkedIn', 'Senioridade', 'Pretensão Salarial', 'Origem', 'Data Extração'];
    const rows = extractedContacts.map(c => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      `"${c.targetRole.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${c.address.fullAddress.replace(/"/g, '""')}"`,
      `"${c.address.city.replace(/"/g, '""')}"`,
      `"${c.address.state.replace(/"/g, '""')}"`,
      `"${c.address.postalCode || ''}"`,
      `"${c.linkedinUrl || ''}"`,
      `"${c.seniority || ''}"`,
      `"${c.salaryExpectation || ''}"`,
      `"${c.sourceName || ''}"`,
      `"${new Date(c.extractedAt).toLocaleDateString('pt-BR')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Contatos_Extraidos_CV_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Base completa de contatos exportada em CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-2 animate-bounce"
          style={{ 
            backgroundColor: colors.surfaceElevated || colors.surface, 
            borderColor: colors.borderFocus || '#881337',
            color: colors.textPrimary,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <Sparkles size={16} color={colors.primary} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Executivo */}
      <div 
        className="p-6 lg:p-8 rounded-3xl border shadow-sm relative overflow-hidden"
        style={{ 
          backgroundColor: colors.surface, 
          borderColor: colors.border 
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5"
                style={{ 
                  backgroundColor: colors.primaryLight, 
                  color: colors.primary 
                }}
              >
                <ContactIcon size={14} />
                Inteligência Cadastral & Contatos
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                style={{ 
                  borderColor: colors.border, 
                  color: colors.textSecondary 
                }}
              >
                Gemini 3.8 Flash Multimodal
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: colors.textPrimary }}>
              Extrator de Contatos & Dossiê de Candidatura
            </h1>
            <p className="text-sm mt-1.5 max-w-2xl leading-relaxed" style={{ color: colors.textSecondary }}>
              Extraia instantaneamente <strong>Nome Completo</strong>, <strong>E-mail</strong>, <strong>Telefone / WhatsApp</strong>, <strong>Vaga Alvo</strong> e <strong>Endereço Completo com CEP</strong> a partir de arquivos (.pdf, .docx, fotos/scans) ou por varredura inteligente na internet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* Hidden Excel File Input for quick import */}
            <input 
              type="file" 
              ref={excelFileInputRef} 
              accept=".xlsx,.xls,.csv" 
              onChange={handleExcelUpload} 
              style={{ display: 'none' }} 
            />

            <button
              onClick={() => setActiveTab('import')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'import' ? colors.primary : colors.surfaceHover,
                color: activeTab === 'import' ? colors.textOnPrimary : colors.textPrimary,
                border: `1px solid ${activeTab === 'import' ? colors.primary : colors.border}`
              }}
            >
              <Upload size={14} />
              <span>Importar Arquivo / Texto</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative"
              style={{
                backgroundColor: activeTab === 'batch' ? colors.primary : colors.surfaceHover,
                color: activeTab === 'batch' ? colors.textOnPrimary : colors.textPrimary,
                border: `1px solid ${activeTab === 'batch' ? colors.primary : colors.border}`
              }}
            >
              <Layers size={14} />
              <span>Fila em Lote (Até 10 por vez)</span>
              {batchQueue.length > 0 && (
                <span 
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
                  style={{ 
                    backgroundColor: activeTab === 'batch' ? '#fff' : colors.primary, 
                    color: activeTab === 'batch' ? colors.primary : '#fff' 
                  }}
                >
                  {batchQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'search' ? colors.primary : colors.surfaceHover,
                color: activeTab === 'search' ? colors.textOnPrimary : colors.textPrimary,
                border: `1px solid ${activeTab === 'search' ? colors.primary : colors.border}`
              }}
            >
              <SearchIcon size={14} />
              <span>Buscar na Internet (Web 360°)</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'database' ? colors.primary : colors.surfaceHover,
                color: activeTab === 'database' ? colors.textOnPrimary : colors.textPrimary,
                border: `1px solid ${activeTab === 'database' ? colors.primary : colors.border}`
              }}
            >
              <DatabaseIcon size={14} />
              <span>Base Salva ({extractedContacts.length})</span>
            </button>

            {/* Quick Excel Export All Button */}
            <button
              onClick={handleExportAllToExcel}
              disabled={isExportingExcel || extractedContacts.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar toda a base de contatos em planilha Excel (.xlsx) com múltiplas abas e formatação profissional"
            >
              <FileSpreadsheet size={14} />
              <span>{isExportingExcel ? 'Gerando Excel...' : 'Exportar Excel (.xlsx)'}</span>
            </button>

            {/* Quick Excel Import Button */}
            <button
              onClick={() => excelFileInputRef.current?.click()}
              disabled={isImportingExcel}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border hover:bg-black/10 text-emerald-400 border-emerald-500/40"
              title="Importar contatos de uma planilha Excel (.xlsx, .xls) existente"
            >
              <Upload size={13} />
              <span>{isImportingExcel ? 'Importando...' : 'Importar Excel'}</span>
            </button>

            {/* Manual Add Contact Button */}
            <button
              onClick={() => setShowAddContactModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border hover:bg-[#881337]/15 text-[#881337] border-[#881337]/40"
              title="Cadastrar um novo contato manualmente na base de dados"
            >
              <PlusIcon size={13} />
              <span>Novo Contato</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: INPUT / SEARCH PANELS */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* TAB 1: IMPORT FILE / TEXT */}
          {activeTab === 'import' && (
            <div 
              className="p-5 lg:p-6 rounded-3xl border shadow-sm space-y-5"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <Upload size={16} color={colors.primary} />
                  <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                    Importação de Currículo
                  </h2>
                </div>
                <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                  PDF • DOCX • Imagem / OCR • TXT
                </span>
              </div>

              {/* Batch Mode Invitation Banner */}
              <div 
                className="p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer transition-all hover:scale-[1.01]"
                onClick={() => setActiveTab('batch')}
                style={{ 
                  backgroundColor: colors.surfaceElevated || colors.background, 
                  borderColor: colors.primary + '50' 
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                      Precisa processar vários currículos de uma vez?
                    </span>
                    <span className="text-[11px] block" style={{ color: colors.textSecondary }}>
                      Coloque seus currículos na fila e processe automaticamente em lotes de até 10 por vez com IA & OCR.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
                  style={{ backgroundColor: colors.primary, color: '#fff' }}
                >
                  <span>Abrir Fila em Lote</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragOver ? 'border-[#881337] bg-[#881337]/5 scale-[0.99]' : 'hover:border-[#881337]/50'
                }`}
                style={{ 
                  backgroundColor: isDragOver ? colors.primaryLight : colors.surfaceElevated || colors.background,
                  borderColor: isDragOver ? colors.primary : colors.border 
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.rtf,.jpg,.jpeg,.png,.webp" 
                  className="hidden" 
                />

                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
                  >
                    <Upload size={22} />
                  </div>

                  <div>
                    <span className="text-sm font-bold block" style={{ color: colors.textPrimary }}>
                      {fileName ? fileName : 'Arraste o currículo aqui ou clique para buscar'}
                    </span>
                    <span className="text-xs block mt-0.5" style={{ color: colors.textSecondary }}>
                      Suporte a arquivos individuais ou múltiplos (até 10 por lote) em PDF, Word (.docx), TXT e Fotos (OCR com IA)
                    </span>
                  </div>
                </div>
              </div>

              {/* Select from existing library if available */}
              {savedCVs.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold block" style={{ color: colors.textSecondary }}>
                    Ou selecione um currículo já cadastrado na plataforma:
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = savedCVs.find(c => c.id === e.target.value);
                      if (selected) {
                        setRawText(selected.content);
                        handleExtractFromText(selected.content, selected.name);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border font-medium outline-none transition-all"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  >
                    <option value="">-- Selecionar da minha biblioteca de currículos --</option>
                    {savedCVs.map(cv => (
                      <option key={cv.id} value={cv.id}>{cv.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Sample Test Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold block" style={{ color: colors.textSecondary }}>
                  ⚡ Testar rapidamente com exemplos reais:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {SAMPLE_RESUMES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRawText(sample.text);
                        handleExtractFromText(sample.text, sample.label);
                      }}
                      className="text-left p-2 rounded-xl text-xs font-medium border transition-all hover:translate-x-1 flex items-center justify-between"
                      style={{ 
                        backgroundColor: colors.surfaceHover, 
                        borderColor: colors.border,
                        color: colors.textPrimary 
                      }}
                    >
                      <span className="truncate pr-2">📌 {sample.label}</span>
                      <ChevronRight size={12} color={colors.primary} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Direct Paste Textarea */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                    Texto do Currículo (Colagem Direta):
                  </label>
                  <span className="text-[11px]" style={{ color: colors.textSecondary }}>
                    {rawText.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o texto do currículo (Nome, contatos, experiências, objetivo profissional e endereço)..."
                  className="w-full text-xs p-3 rounded-xl border outline-none font-mono resize-y transition-all focus:ring-1"
                  style={{ 
                    backgroundColor: colors.inputBg || colors.surface, 
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }}
                />

                {/* Live Real-time Phone Extraction Indicator */}
                {detectedLivePhones.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Check size={14} />
                        {detectedLivePhones.length === 1 
                          ? '1 número de contato detectado com exatidão no documento:'
                          : `${detectedLivePhones.length} números de contato detectados com exatidão no documento:`}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        100% Fiel ao Arquivo
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {detectedLivePhones.map((p, idx) => (
                        <div 
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-zinc-900/80 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Phone size={11} className="text-emerald-500" />
                          <span>{p.formatted}</span>
                          {p.label && (
                            <span className="text-[10px] font-sans font-medium opacity-80 px-1 py-0.2 rounded bg-emerald-500/15">
                              {p.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Box */}
              {importError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Extraction Trigger Button */}
              <button
                disabled={isExtracting || (!rawText && !fileName)}
                onClick={() => handleExtractFromText(rawText, fileName || 'Texto Colado')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)',
                  boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)'
                }}
              >
                {isExtracting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Extraindo Contatos com IA (Gemini 3.8)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Extrair Informações de Contato & Vaga</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB: BATCH IMPORT & QUEUE (PROCESSAMENTO EM LOTES DE ATÉ 10 POR VEZ) */}
          {activeTab === 'batch' && (
            <div 
              className="p-5 lg:p-6 rounded-3xl border shadow-sm space-y-5"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              {/* Batch Tab Header */}
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Layers size={17} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                      Fila de Extração em Lote de Currículos
                    </h2>
                    <span className="text-[11px] font-semibold text-rose-500">
                      Processamento automático em lotes de até {MAX_BATCH_CONCURRENCY} currículos por vez
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Sparkles size={11} />
                  <span>OCR & IA Multimodal</span>
                </span>
              </div>

              {/* Informative Rule Box */}
              <div 
                className="p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1"
                style={{ 
                  backgroundColor: colors.surfaceElevated || colors.background, 
                  borderColor: colors.border 
                }}
              >
                <div className="flex items-center gap-1.5 font-bold" style={{ color: colors.primary }}>
                  <Sparkles size={14} />
                  <span>Processamento Automático Concorrente (Até 10 por Lote)</span>
                </div>
                <p style={{ color: colors.textSecondary }}>
                  Importe quantos arquivos desejar em lote (PDF, DOCX, TXT ou Fotos/Imagens). A ferramenta enfileira todos os currículos e <strong>processa automaticamente em lotes de até 10 currículos em paralelo</strong>, extraindo Nome Completo, WhatsApp/Telefone, E-mail, Endereço com CEP, Foto e Competências.
                </p>
              </div>

              {/* Batch Upload Dropzone */}
              <input 
                type="file" 
                ref={batchFileInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleBatchFilesSelected(e.target.files, true);
                  }
                  e.target.value = '';
                }}
                multiple
                accept=".pdf,.docx,.doc,.txt,.rtf,.jpg,.jpeg,.png,.webp" 
                className="hidden" 
              />

              <input 
                type="file" 
                ref={addMoreBatchFileInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleBatchFilesSelected(e.target.files, true);
                  }
                  e.target.value = '';
                }}
                multiple
                accept=".pdf,.docx,.doc,.txt,.rtf,.jpg,.jpeg,.png,.webp" 
                className="hidden" 
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchFilesSelected(e.dataTransfer.files, true);
                  }
                }}
                onClick={() => batchFileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragOver ? 'border-[#881337] bg-[#881337]/5 scale-[0.99]' : 'hover:border-[#881337]/50'
                }`}
                style={{ 
                  backgroundColor: isDragOver ? colors.primaryLight : colors.surfaceElevated || colors.background,
                  borderColor: isDragOver ? colors.primary : colors.border 
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
                  >
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-bold block" style={{ color: colors.textPrimary }}>
                      Clique ou arraste múltiplos currículos para a fila
                    </span>
                    <span className="text-xs block mt-0.5" style={{ color: colors.textSecondary }}>
                      Formatos aceitos: PDF nativo, Word (.docx), TXT, RTF e Fotos (PNG, JPG, WEBP). Processa em lotes de até 10 simultâneos.
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleLoadDemoBatch}
                    disabled={isProcessingBatch}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all hover:bg-black/5 disabled:opacity-50"
                    style={{ borderColor: colors.border, color: colors.primary }}
                    title="Carrega 3 currículos de teste para validação rápida da fila"
                  >
                    <Sparkles size={13} />
                    <span>⚡ Lote Rápido Demo (3 CVs)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemoBatch10}
                    disabled={isProcessingBatch}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all hover:bg-black/5 disabled:opacity-50"
                    style={{ borderColor: colors.primary + '60', color: colors.primary }}
                    title="Carrega lote completo de 10 currículos para testar a capacidade máxima simultânea"
                  >
                    <Layers size={13} />
                    <span>🚀 Lote Completo Demo (10 CVs)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {batchQueue.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addMoreBatchFileInputRef.current?.click()}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all hover:bg-black/5"
                      style={{ borderColor: colors.border, color: colors.textPrimary }}
                      title="Adicionar mais arquivos à fila de processamento"
                    >
                      <PlusIcon size={13} />
                      <span>Adicionar Mais</span>
                    </button>
                  )}

                  {batchQueue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearBatchQueue}
                      disabled={isProcessingBatch}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-all disabled:opacity-50"
                      title="Limpar a fila de currículos"
                    >
                      <Trash size={13} />
                      <span>Limpar Fila</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress & Batch Controls (If Queue is not empty) */}
              {batchQueue.length > 0 && (
                <div 
                  className="p-4 rounded-2xl border space-y-3"
                  style={{ backgroundColor: colors.surfaceElevated || colors.background, borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isProcessingBatch ? (
                        <RefreshCw size={16} className="animate-spin text-amber-500" />
                      ) : batchQueue.every(i => i.status === 'completed') ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : (
                        <Clock size={16} style={{ color: colors.textSecondary }} />
                      )}
                      <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                        {isProcessingBatch 
                          ? `Processando Fila em Lotes de até ${MAX_BATCH_CONCURRENCY}: ${batchProgress.current} de ${batchProgress.total} concluídos`
                          : batchQueue.every(i => i.status === 'completed')
                          ? `Fila Concluída (${batchQueue.length} currículos extraídos com sucesso)`
                          : `Fila com ${batchQueue.length} currículos (${batchQueue.filter(i => i.status === 'pending').length} aguardando lote)`
                        }
                      </span>
                    </div>

                    <span className="text-xs font-bold font-mono" style={{ color: colors.primary }}>
                      {batchProgress.percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${batchProgress.percentage}%`,
                        backgroundColor: batchQueue.every(i => i.status === 'completed') ? '#10b981' : colors.primary
                      }}
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold pt-1">
                    <div className="p-1.5 rounded-lg border" style={{ borderColor: colors.border }}>
                      <span className="block text-stone-400 text-[10px]">Total na Fila</span>
                      <span style={{ color: colors.textPrimary }}>{batchQueue.length}</span>
                    </div>
                    <div className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                      <span className="block text-[10px]">Concluídos</span>
                      <span>{batchQueue.filter(i => i.status === 'completed').length}</span>
                    </div>
                    <div className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-500">
                      <span className="block text-[10px]">
                        {isProcessingBatch ? `Lote Ativo (≤${MAX_BATCH_CONCURRENCY})` : 'Pendentes'}
                      </span>
                      <span>{batchQueue.filter(i => i.status === 'pending' || i.status === 'processing').length}</span>
                    </div>
                    <div className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-500">
                      <span className="block text-[10px]">Falhas</span>
                      <span>{batchQueue.filter(i => i.status === 'error').length}</span>
                    </div>
                  </div>

                  {/* Batch Global Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                    {isProcessingBatch ? (
                      <button
                        type="button"
                        onClick={handleCancelBatchQueue}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm"
                      >
                        <X size={13} />
                        <span>Pausar / Interromper Fila</span>
                      </button>
                    ) : (
                      batchQueue.some(i => i.status === 'pending') && (
                        <button
                          type="button"
                          onClick={() => executeBatchQueue()}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Play size={13} />
                          <span>Iniciar / Retomar Fila</span>
                        </button>
                      )
                    )}

                    {batchQueue.some(i => i.status === 'error') && !isProcessingBatch && (
                      <button
                        type="button"
                        onClick={handleRetryErrors}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
                        title="Tentar extrair novamente os currículos que apresentaram erro"
                      >
                        <RefreshCw size={13} />
                        <span>Reprocessar Falhas ({batchQueue.filter(i => i.status === 'error').length})</span>
                      </button>
                    )}

                    {batchQueue.some(i => i.status === 'completed') && (
                      <>
                        <button
                          type="button"
                          onClick={handleExportBatchToExcel}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                          title="Exportar todos os currículos concluídos deste lote em Excel (.xlsx)"
                        >
                          <FileSpreadsheet size={13} />
                          <span>Exportar Lote (.xlsx)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveBatchToDatabase}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all hover:bg-black/5"
                          style={{ borderColor: colors.primary, color: colors.primary }}
                          title="Salvar os contatos extraídos no Banco de Talentos Geral"
                        >
                          <DatabaseIcon size={13} />
                          <span>Salvar no Banco de Talentos</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Queue Items List with Filter Tabs */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2" style={{ color: colors.textSecondary }}>
                  <span>
                    Fila de Currículos ({batchQueue.length} {batchQueue.length === 1 ? 'currículo' : 'currículos'}):
                  </span>
                  
                  {batchQueue.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBatchQueueFilter('all')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          batchQueueFilter === 'all' ? 'bg-[#881337] text-white border-[#881337]' : 'hover:bg-black/5'
                        }`}
                        style={{ borderColor: batchQueueFilter === 'all' ? undefined : colors.border }}
                      >
                        Todos ({batchQueue.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchQueueFilter('completed')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          batchQueueFilter === 'completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-black/5'
                        }`}
                        style={{ borderColor: batchQueueFilter === 'completed' ? undefined : colors.border }}
                      >
                        Concluídos ({batchQueue.filter(i => i.status === 'completed').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchQueueFilter('pending')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          batchQueueFilter === 'pending' ? 'bg-amber-600 text-white border-amber-600' : 'hover:bg-black/5'
                        }`}
                        style={{ borderColor: batchQueueFilter === 'pending' ? undefined : colors.border }}
                      >
                        Pendentes ({batchQueue.filter(i => i.status === 'pending' || i.status === 'processing').length})
                      </button>
                      {batchQueue.some(i => i.status === 'error') && (
                        <button
                          type="button"
                          onClick={() => setBatchQueueFilter('error')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                            batchQueueFilter === 'error' ? 'bg-rose-600 text-white border-rose-600' : 'hover:bg-black/5'
                          }`}
                          style={{ borderColor: batchQueueFilter === 'error' ? undefined : colors.border }}
                        >
                          Erros ({batchQueue.filter(i => i.status === 'error').length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {batchQueue.length === 0 ? (
                  <div 
                    className="p-8 rounded-2xl border text-center space-y-2"
                    style={{ borderColor: colors.border, backgroundColor: colors.surfaceElevated || colors.background }}
                  >
                    <Layers size={32} className="mx-auto opacity-30" style={{ color: colors.textSecondary }} />
                    <p className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                      Nenhum currículo na fila de processamento.
                    </p>
                    <p className="text-[11px] max-w-xs mx-auto" style={{ color: colors.textSecondary }}>
                      Selecione arquivos acima ou clique nos botões de teste de 3 ou 10 currículos para ver a fila automática com IA & OCR.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {batchQueue
                      .filter(item => {
                        if (batchQueueFilter === 'completed') return item.status === 'completed';
                        if (batchQueueFilter === 'pending') return item.status === 'pending' || item.status === 'processing';
                        if (batchQueueFilter === 'error') return item.status === 'error';
                        return true;
                      })
                      .map((item) => {
                        const originalIndex = batchQueue.findIndex(i => i.id === item.id);
                        const isCompleted = item.status === 'completed';
                        const isProcessing = item.status === 'processing';
                        const isError = item.status === 'error';
                        const contact = item.extractedContact;
                        const isSelected = currentContact && contact && currentContact.id === contact.id;

                        // Calcula em qual lote de 10 este item se enquadra
                        const batchIndex = Math.floor(originalIndex / MAX_BATCH_CONCURRENCY) + 1;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (contact) {
                                setCurrentContact(contact);
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all ${
                              isSelected ? 'ring-2 ring-[#881337]' : ''
                            } ${contact ? 'cursor-pointer hover:border-[#881337]/50' : ''}`}
                            style={{ 
                              backgroundColor: isSelected ? colors.primaryLight : colors.surfaceElevated || colors.background, 
                              borderColor: isSelected ? colors.primary : colors.border 
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span 
                                  className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ 
                                    backgroundColor: isCompleted ? '#10b981' : isProcessing ? '#f59e0b' : colors.primaryLight,
                                    color: isCompleted || isProcessing ? '#fff' : colors.primary 
                                  }}
                                  title={`Item ${originalIndex + 1} • Lote ${batchIndex}`}
                                >
                                  {originalIndex + 1}
                                </span>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold truncate max-w-[200px]" style={{ color: colors.textPrimary }}>
                                      {contact ? contact.fullName : item.fileName}
                                    </span>
                                    {contact && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold border" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                                        {contact.targetRole || 'Profissional'}
                                      </span>
                                    )}
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 font-mono opacity-70">
                                      Lote {batchIndex}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: colors.textSecondary }}>
                                    <span className="truncate max-w-[150px]">{item.fileName}</span>
                                    <span>•</span>
                                    <span>{Math.round(item.fileSize / 1024)} KB</span>
                                    {contact?.address?.city && (
                                      <>
                                        <span>•</span>
                                        <span>📍 {contact.address.city}/{contact.address.state}</span>
                                      </>
                                    )}
                                  </div>

                                  {contact?.phone && (
                                    <div className="text-[11px] font-medium text-emerald-500 mt-0.5">
                                      📞 {contact.phone}
                                    </div>
                                  )}

                                  {item.error && (
                                    <div className="text-[11px] font-medium text-rose-500 mt-0.5">
                                      ⚠️ {item.error}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {isProcessing && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                    <RefreshCw size={10} className="animate-spin" />
                                    <span>Extraindo...</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <Check size={11} />
                                    <span>Concluído</span>
                                  </span>
                                )}
                                {isError && (
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                      <AlertTriangle size={11} />
                                      <span>Erro</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRetrySingleItem(item.id);
                                      }}
                                      className="text-[10px] font-bold text-amber-500 hover:underline"
                                    >
                                      Repetir
                                    </button>
                                  </div>
                                )}
                                {item.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                    <Clock size={11} />
                                    <span>Aguardando</span>
                                  </span>
                                )}

                                {contact && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentContact(contact);
                                    }}
                                    className="text-[10px] font-bold mt-1 hover:underline flex items-center gap-0.5"
                                    style={{ color: colors.primary }}
                                  >
                                    <EyeIcon size={11} />
                                    <span>Ver Dossiê</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'search' && (
            <div 
              className="p-5 lg:p-6 rounded-3xl border shadow-sm space-y-5"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <SearchIcon size={16} color={colors.primary} />
                  <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                    Busca na Internet (Web 360°)
                  </h2>
                </div>
                <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                  LinkedIn • Catho • Empregos • InfoJobs
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                Faça uma varredura pública de candidatos e contatos disponíveis na internet para o cargo e região desejados.
              </p>

              {/* Search Fields */}
              <div className="space-y-3.5">
                {/* Vaga Alvo */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                    Vaga / Cargo Pretendido: <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    placeholder="Ex: Engenheiro de Software, Gerente Comercial, Arquiteto Cloud..."
                    className="w-full text-xs p-2.5 rounded-xl border outline-none font-medium"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  />
                </div>

                {/* Nome do Candidato (Opcional) */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                    Nome do Profissional (Opcional - para busca nominal):
                  </label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira, Mariana Castro..."
                    className="w-full text-xs p-2.5 rounded-xl border outline-none font-medium"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  />
                </div>

                {/* Localização: Estado, Cidade & Bairro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                      Estado (UF):
                    </label>
                    <select
                      value={searchState}
                      onChange={(e) => {
                        const newUf = e.target.value;
                        setSearchState(newUf);
                        const stateObj = BRAZIL_STATES.find(s => s.uf === newUf);
                        if (stateObj && stateObj.cities.length > 0) {
                          setSearchCity(newUf === 'SP' ? 'SÃO PAULO' : stateObj.cities[0]);
                          setSearchNeighborhood('Todos');
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border font-medium outline-none"
                      style={{ 
                        backgroundColor: colors.inputBg || colors.surface, 
                        borderColor: colors.border,
                        color: colors.textPrimary 
                      }}
                    >
                      {BRAZIL_STATES.map(s => (
                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                      Cidade (Padrão: SÃO PAULO):
                    </label>
                    <SearchableSelectDropdown
                      value={searchCity}
                      options={getCitiesByState(searchState)}
                      countLabel={`cidades em ${searchState}`}
                      colors={colors}
                      placeholder="Clique para ver a lista suspensa de cidades"
                      onChange={(newCity) => {
                        setSearchCity(newCity);
                        setSearchNeighborhood('Todos');
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                      Bairro (Padrão: Todos - Busca Global):
                    </label>
                    <SearchableSelectDropdown
                      value={searchNeighborhood}
                      options={getNeighborhoodsByCity(searchState, searchCity)}
                      countLabel={`bairros em ${searchCity}`}
                      colors={colors}
                      placeholder="Clique para ver a lista suspensa de bairros"
                      onChange={(newNeigh) => setSearchNeighborhood(newNeigh)}
                    />
                  </div>
                </div>

                {/* Portais Alvo */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                    Portais Rastreados:
                  </label>
                  <select
                    value={searchPortal}
                    onChange={(e) => setSearchPortal(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border font-medium outline-none"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  >
                    <option value="Web 360° (LinkedIn, Catho, Empregos, InfoJobs)">Web 360° (LinkedIn, Catho, Empregos, InfoJobs)</option>
                    <option value="LinkedIn Profiles & CVs">LinkedIn Profiles & CVs</option>
                    <option value="Catho & Empregos.com.br">Catho & Empregos.com.br</option>
                    <option value="InfoJobs & Gupy">InfoJobs & Gupy</option>
                    <option value="Plataforma Lattes / CNPq (Acadêmico & P&D)">Plataforma Lattes / CNPq (Acadêmico & P&D)</option>
                  </select>
                </div>
              </div>

              {/* Error Box */}
              {searchError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Trigger Search Button */}
              <button
                disabled={isSearchingOnline || !searchRole.trim()}
                onClick={handleOnlineSearch}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)',
                  boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)'
                }}
              >
                {isSearchingOnline ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Varrendo Portais e Extraindo Contatos...</span>
                  </>
                ) : (
                  <>
                    <SearchIcon size={14} />
                    <span>Pesquisar Contatos de Candidatos na Internet</span>
                  </>
                )}
              </button>

              {/* Google Dork Search Helpers */}
              <div className="p-3 rounded-2xl border text-xs space-y-2" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
                <span className="font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                  🌐 Consulta Direta no Google (Dork de Currículos):
                </span>
                <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                  Busque currículos públicos em PDF na web com e-mail e telefone já indexados:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`filetype:pdf ("currículo" OR "curriculum vitae") "${searchRole}" "${searchCity}" "@gmail.com"`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 hover:border-blue-400 text-blue-400 bg-blue-500/5 transition-all"
                  >
                    <span>Google PDF + Gmail</span>
                    <ExternalLinkIcon size={10} />
                  </a>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in/ "${searchRole}" "${searchCity}" "telefone" OR "whatsapp"`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 hover:border-blue-400 text-blue-400 bg-blue-500/5 transition-all"
                  >
                    <span>LinkedIn + Telefone</span>
                    <ExternalLinkIcon size={10} />
                  </a>
                </div>
              </div>

              {/* Search Results Mini-List */}
              {onlineSearchResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                  <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                    Resultados Encontrados ({onlineSearchResults.length}):
                  </span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {onlineSearchResults.map(res => (
                      <button
                        key={res.id}
                        onClick={() => setCurrentContact(res)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          currentContact?.id === res.id ? 'ring-2 ring-[#881337]' : ''
                        }`}
                        style={{ 
                          backgroundColor: colors.surfaceElevated || colors.background, 
                          borderColor: colors.border 
                        }}
                      >
                        <div className="truncate pr-2">
                          <strong className="block truncate" style={{ color: colors.textPrimary }}>
                            {res.fullName}
                          </strong>
                          <span className="text-[11px] truncate block opacity-80" style={{ color: colors.textSecondary }}>
                            {res.targetRole} • {res.address.city}, {res.address.state}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                          {res.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED DATABASE LIST & INTERACTIVE SPREADSHEET */}
          {activeTab === 'database' && (
            <div 
              className="p-5 lg:p-6 rounded-3xl border shadow-sm space-y-4"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <DatabaseIcon size={18} color={colors.primary} />
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <span>Banco de Contatos & Talentos</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#881337]/10 text-[#881337]">
                        {filteredContacts.length} {filteredContacts.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-1.5">
                  {/* View Mode Toggle: Cards vs Grid */}
                  <div className="flex items-center p-0.5 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.surfaceElevated }}>
                    <button
                      onClick={() => setDbViewMode('cards')}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        dbViewMode === 'cards' ? 'bg-[#881337] text-white shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: dbViewMode === 'cards' ? '#fff' : colors.textPrimary }}
                      title="Exibir como cartões verticais"
                    >
                      <DatabaseIcon size={12} />
                      <span>Cartões</span>
                    </button>
                    <button
                      onClick={() => setDbViewMode('grid')}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        dbViewMode === 'grid' ? 'bg-[#881337] text-white shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: dbViewMode === 'grid' ? '#fff' : colors.textPrimary }}
                      title="Exibir como grade / planilha Excel interativa"
                    >
                      <TableIcon size={12} />
                      <span>Grade Excel</span>
                    </button>
                  </div>

                  {/* Export Excel Button */}
                  <button
                    onClick={handleExportAllToExcel}
                    disabled={isExportingExcel || extractedContacts.length === 0}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    title="Exportar base completa para Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={12} />
                    <span>{isExportingExcel ? 'Exportando...' : 'Excel (.xlsx)'}</span>
                  </button>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportAllCsv}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all hover:bg-black/10 opacity-80 hover:opacity-100"
                    style={{ borderColor: colors.border, color: colors.textPrimary }}
                    title="Exportar base em formato CSV"
                  >
                    <Download size={12} />
                    <span>CSV</span>
                  </button>

                  {/* Add Manual Contact */}
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all text-[#881337] border-[#881337]/40 hover:bg-[#881337]/10"
                    title="Cadastrar novo contato manualmente"
                  >
                    <PlusIcon size={12} />
                    <span>Novo</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome, vaga, e-mail, telefone ou cidade..."
                    className="w-full text-xs p-2.5 pl-8 rounded-xl border outline-none"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  />
                  <div className="absolute left-2.5 top-3 opacity-50">
                    <SearchIcon size={14} />
                  </div>
                  {dbSearchQuery && (
                    <button
                      onClick={() => setDbSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* CONTENT VIEW: CARDS OR GRID (EXCEL SPREADSHEET) */}
              {dbViewMode === 'cards' ? (
                /* Card List */
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-xs" style={{ color: colors.textSecondary }}>
                      Nenhum contato encontrado na base. Importe um currículo, planilha Excel ou busque na web!
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        onClick={() => setCurrentContact(contact)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          currentContact?.id === contact.id ? 'ring-2 ring-[#881337] shadow-md' : 'hover:border-[#881337]/50'
                        }`}
                        style={{ 
                          backgroundColor: colors.surfaceElevated || colors.background, 
                          borderColor: colors.border 
                        }}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {contact.photoUrl ? (
                              <img 
                                src={contact.photoUrl} 
                                alt={contact.fullName} 
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-emerald-500/40 shadow-xs" 
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                                style={{ background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)' }}
                              >
                                {contact.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <strong className="block text-sm truncate" style={{ color: colors.textPrimary }}>
                                  {contact.fullName}
                                </strong>
                                {contact.hasPhoto && (
                                  <span className="text-[10px]" title="Foto identificada no currículo">📸</span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-[#881337] block truncate">
                                {contact.targetRole}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#881337]/10 text-[#881337] shrink-0">
                            {contact.address.city}/{contact.address.state}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ borderColor: colors.border }}>
                          <span className="opacity-80 truncate" style={{ color: colors.textSecondary }}>
                            📱 {contact.phone}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSingleContactToExcel(contact);
                                showToast(`Planilha Excel gerada para ${contact.fullName}!`);
                              }}
                              className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-all"
                              title="Exportar este contato para Excel (.xlsx)"
                            >
                              <FileSpreadsheet size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(contact.phone, `db-phone-${contact.id}`, 'Telefone');
                              }}
                              className="p-1 rounded hover:bg-black/10 transition-all"
                              title="Copiar Telefone"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExtractedContacts(prev => prev.filter(c => c.id !== contact.id));
                                if (currentContact?.id === contact.id) {
                                  setCurrentContact(null);
                                }
                                showToast(`Contato removido da base.`);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                              title="Excluir da Base"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Interactive Excel-like Spreadsheet Grid */
                <div className="border rounded-2xl overflow-hidden shadow-inner" style={{ borderColor: colors.border }}>
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead 
                        className="sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider border-b"
                        style={{ 
                          backgroundColor: colors.surfaceHover || colors.surface, 
                          borderColor: colors.border,
                          color: colors.textSecondary 
                        }}
                      >
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Foto</th>
                          <th className="py-2.5 px-3">Nome Completo</th>
                          <th className="py-2.5 px-3">Vaga / Cargo</th>
                          <th className="py-2.5 px-3">E-mail</th>
                          <th className="py-2.5 px-3">Telefone</th>
                          <th className="py-2.5 px-3">Cidade / UF</th>
                          <th className="py-2.5 px-3">Senioridade</th>
                          <th className="py-2.5 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: colors.border }}>
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-xs" style={{ color: colors.textSecondary }}>
                              Nenhum contato encontrado. Importe dados ou utilize a busca na web.
                            </td>
                          </tr>
                        ) : (
                          filteredContacts.map((contact, idx) => (
                            <tr
                              key={contact.id}
                              onClick={() => setCurrentContact(contact)}
                              className={`cursor-pointer transition-colors ${
                                currentContact?.id === contact.id ? 'bg-[#881337]/15 font-semibold' : 'hover:bg-black/5'
                              }`}
                              style={{ 
                                backgroundColor: currentContact?.id === contact.id ? undefined : (idx % 2 === 0 ? colors.surface : colors.surfaceElevated) 
                              }}
                            >
                              <td className="py-2.5 px-3 font-mono opacity-60 text-[10px]">{idx + 1}</td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {contact.photoUrl ? (
                                  <img 
                                    src={contact.photoUrl} 
                                    alt={contact.fullName} 
                                    className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40" 
                                  />
                                ) : (
                                  <div 
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)' }}
                                  >
                                    {contact.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                                <div className="flex items-center gap-1.5">
                                  <span>{contact.fullName}</span>
                                  {currentContact?.id === contact.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#881337]"></span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[#881337] whitespace-nowrap font-medium">
                                {contact.targetRole}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap opacity-80" style={{ color: colors.textSecondary }}>
                                {contact.email}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap opacity-90" style={{ color: colors.textPrimary }}>
                                {contact.phone}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border" style={{ borderColor: colors.border }}>
                                  {contact.address.city}/{contact.address.state}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap opacity-75">
                                {contact.seniority || 'Sênior'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  {/* Direct WhatsApp */}
                                  <a
                                    href={buildWhatsAppUrl(contact.phone.replace(/[^0-9]/g, ''), contact.fullName, contact.targetRole)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-all"
                                    title="Chamar no WhatsApp"
                                  >
                                    <Phone size={12} />
                                  </a>
                                  {/* Direct Email */}
                                  <a
                                    href={buildMailtoUrl(contact.email, contact.fullName, contact.targetRole)}
                                    className="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-all"
                                    title="Enviar E-mail"
                                  >
                                    <Mail size={12} />
                                  </a>
                                  {/* Export Single Contact to Excel */}
                                  <button
                                    onClick={() => {
                                      exportSingleContactToExcel(contact);
                                      showToast(`Planilha Excel exportada: ${contact.fullName}`);
                                    }}
                                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-all"
                                    title="Salvar este contato em Excel (.xlsx)"
                                  >
                                    <FileSpreadsheet size={12} />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => {
                                      setExtractedContacts(prev => prev.filter(c => c.id !== contact.id));
                                      if (currentContact?.id === contact.id) {
                                        setCurrentContact(null);
                                      }
                                      showToast(`Contato removido.`);
                                    }}
                                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                                    title="Excluir"
                                  >
                                    <Trash size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Grid Footer Bar */}
                  <div className="p-2.5 border-t text-[11px] flex items-center justify-between" style={{ borderColor: colors.border, backgroundColor: colors.surfaceHover }}>
                    <span className="opacity-75" style={{ color: colors.textSecondary }}>
                      💡 Clique em qualquer linha para abrir o dossiê executivo completo à direita.
                    </span>
                    <button
                      onClick={handleExportAllToExcel}
                      className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <FileSpreadsheet size={12} />
                      <span>Baixar Planilha Completa (.xlsx)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DOSSIÊ COMPLETO DE CONTATO DO CANDIDATO */}
        <div className="xl:col-span-7 space-y-6">
          {currentContact ? (
            <div 
              className="p-6 lg:p-8 rounded-3xl border shadow-lg space-y-6"
              style={{ 
                backgroundColor: colors.surfaceElevated || colors.surface, 
                borderColor: colors.border 
              }}
            >
              {/* BATCH NAVIGATION BANNER (Quando há fila ativa ou itens no lote) */}
              {batchQueue.length > 0 && (
                <div 
                  className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs"
                  style={{ 
                    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)', 
                    borderColor: colors.primary + '40' 
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Layers size={13} />
                    </span>
                    <div className="truncate">
                      <div className="font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                        <span>Lote de Extração ({batchQueue.length} currículos)</span>
                        {batchQueue.findIndex(i => i.extractedContact?.id === currentContact?.id) !== -1 && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#881337] text-white">
                            Item {batchQueue.findIndex(i => i.extractedContact?.id === currentContact?.id) + 1} de {batchQueue.length}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] truncate block opacity-85" style={{ color: colors.textSecondary }}>
                        Navegue rapidamente entre os candidatos extraídos pelo lote
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={(() => {
                        const completedItems = batchQueue.filter(i => i.extractedContact);
                        const currIdx = completedItems.findIndex(i => i.extractedContact?.id === currentContact?.id);
                        return currIdx <= 0;
                      })()}
                      onClick={() => {
                        const completedItems = batchQueue.filter(i => i.extractedContact);
                        const currIdx = completedItems.findIndex(i => i.extractedContact?.id === currentContact?.id);
                        if (currIdx > 0) {
                          setCurrentContact(completedItems[currIdx - 1].extractedContact!);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl border font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                      style={{ borderColor: colors.border, color: colors.textPrimary }}
                      title="Currículo anterior do lote"
                    >
                      <ArrowLeft size={12} />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <button
                      type="button"
                      disabled={(() => {
                        const completedItems = batchQueue.filter(i => i.extractedContact);
                        const currIdx = completedItems.findIndex(i => i.extractedContact?.id === currentContact?.id);
                        return currIdx === -1 || currIdx >= completedItems.length - 1;
                      })()}
                      onClick={() => {
                        const completedItems = batchQueue.filter(i => i.extractedContact);
                        const currIdx = completedItems.findIndex(i => i.extractedContact?.id === currentContact?.id);
                        if (currIdx !== -1 && currIdx < completedItems.length - 1) {
                          setCurrentContact(completedItems[currIdx + 1].extractedContact!);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl border font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                      style={{ borderColor: colors.border, color: colors.textPrimary }}
                      title="Próximo currículo do lote"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* DOSSIÊ HEADER: Foto/Avatar, Nome, Vaga Alvo e Metadados */}
              <div className="border-b pb-6" style={{ borderColor: colors.border }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Candidate Photo or Avatar Initials Container */}
                    <div className="flex flex-col items-center shrink-0 space-y-1.5">
                      <div className="relative group">
                        {currentContact.photoUrl ? (
                          <div 
                            onClick={() => setSelectedPhotoModal(currentContact.photoUrl!)}
                            className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-md cursor-pointer transition-transform hover:scale-105 relative bg-black/10"
                            title="Clique para visualizar a foto ampliada em alta resolução"
                          >
                            <img 
                              src={currentContact.photoUrl} 
                              alt={currentContact.fullName} 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <EyeIcon size={18} />
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-md"
                            style={{ 
                              background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)',
                              boxShadow: '0 4px 16px rgba(136, 19, 55, 0.4)'
                            }}
                          >
                            {currentContact.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                        )}

                        {/* Hidden input for photo change/upload */}
                        <input 
                          type="file" 
                          ref={candidatePhotoInputRef} 
                          accept="image/*" 
                          onChange={handleCandidatePhotoUpload} 
                          className="hidden" 
                        />
                      </div>

                      {/* Photo status badges and action links */}
                      {currentContact.photoUrl ? (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            onClick={() => candidatePhotoInputRef.current?.click()}
                            className="font-semibold text-emerald-500 hover:underline"
                            title="Substituir foto do candidato"
                          >
                            Trocar
                          </button>
                          <span className="opacity-40">•</span>
                          <button
                            onClick={handleRemoveCandidatePhoto}
                            className="font-semibold text-red-400 hover:underline"
                            title="Remover foto do cadastro"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => candidatePhotoInputRef.current?.click()}
                          className="px-2 py-0.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1 hover:border-emerald-500 text-emerald-400 bg-emerald-500/5 transition-all"
                          style={{ borderColor: colors.border }}
                          title="Fazer upload de uma foto para este candidato"
                        >
                          <CameraIcon size={10} />
                          <span>+ Foto</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: colors.textPrimary }}>
                          {currentContact.fullName}
                        </h2>
                        <button
                          onClick={() => handleCopyText(currentContact.fullName, 'fullName', 'Nome')}
                          className="p-1.5 rounded-lg hover:bg-black/10 transition-all"
                          title="Copiar Nome Completo"
                        >
                          {copiedKey === 'fullName' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* VAGA PRETENDIDA EM DESTAQUE MÁXIMO & STATUS DA FOTO */}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                          style={{ 
                            background: 'linear-gradient(135deg, #881337 0%, #700f2b 100%)' 
                          }}
                        >
                          <Briefcase size={12} />
                          Vaga Alvo: {currentContact.targetRole}
                        </span>

                        {currentContact.hasPhoto && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            📸 Foto Identificada no CV
                          </span>
                        )}

                        {currentContact.seniority && (
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{ borderColor: colors.border, color: colors.textSecondary }}
                          >
                            ⭐ {currentContact.seniority}
                          </span>
                        )}

                        {currentContact.workModel && (
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{ borderColor: colors.border, color: colors.textSecondary }}
                          >
                            🏠 {currentContact.workModel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  <div className="text-right shrink-0">
                    <div className="inline-flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                        Confiança da Extração
                      </span>
                      <span className="text-lg font-black text-emerald-400">
                        {currentContact.extractionConfidence || 98}% ATS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARDS DE CONTATOS OBRIGATÓRIOS (Nome, Email, Telefone, Endereço, Vaga) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* CARD 1: TELEFONE / WHATSAPP - PRECISÃO EXATA DO ARQUIVO */}
                <div 
                  className="p-4 rounded-2xl border space-y-2.5 relative overflow-hidden transition-all hover:border-emerald-500/60 shadow-xs"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                      <Phone size={14} />
                      Telefone & WhatsApp (Fiel ao Arquivo)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditedPhoneValue(currentContact.phone === 'Não informado no currículo' ? '' : currentContact.phone);
                          setIsEditingPhone(!isEditingPhone);
                        }}
                        className="p-1 rounded-lg hover:bg-black/10 transition-all text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
                        title="Editar ou corrigir número manualmente"
                      >
                        <Pencil size={12} />
                        <span className="text-[11px]">Editar</span>
                      </button>

                      <button
                        onClick={() => handleCopyText(currentContact.phone, 'phone', 'Telefone')}
                        className="p-1 rounded-lg hover:bg-black/10 transition-all text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
                      >
                        {copiedKey === 'phone' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="text-[11px]">Copiar</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Phone Edit Mode */}
                  {isEditingPhone ? (
                    <div className="space-y-2 p-2.5 rounded-xl border bg-white/50 dark:bg-zinc-900/60" style={{ borderColor: colors.border }}>
                      <label className="text-[11px] font-bold block" style={{ color: colors.textSecondary }}>
                        Corrigir / Inserir Número com DDD:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedPhoneValue}
                          onChange={(e) => setEditedPhoneValue(e.target.value)}
                          placeholder="(11) 98765-4321"
                          className="flex-1 text-xs p-2 rounded-lg border font-mono font-bold outline-none"
                          style={{ 
                            backgroundColor: colors.inputBg || colors.surface, 
                            borderColor: colors.border,
                            color: colors.textPrimary 
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateContactPhone(editedPhoneValue)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-xs"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setIsEditingPhone(false)}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold border hover:bg-black/10 transition-all"
                          style={{ borderColor: colors.border, color: colors.textSecondary }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="text-base font-black tracking-wide font-mono" style={{ color: colors.textPrimary }}>
                          {currentContact.phone}
                        </div>

                        {currentContact.phone && !currentContact.phone.includes('Não informado') ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check size={10} /> Validado no Documento
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Não Consta no CV
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multiple Alternative Phones in Document Selector */}
                  {currentContactAvailablePhones.length > 1 && (
                    <div className="pt-2 border-t text-xs space-y-1.5" style={{ borderColor: colors.border }}>
                      <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70" style={{ color: colors.textSecondary }}>
                        Outros números de contato detectados no arquivo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentContactAvailablePhones.map((alt, aIdx) => {
                          const isCurrent = currentContact.phone === alt.formatted;
                          return (
                            <button
                              key={aIdx}
                              onClick={() => handleUpdateContactPhone(alt.formatted)}
                              className={`px-2 py-1 rounded-lg text-xs font-mono font-medium border transition-all flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'hover:bg-black/5 opacity-80 hover:opacity-100'
                              }`}
                              style={{ borderColor: colors.border }}
                              title={`Alternar para ${alt.formatted}`}
                            >
                              <Phone size={10} />
                              <span>{alt.formatted}</span>
                              {alt.label && <span className="text-[10px] opacity-70">({alt.label})</span>}
                              {isCurrent && <Check size={10} className="text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action links for phone (WhatsApp & Call) */}
                  <div className="flex items-center gap-2 pt-1">
                    {currentContact.phone && !currentContact.phone.includes('Não informado') ? (
                      <>
                        <a
                          href={buildWhatsAppUrl(currentContact.phone, currentContact.fullName, currentContact.targetRole)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Abrir WhatsApp</span>
                          <ExternalLinkIcon size={12} />
                        </a>

                        <a
                          href={`tel:${getWhatsAppCleanDigits(currentContact.phone)}`}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border hover:bg-black/10 transition-all"
                          style={{ borderColor: colors.border, color: colors.textPrimary }}
                        >
                          Ligar
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditedPhoneValue('');
                          setIsEditingPhone(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center gap-1.5"
                      >
                        <PlusIcon size={12} />
                        <span>Adicionar Número Manualmente</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD 2: E-MAIL DE CONTATO */}
                <div 
                  className="p-4 rounded-2xl border space-y-2 relative overflow-hidden transition-all hover:border-[#881337]"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-blue-400">
                      <Mail size={14} />
                      E-mail Principal
                    </span>
                    <button
                      onClick={() => handleCopyText(currentContact.email, 'email', 'E-mail')}
                      className="p-1 rounded hover:bg-black/10 transition-all text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
                    >
                      {copiedKey === 'email' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>Copiar</span>
                    </button>
                  </div>

                  <div className="text-sm font-black truncate" style={{ color: colors.textPrimary }} title={currentContact.email}>
                    {currentContact.email}
                  </div>

                  {/* Action link for email */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={buildMailtoUrl(currentContact.email, currentContact.fullName, currentContact.targetRole)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Enviar E-mail</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </div>

                {/* CARD 3: ENDEREÇO COMPLETO & LOCALIZAÇÃO */}
                <div 
                  className="md:col-span-2 p-4 rounded-2xl border space-y-2.5 transition-all hover:border-[#881337]"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                      <MapPinIcon size={14} />
                      Endereço Completo & Localização
                    </span>
                    <button
                      onClick={() => handleCopyText(currentContact.address.fullAddress, 'address', 'Endereço')}
                      className="p-1 rounded hover:bg-black/10 transition-all text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
                    >
                      {copiedKey === 'address' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>Copiar Endereço</span>
                    </button>
                  </div>

                  <div className="text-sm font-bold leading-relaxed" style={{ color: colors.textPrimary }}>
                    {currentContact.address.fullAddress}
                  </div>

                  {/* Address Grid Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t" style={{ borderColor: colors.border }}>
                    <div>
                      <span className="text-[10px] uppercase font-bold block" style={{ color: colors.textSecondary }}>Cidade:</span>
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>{currentContact.address.city}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block" style={{ color: colors.textSecondary }}>Estado (UF):</span>
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>{currentContact.address.state}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block" style={{ color: colors.textSecondary }}>Bairro:</span>
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>{currentContact.address.neighborhood || 'Centro / Região'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block" style={{ color: colors.textSecondary }}>CEP:</span>
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>{currentContact.address.postalCode || 'Não informado'}</span>
                    </div>
                  </div>

                  {/* Google Maps Button */}
                  <div className="pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentContact.address.fullAddress)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border hover:border-amber-400 text-amber-400 transition-all"
                      style={{ borderColor: colors.border }}
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </div>

                {/* CARD 4: VAGA ALVO & REMUNERAÇÃO */}
                <div 
                  className="p-4 rounded-2xl border space-y-2 transition-all"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5 text-[#881337]">
                    <Briefcase size={14} />
                    Vaga Pretendida & Enquadramento
                  </span>

                  <div className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                    {currentContact.targetRole}
                  </div>

                  <div className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                    <div>💰 Pretensão Salarial: <strong>{currentContact.salaryExpectation || 'Compatível com Mercado'}</strong></div>
                    <div>🏢 Empresa Recente: <strong>{currentContact.recentCompany || 'Experiência Relevante'}</strong></div>
                  </div>
                </div>

                {/* CARD 5: REDES & PORTFÓLIO */}
                <div 
                  className="p-4 rounded-2xl border space-y-2 transition-all"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5 text-purple-400">
                    <ExternalLinkIcon size={14} />
                    Redes & Portfólio
                  </span>

                  <div className="space-y-1.5 text-xs">
                    {currentContact.linkedinUrl ? (
                      <a
                        href={currentContact.linkedinUrl.startsWith('http') ? currentContact.linkedinUrl : `https://${currentContact.linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:underline font-semibold truncate block"
                      >
                        <span>LinkedIn: {currentContact.linkedinUrl.replace('https://', '').replace('http://', '')}</span>
                        <ExternalLinkIcon size={10} />
                      </a>
                    ) : (
                      <span className="text-xs opacity-70" style={{ color: colors.textSecondary }}>LinkedIn não informado</span>
                    )}

                    {currentContact.portfolioUrl && (
                      <a
                        href={currentContact.portfolioUrl.startsWith('http') ? currentContact.portfolioUrl : `https://${currentContact.portfolioUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-emerald-400 hover:underline font-semibold truncate block"
                      >
                        <span>Portfólio: {currentContact.portfolioUrl.replace('https://', '')}</span>
                        <ExternalLinkIcon size={10} />
                      </a>
                    )}
                  </div>
                </div>

              </div>

              {/* RESUMO PROFISSIONAL */}
              {currentContact.professionalSummary && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: colors.textSecondary }}>
                    Resumo Profissional / Pitch Executivo:
                  </span>
                  <p className="text-xs leading-relaxed p-3.5 rounded-2xl border font-sans" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    {currentContact.professionalSummary}
                  </p>
                </div>
              )}

              {/* COMPETÊNCIAS PRINCIPAIS */}
              {currentContact.keySkills && currentContact.keySkills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: colors.textSecondary }}>
                    Competências & Hard Skills Identificadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentContact.keySkills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border"
                        style={{ 
                          backgroundColor: colors.surfaceHover, 
                          borderColor: colors.border,
                          color: colors.textPrimary 
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BAR: WHATSAPP, EMAIL, VCARD, PDF, PIPELINE */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
                <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                  Ações Rápidas & Exportações Executivas:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Export Excel (.xlsx) */}
                  <button
                    onClick={handleExportCurrentToExcel}
                    className="p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-sm"
                    style={{ borderColor: colors.border }}
                    title="Exportar dados cadastrais completos deste candidato para planilha Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Salvar em Excel</span>
                  </button>

                  {/* Export vCard */}
                  <button
                    onClick={handleExportVCard}
                    className="p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:border-emerald-400 text-emerald-400 bg-emerald-500/5 shadow-sm"
                    style={{ borderColor: colors.border }}
                    title="Baixar arquivo .vcf para importar na agenda do celular / Google Contacts"
                  >
                    <Download size={14} />
                    <span>Salvar Celular (.vcf)</span>
                  </button>

                  {/* Export PDF Dossier */}
                  <button
                    onClick={handleExportPdf}
                    className="p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:border-rose-400 text-rose-400 bg-rose-500/5 shadow-sm"
                    style={{ borderColor: colors.border }}
                    title="Exportar Dossiê Executivo de Contato em PDF"
                  >
                    <Download size={14} />
                    <span>Dossiê PDF</span>
                  </button>

                  {/* Copy Complete Text */}
                  <button
                    onClick={handleCopyFullDossier}
                    className="p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:bg-black/10"
                    style={{ borderColor: colors.border, color: colors.textPrimary }}
                    title="Copiar todos os dados para colar no Slack, Teams ou ATS"
                  >
                    <Copy size={14} />
                    <span>Copiar Dossiê</span>
                  </button>

                  {/* Add to Pipeline */}
                  <button
                    onClick={handleAddToPipeline}
                    className="p-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)',
                    }}
                    title="Cadastrar candidatura no Painel de Vagas"
                  >
                    <Briefcase size={14} />
                    <span>Ao Pipeline</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 opacity-70" style={{ color: colors.textSecondary }}>
                  <span>Origem: {currentContact.sourceName || 'Importação de Arquivo'}</span>
                  <span>ID: {currentContact.id}</span>
                </div>
              </div>

            </div>
          ) : (
            <div 
              className="p-12 rounded-3xl border text-center space-y-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <ContactIcon size={36} color={colors.primary} />
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                Nenhum Contato Selecionado
              </h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: colors.textSecondary }}>
                Faça o upload de um currículo, cole um texto ou realize uma busca online para gerar o dossiê completo de contatos.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: CADASTRO MANUAL DE CONTATO NO BANCO DE DADOS */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 lg:p-7 space-y-5"
            style={{ 
              backgroundColor: colors.surfaceElevated || colors.surface, 
              borderColor: colors.border 
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#881337]/10 text-[#881337]">
                  <ContactIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    Novo Contato para o Banco de Dados
                  </h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Adicione um registro manualmente à base de talentos e à planilha Excel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-1.5 rounded-lg border hover:bg-black/10 text-xs opacity-70 hover:opacity-100"
                style={{ borderColor: colors.border }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualContact} className="space-y-4 text-xs">
              {/* Photo Upload for Manual Contact */}
              <div className="p-3 rounded-2xl border flex items-center justify-between gap-3" style={{ borderColor: colors.border, backgroundColor: colors.surfaceHover }}>
                <div className="flex items-center gap-3">
                  {manualPhoto ? (
                    <img 
                      src={manualPhoto} 
                      alt="Pré-visualização" 
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/50 shadow-sm" 
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                      style={{ background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)' }}
                    >
                      <CameraIcon size={20} />
                    </div>
                  )}
                  <div>
                    <span className="font-bold block" style={{ color: colors.textPrimary }}>
                      Foto do Candidato (Opcional)
                    </span>
                    <span className="text-[11px] block" style={{ color: colors.textSecondary }}>
                      {manualPhoto ? 'Fotografia carregada com sucesso' : 'Selecione uma imagem (.jpg, .png, .webp)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={manualPhotoInputRef} 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setManualPhoto(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => manualPhotoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border font-bold text-[11px] hover:border-emerald-500 text-emerald-400 bg-emerald-500/5 transition-all"
                    style={{ borderColor: colors.border }}
                  >
                    {manualPhoto ? 'Trocar Foto' : 'Selecionar Foto'}
                  </button>
                  {manualPhoto && (
                    <button
                      type="button"
                      onClick={() => setManualPhoto(null)}
                      className="p-1.5 rounded-xl border text-red-400 hover:bg-red-500/10 transition-all"
                      style={{ borderColor: colors.border }}
                      title="Remover foto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newContactForm.fullName}
                    onChange={(e) => setNewContactForm({ ...newContactForm, fullName: e.target.value })}
                    placeholder="Ex: Dra. Mariana Vasconcellos"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Vaga Alvo / Pretensão *</label>
                  <input
                    type="text"
                    required
                    value={newContactForm.targetRole}
                    onChange={(e) => setNewContactForm({ ...newContactForm, targetRole: e.target.value })}
                    placeholder="Ex: Gerente de Projetos Sênior"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>E-mail Principal</label>
                  <input
                    type="email"
                    value={newContactForm.email}
                    onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                    placeholder="mariana.vasconcellos@empresa.com"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={newContactForm.phone}
                    onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Estado (UF)</label>
                  <select
                    value={newContactForm.state}
                    onChange={(e) => {
                      const newUf = e.target.value;
                      const cities = getCitiesByState(newUf);
                      const defaultCity = newUf === 'SP' ? 'SÃO PAULO' : (cities[0] || 'São Paulo');
                      const neighs = getNeighborhoodsByCity(newUf, defaultCity);
                      setNewContactForm({
                        ...newContactForm,
                        state: newUf,
                        city: defaultCity,
                        neighborhood: neighs.includes('Centro') ? 'Centro' : (neighs[0] || 'Centro')
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    {BRAZIL_STATES.map(s => (
                      <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Cidade (Padrão: SÃO PAULO)</label>
                  <SearchableSelectDropdown
                    value={newContactForm.city}
                    options={getCitiesByState(newContactForm.state)}
                    countLabel={`cidades em ${newContactForm.state}`}
                    colors={colors}
                    placeholder="Clique para ver a lista suspensa de cidades"
                    onChange={(newCity) => {
                      const neighs = getNeighborhoodsByCity(newContactForm.state, newCity);
                      setNewContactForm({
                        ...newContactForm,
                        city: newCity,
                        neighborhood: neighs.includes('Centro') ? 'Centro' : (neighs[0] || 'Centro')
                      });
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>CEP</label>
                  <input
                    type="text"
                    value={newContactForm.postalCode}
                    onChange={(e) => setNewContactForm({ ...newContactForm, postalCode: e.target.value })}
                    placeholder="01310-100"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Bairro (Padrão: Centro)</label>
                  <SearchableSelectDropdown
                    value={newContactForm.neighborhood}
                    options={getNeighborhoodsByCity(newContactForm.state, newContactForm.city)}
                    countLabel={`bairros em ${newContactForm.city}`}
                    colors={colors}
                    placeholder="Clique para ver a lista suspensa de bairros"
                    onChange={(newNeigh) => setNewContactForm({ ...newContactForm, neighborhood: newNeigh })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Logradouro / Rua</label>
                  <input
                    type="text"
                    value={newContactForm.street}
                    onChange={(e) => setNewContactForm({ ...newContactForm, street: e.target.value })}
                    placeholder="Av. Paulista, 1000"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Senioridade</label>
                  <select
                    value={newContactForm.seniority}
                    onChange={(e) => setNewContactForm({ ...newContactForm, seniority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    <option value="Júnior">Júnior</option>
                    <option value="Pleno">Pleno</option>
                    <option value="Sênior">Sênior</option>
                    <option value="Especialista">Especialista</option>
                    <option value="Liderança / C-Level">Liderança / C-Level</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Modelo de Trabalho</label>
                  <select
                    value={newContactForm.workModel}
                    onChange={(e) => setNewContactForm({ ...newContactForm, workModel: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Indiferente">Indiferente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block" style={{ color: colors.textPrimary }}>Pretensão Salarial</label>
                  <input
                    type="text"
                    value={newContactForm.salaryExpectation}
                    onChange={(e) => setNewContactForm({ ...newContactForm, salaryExpectation: e.target.value })}
                    placeholder="R$ 15.000 / CLT"
                    className="w-full p-2.5 rounded-xl border outline-none"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block" style={{ color: colors.textPrimary }}>LinkedIn URL</label>
                <input
                  type="text"
                  value={newContactForm.linkedinUrl}
                  onChange={(e) => setNewContactForm({ ...newContactForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/mariana-vasconcellos"
                  className="w-full p-2.5 rounded-xl border outline-none"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block" style={{ color: colors.textPrimary }}>Resumo Profissional</label>
                <textarea
                  rows={2}
                  value={newContactForm.professionalSummary}
                  onChange={(e) => setNewContactForm({ ...newContactForm, professionalSummary: e.target.value })}
                  placeholder="Breve resumo da trajetória e diferenciais do candidato..."
                  className="w-full p-2.5 rounded-xl border outline-none"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: colors.border }}>
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-black/10 transition-all"
                  style={{ borderColor: colors.border, color: colors.textPrimary }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)' }}
                >
                  Salvar no Banco de Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAÇÃO AMPLIADA DA FOTO DO CANDIDATO */}
      {selectedPhotoModal && (
        <div 
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl overflow-hidden border shadow-2xl p-6 space-y-4 cursor-default text-center"
            style={{ 
              backgroundColor: colors.surfaceElevated || colors.surface, 
              borderColor: colors.border 
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2">
                <CameraIcon size={16} color={colors.primary} />
                <h4 className="text-sm font-bold truncate" style={{ color: colors.textPrimary }}>
                  {currentContact?.fullName} • Fotografia do Currículo
                </h4>
              </div>
              <button 
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1 rounded-lg border hover:bg-black/10 text-xs"
                style={{ borderColor: colors.border }}
              >
                ✕
              </button>
            </div>

            <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-lg bg-black/20">
              <img 
                src={selectedPhotoModal} 
                alt={currentContact?.fullName || 'Foto do Candidato'} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={selectedPhotoModal}
                download={`Foto_${currentContact?.fullName ? currentContact.fullName.replace(/\s+/g, '_') : 'Candidato'}.jpg`}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Baixar Fotografia</span>
              </a>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-black/10 transition-all"
                style={{ borderColor: colors.border, color: colors.textPrimary }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
