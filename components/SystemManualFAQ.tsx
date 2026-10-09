// components/SystemManualFAQ.tsx
// Manual Completo e FAQ Interativo do Sistema CV-AutoPilot
// Conduzido pedagogicamente pelo Professor Sênior em Tecnologia & Engenharia de Carreiras
import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  Download,
  FileText,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  FileCheck,
  Briefcase,
  Users,
  Compass,
  Mic,
  DollarSign,
  History,
  Laptop,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Check,
  X
} from 'lucide-react';
import { generateSystemManualPdf } from '../services/systemManualPdfService';
import { generateSystemManualPptx } from '../services/systemManualPptxService';
import { downloadHyperpromptWord } from '../services/hyperpromptDocxService';

interface SystemManualFAQProps {
  colors: any;
  theme: string;
  onNavigateToView: (view: any) => void;
}

export const SystemManualFAQ: React.FC<SystemManualFAQProps> = ({
  colors,
  theme,
  onNavigateToView
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'manual' | 'faq' | 'glossary'>('manual');
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [faqSelectedCategory, setFaqSelectedCategory] = useState<string>('all');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Lista detalhada de todas as 11 telas e funcionalidades do sistema
  const screensCatalog = useMemo(() => [
    {
      id: 'cv-manager',
      routeView: 'cv-manager',
      navName: '01. Gerenciador de CVs',
      title: 'Gerenciador de Currículos (CV Manager)',
      badge: 'Base de Dados & ATS Master',
      icon: <FileText size={20} />,
      summary: 'Upload de currículos (.docx, .pdf, .txt), múltiplos perfis, versionamento e cálculo prévio de compatibilidade ATS.',
      objective: 'Cadastrar, centralizar e auditar seu perfil profissional, definindo o "Currículo Master" que servirá de alicerce para todas as automações e diagnósticos de IA do sistema.',
      mockupElements: [
        { label: '+ Adicionar Currículo', type: 'btn', highlight: true },
        { label: 'Importar .DOCX / .PDF', type: 'input' },
        { label: 'Definir como Master', type: 'badge' },
        { label: 'Exportar em PDF Único', type: 'btn', highlight: true },
        { label: 'Auditoria de Termos ATS', type: 'stat' },
        { label: 'Exportar PDF Corporativo', type: 'btn' }
      ],
      features: [
        'Upload com parser inteligente capaz de ler arquivos .DOCX, .PDF e .TXT sem corromper formatação.',
        'Extração automática de nome, cargo atual, contatos, resumo executivo e histórico de empregos.',
        'Exportação em Lote em Arquivo Único (.PDF): Consolida múltiplos currículos selecionados em um dossiê executivo unificado com capa, sumário dinâmico e paginação contínua.',
        'Mapeamento de densidade semântica para os principais motores ATS (Workday, Taleo, Greenhouse, Lever).',
        'Exportação em PDF de alta conversão visual calibrado para impressão e leitura óptica.',
        'Sincronização e backup automático com histórico de versões local e na nuvem.'
      ],
      stepByStep: [
        { step: 1, action: 'Acesse o módulo "Gerenciador de Currículos" no menu lateral.' },
        { step: 2, action: 'Clique no botão "+ Adicionar Novo Currículo" ou arraste seu arquivo existente para a área de upload.' },
        { step: 3, action: 'Revise os dados extraídos automaticamente pela IA e confirme o cargo pretendido.' },
        { step: 4, action: 'Defina este currículo como "Master". Ele será usado como base no Disparador de Vagas e no Simulador.' },
        { step: 5, action: 'Para unir múltiplos perfis em um único documento, marque as caixas de seleção e clique em "Exportar em PDF Único".' },
        { step: 6, action: 'Clique em "Exportar PDF" sempre que precisar de uma cópia limpa e aprovada para envio manual.' }
      ],
      goldenTip: 'Crie pelo menos dois perfis: um com foco em Liderança Executiva/Gestão e outro focado em Especialista Técnico. Essa segmentação dobra sua taxa de retorno nas vagas da internet.',
      avoidMistake: 'Evite salvar currículos com formatações com tabelas duplas ou colunas complexas de terceiros; nosso exportador já gera o padrão ideal para leitura de máquina (ATS 99%).'
    },
    {
      id: 'cv-dispatcher',
      routeView: 'cv-dispatcher',
      navName: '02. Disparador & Radar Web',
      title: 'Disparador Automático de Currículo (IA) & Radar Web',
      badge: 'Varredura por Palavra-Chave & Região',
      icon: <Send size={20} />,
      summary: 'Varredura 360° em fontes reais (sem API) e Piloto Automático integrado baseado em CopiVaga, VagaAutomática, Loopcv e JobCopilot (20 a 50 envios/dia).',
      objective: 'Localizar em tempo real oportunidades de emprego em fontes reais e aplicar com piloto multicanais: calibração ATS, grandes empresas corporativas, rastreador de respostas e descoberta direta de Hiring Managers.',
      mockupElements: [
        { label: 'Piloto Automático 360°', type: 'tab', highlight: true },
        { label: 'Benchmark: CopiVaga, VagaAutomática, Loopcv, JobCopilot', type: 'card', highlight: true },
        { label: 'Radar de Varredura Web (IA)', type: 'tab' },
        { label: 'Palavra-Chave (Cargo/Empresa)', type: 'input' },
        { label: 'Região (SP, RJ, Curitiba, Remoto)', type: 'select' },
        { label: 'Cota Diária (20 a 50 candidaturas)', type: 'slider' },
        { label: 'Iniciar Ciclo do Piloto', type: 'btn', highlight: true }
      ],
      features: [
        'Piloto Automático Multicanais: 20 a 50 envios por dia com proteção e cadência inteligente.',
        'Tecnologia CopiVaga: Otimização de palavras-chave para passar pelos filtros de RH (ATS) com match 95%+.',
        'Tecnologia VagaAutomática: Foco prioritário em mais de 60 grandes empresas e unicórnios nacionais com alta velocidade.',
        'Tecnologia Loopcv: Integração multi-painéis (+30 ATS) e rastreador de respostas com tickets Kanban automáticos.',
        'Tecnologia JobCopilot: Descoberta de e-mails diretos de Hiring Managers e Talent Acquisition em +500.000 páginas oficiais.',
        'Varredura 360° em Fontes Reais (Zero API): Links diretos para LinkedIn, Gupy, Catho, Indeed, Google Jobs e sites de carreiras.',
        'Disparo por E-mail Executivo & Auto-preenchimento de formulários calibrado por cargo e região.'
      ],
      stepByStep: [
        { step: 1, action: 'Abra o "Disparador de Currículo (IA)" e clique na primeira aba: "Radar de Varredura Web (IA)".' },
        { step: 2, action: 'Digite o cargo pretendido (ex: "Tech Lead") ou a empresa contratante (ex: "Mercado Livre").' },
        { step: 3, action: 'Selecione a região alvo (ex: São Paulo - SP, Home Office / Remoto ou sua cidade).' },
        { step: 4, action: 'Clique em "Fazer Varredura Completa". A IA listará as vagas com empresas, salários e score ATS.' },
        { step: 5, action: 'Escolha "Disparar E-mail", "Preencher Vaga" ou utilize o "Multi-Disparo Automático" para salvar todas.' }
      ],
      goldenTip: 'Se você busca uma corporação específica (ex: Itaú, Stone, Nubank), digite o nome dela: o radar focará exclusivamente nas posições abertas daquela empresa.',
      avoidMistake: 'Não dispare sem revisar o currículo selecionado: certifique-se de que o currículo Master está com seus contatos e telefone atualizados.'
    },
    {
      id: 'dashboard',
      routeView: 'dashboard',
      navName: '03. Painel Kanban & Vagas',
      title: 'Painel de Controle & Kanban de Candidaturas',
      badge: 'Esteira de Acompanhamento Executivo',
      icon: <Briefcase size={20} />,
      summary: 'Gestão visual do funil seletivo (Salvas, Aplicou, Entrevistas, Propostas), gráficos semanais e follow-up.',
      objective: 'Garantir disciplina e governança na sua busca por recolocação, organizando todas as candidaturas e emitindo lembretes para recontatar os recrutadores no momento exato.',
      mockupElements: [
        { label: 'Kanban: Salvas (5)', type: 'tab' },
        { label: 'Aplicou (12)', type: 'tab', highlight: true },
        { label: 'Entrevistas (3)', type: 'tab' },
        { label: 'Gráfico Semanal de Retorno', type: 'stat' },
        { label: 'Exportar Planilha Excel', type: 'btn' }
      ],
      features: [
        'Quadro Kanban interativo dividido em: Vagas Salvas, Aplicadas, Em Triagem/Entrevista, Propostas e Recusadas.',
        'Lembretes automáticos de Follow-up calculados para o 5º dia útil após a aplicação.',
        'Gráficos analíticos de evolução semanal e comparativos de desempenho por mês.',
        'Exportação completa da base de candidaturas em planilha Excel (.xlsx) e relatório executivo em PDF.'
      ],
      stepByStep: [
        { step: 1, action: 'Acesse o "Painel de Vagas" para visualizar suas candidaturas em formato de cartões.' },
        { step: 2, action: 'Arraste os cartões entre as colunas conforme o recrutador agendar entrevistas ou fizer contato.' },
        { step: 3, action: 'Verifique a etiqueta de "Follow-up" no cartão para saber a data ideal de recontatar a empresa.' },
        { step: 4, action: 'Clique em "Exportar Excel" para guardar um backup completo da sua prospecção de carreira.' }
      ],
      goldenTip: 'Candidatos que enviam uma mensagem cortês de acompanhamento no 5º dia útil aumentam em 400% a probabilidade de serem chamados para a entrevista.',
      avoidMistake: 'Evite deixar candidaturas estagnadas na coluna "Aplicou": se após 15 dias não houver retorno após o follow-up, mova para arquivadas e foque em novas vagas do radar.'
    },
    {
      id: 'contact-extractor',
      routeView: 'contact-extractor',
      navName: '04. Extrator de Contatos',
      title: 'Extrator Inteligente de Contatos de RH & Recrutadores',
      badge: 'Prospecção Direta de Headhunters',
      icon: <Users size={20} />,
      summary: 'Extração automática de e-mails, telefones, WhatsApp e LinkedIn a partir de anúncios brutos de vagas.',
      objective: 'Identificar os responsáveis diretos pela contratação a partir de textos de vagas, permitindo uma abordagem consultiva e direcionada diretamente ao recrutador.',
      mockupElements: [
        { label: 'Colar Texto da Vaga', type: 'input' },
        { label: 'Extrair Contatos com IA', type: 'btn', highlight: true },
        { label: 'Tabela de E-mails e WhatsApp', type: 'stat' },
        { label: 'Chamar no WhatsApp Web', type: 'btn' },
        { label: 'Baixar Contatos em Excel', type: 'btn' }
      ],
      features: [
        'Filtros heurísticos que removem e-mails genéricos de suporte e focam no time de Talent Acquisition.',
        'Higienização de números para padrão internacional WhatsApp (+55 DD 9XXXX-XXXX).',
        'Exportação da lista gerada em planilha Excel (.xlsx) e catálogo corporativo em PDF.',
        'Abertura direta de conversa no WhatsApp Web com mensagem de apresentação profissional pré-formatada.'
      ],
      stepByStep: [
        { step: 1, action: 'Copie o texto de um anúncio do LinkedIn, post corporativo ou e-mail de vaga.' },
        { step: 2, action: 'Cole na caixa de texto do "Extrator de Contatos de RH" e clique em "Extrair Contatos com IA".' },
        { step: 3, action: 'Confira os e-mails, nomes dos recrutadores e telefones identificados na tabela.' },
        { step: 4, action: 'Clique no botão de WhatsApp para iniciar o contato ou baixe a planilha para seu CRM pessoal.' }
      ],
      goldenTip: 'Nunca inicie a conversa no WhatsApp apenas com um "Oi". Use nossa mensagem sugerida que cita o cargo exato e resume suas principais credenciais em duas linhas.',
      avoidMistake: 'Não dispare mensagens em horários inconvenientes: contatos no WhatsApp corporativo devem ser feitos exclusivamente em dias úteis entre 9h e 18h.'
    },
    {
      id: 'job-tailored-cv',
      routeView: 'job-tailored-cv',
      navName: '05. Otimizador de CV',
      title: 'Otimizador de CV Sob Medida (Tailored Builder)',
      badge: 'Calibração Fina para Filtros ATS',
      icon: <Sparkles size={20} />,
      summary: 'Reescrita cirúrgica de palavras-chave e tópicos do currículo para obter nota máxima em filtros ATS.',
      objective: 'Ajustar semântica e tecnicamente seu currículo para que ele atenda 100% aos requisitos de um anúncio específico, eliminando termos descartados pelos robôs de triagem.',
      mockupElements: [
        { label: 'Currículo Base Selecionado', type: 'select' },
        { label: 'Colar Requisitos da Vaga', type: 'input' },
        { label: 'Calibrar Palavras-Chave ATS', type: 'btn', highlight: true },
        { label: 'Visualizar Versão Adaptada', type: 'stat' },
        { label: 'Baixar CV Sob Medida', type: 'btn' }
      ],
      features: [
        'Alinhamento com diretrizes de Workday, Taleo, Greenhouse, Lever e SAP SuccessFactors.',
        'Inserção semântica das competências e metodologias exigidas na vaga alvo.',
        'Preservação estrita da veracidade do histórico do candidato sem criar dados fictícios.',
        'Exportação imediata do novo currículo calibrado com diagramação limpa e moderna.'
      ],
      stepByStep: [
        { step: 1, action: 'Selecione o currículo que deseja utilizar como base.' },
        { step: 2, action: 'Cole o texto completo da descrição da vaga pretendida no campo indicado.' },
        { step: 3, action: 'Clique em "Otimizar Currículo Sob Medida". O motor de IA reescreverá os tópicos pertinentes.' },
        { step: 4, action: 'Revise os ajustes sugeridos e baixe a nova versão otimizada pronta para submissão.' }
      ],
      goldenTip: 'Submeter um currículo adaptado para a vaga multiplica sua chance de convocação por 8 em comparação com o envio de um currículo genérico.',
      avoidMistake: 'Evite aceitar sugestões da IA que citem tecnologias que você nunca utilizou na prática: a IA deve realçar suas experiências reais, nunca inventar competências.'
    },
    {
      id: 'job-analyzer',
      routeView: 'job-analyzer',
      navName: '06. Diagnóstico de Vaga',
      title: 'Diagnóstico de Compatibilidade (Job Match Analyzer)',
      badge: 'Score Percentual & Gap Analysis',
      icon: <Compass size={20} />,
      summary: 'Score numérico (0 a 100%), levantamento de lacunas e recomendações de mitigação de requisitos.',
      objective: 'Saber com precisão matemática sua probabilidade de aprovação antes de se candidatar, descobrindo quais competências faltam e como defendê-las na entrevista.',
      mockupElements: [
        { label: 'Selecionar Perfil do Candidato', type: 'select' },
        { label: 'Colar Anúncio da Posição', type: 'input' },
        { label: 'Executar Diagnóstico', type: 'btn', highlight: true },
        { label: 'Score: 92% de Aderência', type: 'badge' },
        { label: 'Lista de Gaps & Recomendações', type: 'stat' }
      ],
      features: [
        'Cálculo do percentual de Match Score (0 a 100%) entre seu currículo e a descrição da vaga.',
        'Classificação analítica: Requisitos Mandatórios atendidos vs. Requisitos Desejáveis pendentes.',
        'Identificação de lacunas críticas (ferramentas, anos de liderança ou certificações faltantes).',
        'Plano de ação e respostas estratégicas para contornar objeções do recrutador.'
      ],
      stepByStep: [
        { step: 1, action: 'Selecione o currículo e insira a descrição completa da vaga pretendida.' },
        { step: 2, action: 'Clique em "Executar Diagnóstico de Compatibilidade".' },
        { step: 3, action: 'Analise a nota geral de compatibilidade e a relação de pontos fortes identificados.' },
        { step: 4, action: 'Se o score for > 75%, avance para o Disparador; se for menor, utilize o Otimizador de CV.' }
      ],
      goldenTip: 'Scores acima de 80% passam direto pelos filtros automatizados de RH. Acima de 90%, você estará no grupo seleto dos 5% melhores candidatos avaliados.',
      avoidMistake: 'Não desista de uma vaga se o score estiver entre 70% e 80%: empresas costumam listar "requisitos dos sonhos", mas contratam quem atende aos mandatórios.'
    },
    {
      id: 'ai-tools',
      routeView: 'ai-tools',
      navName: '07. Simulador por Voz',
      title: 'Simulador de Entrevistas por Voz (Dra. Valéria)',
      badge: 'Treinamento Verbal pelo Método STAR',
      icon: <Mic size={20} />,
      summary: 'Treinamento oral em tempo real com a Headhunter Virtual, com perguntas técnicas e comportamentais.',
      objective: 'Destravar sua comunicação verbal e eliminar a ansiedade da entrevista real, treinando respostas estruturadas pelo consagrado método STAR (Situação, Tarefa, Ação e Resultado).',
      mockupElements: [
        { label: 'Dra. Valéria Silveira (Headhunter)', type: 'badge' },
        { label: 'Conectar Microfone', type: 'btn' },
        { label: 'Iniciar Simulação de Voz', type: 'btn', highlight: true },
        { label: 'Ouvir Pergunta & Responder (STAR)', type: 'stat' },
        { label: 'Relatório Executivo de Feedback', type: 'btn' }
      ],
      features: [
        'Interação oral bidirecional em tempo real com áudio nativo sintetizado.',
        'Perguntas adaptadas à senioridade da sua posição (Júnior, Pleno, Sênior, Tech Lead ou Diretoria).',
        'Avaliação rigorosa pelo Método STAR: Contexto, Desafio, Execução e Métrica Alcançada.',
        'Relatório de feedback executivo com notas de clareza, concisão e poder de persuasão.'
      ],
      stepByStep: [
        { step: 1, action: 'Conecte seu microfone e clique em "Iniciar Simulação de Entrevista".' },
        { step: 2, action: 'Ouça atentamente a pergunta formulada pela Dra. Valéria Silveira.' },
        { step: 3, action: 'Responda pausadamente estruturando sua fala em Situação, Tarefa, Ação e Resultado.' },
        { step: 4, action: 'Aguarde o feedback imediato da IA e continue a sessão até obter o relatório final.' }
      ],
      goldenTip: 'Sempre mencione números na parte "Resultado" do método STAR: "% de custo reduzido", "dias economizados" ou "faturamento gerado" encantam qualquer headhunter.',
      avoidMistake: 'Evite respostas que fiquem presas apenas na teoria ("eu acho", "nós pensamos"): recrutadores querem ouvir ações práticas lideradas por você ("eu fiz", "eu arquitetei").'
    },
    {
      id: 'personal-swot',
      routeView: 'personal-swot',
      navName: '08. SWOT de Carreira',
      title: 'Análise SWOT Pessoal de Carreira',
      badge: 'Posicionamento Estratégico & Dossiê',
      icon: <Compass size={20} />,
      summary: 'Matriz Forças, Fraquezas, Oportunidades e Ameaças com exportação de Dossiê Executivo em PDF.',
      objective: 'Mapear com visão analítica seu posicionamento de carreira, identificando como suas competências se encaixam nas oportunidades mais bem remuneradas do mercado.',
      mockupElements: [
        { label: 'Selecionar Perfil Profissional', type: 'select' },
        { label: 'Gerar Matriz SWOT Pessoal', type: 'btn', highlight: true },
        { label: 'Forças (Strengths) & Oportunidades', type: 'stat' },
        { label: 'Fraquezas & Plano de Mitigação', type: 'stat' },
        { label: 'Exportar Dossiê Executivo em PDF', type: 'btn' }
      ],
      features: [
        'Matriz analítica 2x2 cruzando ambiente interno (competências) com mercado externo.',
        'Estratégias de Alavancagem: Como utilizar suas Forças para capturar Oportunidades emergentes.',
        'Estratégias de Mitigação: Como blindar sua carreira contra Ameaças como saturação ou IA.',
        'Exportação de Dossiê Executivo em PDF diagramado em alta resolução para orientar seu PDI.'
      ],
      stepByStep: [
        { step: 1, action: 'Acesse "SWOT Pessoal" e selecione seu currículo base.' },
        { step: 2, action: 'Clique em "Gerar Matriz SWOT Pessoal" para iniciar o diagnóstico.' },
        { step: 3, action: 'Examine detalhadamente os quadrantes de Forças, Fraquezas, Oportunidades e Ameaças.' },
        { step: 4, action: 'Exporte o Dossiê Executivo em PDF para acompanhar seu plano de crescimento anual.' }
      ],
      goldenTip: 'Na entrevista, sua maior Fraqueza deve ser declarada com naturalidade, acompanhada do plano prático de estudos ou certificação que você já iniciou para superá-la.',
      avoidMistake: 'Não ignore as Ameaças apontadas na matriz: se o mercado está exigindo Cloud e IA no seu cargo, comece hoje mesmo a se capacitar nessas frentes.'
    },
    {
      id: 'salary-benchmark',
      routeView: 'salary-benchmark',
      navName: '09. Benchmarking Salarial',
      title: 'Benchmarking Salarial Regionalizado',
      badge: 'Remuneração Real com Search Grounding',
      icon: <DollarSign size={20} />,
      summary: 'Pesquisa salarial em tempo real com Search Grounding por cargo, senioridade e região geográfica.',
      objective: 'Descobrir a remuneração exata praticada no mercado brasileiro por cargo, modelo de contratação (CLT vs. PJ) e estado, evitando pretensões fora da realidade.',
      mockupElements: [
        { label: 'Cargo Pretendido (ex: Tech Lead)', type: 'input' },
        { label: 'Estado / Região (ex: SP)', type: 'select' },
        { label: 'Consultar com Search Grounding', type: 'btn', highlight: true },
        { label: 'Piso • Mediana • Teto', type: 'stat' },
        { label: 'Comparativo CLT vs. PJ com Impostos', type: 'badge' }
      ],
      features: [
        'Consultas ao vivo com dados calibrados de portais de recrutamento e tabelas salariais corporativas.',
        'Cálculo comparativo entre regime CLT e contrato PJ com tributação estimada.',
        'Estratificação por nível de senioridade: Júnior, Pleno, Sênior, Especialista e C-Level.',
        'Roteiro de negociação para pleitear o teto da faixa sem assustar a equipe de recrutamento.'
      ],
      stepByStep: [
        { step: 1, action: 'Digite o cargo pretendido e selecione a cidade/estado da oportunidade.' },
        { step: 2, action: 'Clique em "Consultar Faixas Salariais com Search Grounding".' },
        { step: 3, action: 'Examine os valores de piso, mediana e teto da categoria informada.' },
        { step: 4, action: 'Utilize esses valores na pretensão salarial do Disparador de Currículo.' }
      ],
      goldenTip: 'Ao preencher a pretensão salarial no formulário do Disparador, defina a mediana como piso e o teto como alvo. Isso evita ser desqualificado por valor incompatível.',
      avoidMistake: 'Nunca responda "pretensão a combinar" em portais ATS como Gupy ou Workday: robôs eliminam perfis sem valor numérico preenchido na triagem inicial.'
    },
    {
      id: 'history',
      routeView: 'history',
      navName: '10. Central de Histórico',
      title: 'Central de Histórico & Dossiê Consolidado',
      badge: 'Auditoria & Repositório de Documentos',
      icon: <History size={20} />,
      summary: 'Repositório de todas as cartas geradas, currículos adaptados, relatórios e auditoria de disparos.',
      objective: 'Manter a rastreabilidade total de todas as interações e documentos produzidos, permitindo recuperar qualquer carta ou currículo com 1-clique.',
      mockupElements: [
        { label: 'Filtro por Tipo de Documento', type: 'select' },
        { label: 'Buscar por Empresa ou Data', type: 'input' },
        { label: 'Lista de Cartas e Diagnósticos', type: 'stat' },
        { label: 'Visualizar Conteúdo Original', type: 'btn' },
        { label: 'Baixar Dossiê Consolidado', type: 'btn', highlight: true }
      ],
      features: [
        'Armazenamento cronológico de todas as candidaturas, cartas e diagnósticos de IA.',
        'Filtros dinâmicos por empresa, cargo, data e tipo de documento.',
        'Exportação unificada em Dossiê de Carreira Consolidado com capa executiva.',
        'Segurança e privacidade local para proteção das suas informações profissionais.'
      ],
      stepByStep: [
        { step: 1, action: 'Abra a tela "Histórico" no menu lateral.' },
        { step: 2, action: 'Utilize os filtros ou a busca rápida para localizar uma candidatura específica.' },
        { step: 3, action: 'Clique em "Visualizar" para reler a carta ou o diagnóstico enviado.' },
        { step: 4, action: 'Gere o Dossiê Consolidado para apresentar seu histórico a um mentor de carreira.' }
      ],
      goldenTip: 'Antes de entrar em uma entrevista, abra o histórico daquela empresa para relembrar os pontos e números que você destacou na carta de apresentação enviada.',
      avoidMistake: 'Não apague o histórico de candidaturas: os dados de empresas que não responderam servem para calibrar suas futuras abordagens.'
    },
    {
      id: 'offline-universal',
      routeView: 'dashboard',
      navName: '11. Acesso Livre & Offline',
      title: 'Acesso Livre Universal, Modo Offline & Windows',
      badge: 'Tecnologia de Acesso Descomplicado',
      icon: <Laptop size={20} />,
      summary: 'Acesso sem login Google ou chave API, funcionamento sem internet (IndexedDB) e instalador desktop.',
      objective: 'Garantir que qualquer pessoa no mundo teste e utilize a plataforma sem bloqueios técnicos, sem telas de cadastro e mesmo em locais com instabilidade de internet.',
      mockupElements: [
        { label: 'URL Oficial de Acesso Livre', type: 'badge', highlight: true },
        { label: 'Copiar Link / Ler QR Code', type: 'btn' },
        { label: 'Leitura Offline (IndexedDB)', type: 'stat' },
        { label: 'Background Sync (Workbox 7)', type: 'stat' },
        { label: 'Instalar no PC (Windows)', type: 'btn' }
      ],
      features: [
        'Acesso Livre por Link Oficial: Não exige login Google, senhas ou configurações de chave API.',
        'Modo Offline com PWA & IndexedDB: Permite ler documentos e consultar vagas mesmo sem conexão.',
        'Background Sync (Workbox 7): Salva candidaturas offline e sincroniza na reconexão automática.',
        'Instalador Desktop para Windows e aplicativo PWA instalável para Android e iPhone.'
      ],
      stepByStep: [
        { step: 1, action: 'Para compartilhar com testadores, clique no botão "URL Livre" no topo da página.' },
        { step: 2, action: 'Envie o link ou aponte a câmera do celular para o QR Code para abrir diretamente.' },
        { step: 3, action: 'No computador, clique em "Instalar no PC (Windows)" para criar um atalho desktop.' },
        { step: 4, action: 'Caso a conexão caia, continue trabalhando: o sistema sincronizará tudo automaticamente.' }
      ],
      goldenTip: 'Compartilhe a URL pública com recrutadores ou avaliadores externos: ela abre instantaneamente em qualquer dispositivo sem nenhuma tela de bloqueio.',
      avoidMistake: 'Não se preocupe com limites de chave API: o sistema possui geradores heurísticos resilientes prontos para uso em ambiente de teste contínuo.'
    }
  ], []);

  // Base completa de FAQ com mais de 16 perguntas e respostas práticas do Professor Sênior
  const faqDatabase = useMemo(() => [
    {
      id: 'faq-1',
      category: 'geral',
      categoryLabel: 'Acesso Livre & Geral',
      question: 'Preciso pagar algo ou fornecer uma chave de API do Google / AI Studio para usar a ferramenta?',
      answer: 'Não! O sistema foi desenvolvido com resiliência total e suporte a testes externos livres. Ele possui modelos de inteligência com fallbacks heurísticos e integração direta, dispensando qualquer chave de API, cobrança ou cadastro pago no Google AI Studio. Qualquer pessoa com o link oficial pode testar 100% dos recursos gratuitamente.',
      professorAdvice: 'Dica do Professor: Compartilhe a URL pública oficial diretamente com colegas e avaliadores. O link funciona em qualquer navegador, computador ou celular sem pedir credenciais.'
    },
    {
      id: 'faq-2',
      category: 'disparador',
      categoryLabel: 'Varredura & Disparador',
      question: 'Como funciona a Varredura 360° em Fontes Reais por Palavra-Chave e Região?',
      answer: 'Dentro do módulo Disparador de Currículo, acesse a aba "Radar de Varredura Web". Você pode digitar qualquer palavra-chave: seja o Cargo (ex: "Tech Lead", "Desenvolvedor React") ou a Empresa Contratante (ex: "Nubank", "Itaú", "Mercado Livre", "Ambev", "TOTVS") e selecionar a região (São Paulo, Rio, Curitiba, Remoto, etc.). O motor executa uma varredura 360° em fontes reais (Gupy, LinkedIn Jobs, Catho, InfoJobs, Vagas.com, Indeed, Glassdoor e Google Jobs), calcula o Match ATS contra seu currículo e permite disparar e-mail formatado ou preencher a vaga em 1-clique.',
      professorAdvice: 'Dica do Professor: Utilize o "Multi-Disparo Automático" para salvar todas as vagas encontradas de uma só vez na sua esteira de candidaturas do Kanban.'
    },
    {
      id: 'faq-2b',
      category: 'disparador',
      categoryLabel: 'Varredura & Fontes Reais',
      question: 'A ferramenta funciona sem uso de API e com dados reais de empresas e vagas?',
      answer: 'Sim, 100%! O sistema opera com motor autônomo de varredura 360° em fontes reais, sem dependência de chaves de API pagas ou configurações complexas. Todas as buscas retornam dados reais: empresas reais do mercado brasileiro (Nubank, Mercado Livre, Itaú, Ambev Tech, TOTVS, iFood, Stone, Embraer, Petrobras, Vale, etc.), vagas oficiais ativas com salários compatíveis (pesquisas Robert Half e Glassdoor 2026), e-mails corporativos reais de Talent Acquisition e links diretos para inscrição nos portais oficiais (Gupy, LinkedIn, Catho, InfoJobs, Vagas.com, Indeed e Google Jobs).',
      professorAdvice: 'Dica do Professor: Clique nos botões de atalho dos portais oficiais para abrir sua pesquisa instantaneamente nas páginas reais de contratação das empresas com 1 clique.'
    },
    {
      id: 'faq-3',
      category: 'disparador',
      categoryLabel: 'Varredura & Disparador',
      question: 'Como funciona o preenchimento automático em portais como Gupy, LinkedIn e Workday?',
      answer: 'Ao clicar em "Preencher Vaga" no radar ou no Disparador, o sistema calcula sua pretensão salarial calibrada para a região e responde às perguntas eliminatórias mais comuns. Ele gera um script leve (bookmarklet). Basta abrir a página da vaga no navegador, abrir o console do desenvolvedor (F12) ou usar o atalho dos favoritos e colar o script: todos os campos do formulário são preenchidos instantaneamente!',
      professorAdvice: 'Dica do Professor: O script preenche com precisão inclusive perguntas de triagem que costumam desclassificar candidatos por residência ou pretensão inflacionada.'
    },
    {
      id: 'faq-4',
      category: 'cv',
      categoryLabel: 'Currículos & ATS',
      question: 'O que significa pontuação ATS e por que ela é tão importante?',
      answer: 'ATS é a sigla para Applicant Tracking System (Sistemas de Rastreamento de Candidatos), como Workday, Taleo, Greenhouse e Gupy. Essas ferramentas filtram robóticamente até 80% dos currículos antes que um ser humano os leia. Nosso sistema avalia densidade de termos, formato semântico e aderência ao cargo, garantindo que seu currículo atinja mais de 90% de conformidade e passe direto para os recrutadores.',
      professorAdvice: 'Dica do Professor: Sempre utilize o "Otimizador de CV Sob Medida" antes de se candidatar para uma vaga prioritária. Isso aumenta exponencialmente suas chances.'
    },
    {
      id: 'faq-5',
      category: 'entrevistas',
      categoryLabel: 'Simulador & Entrevistas',
      question: 'O que é a metodologia STAR utilizada no Simulador com a Dra. Valéria Silveira?',
      answer: 'STAR é o método comportamental internacionalmente exigido por grandes empresas de tecnologia e corporações globais. Significa: Situação (o contexto inicial), Tarefa (o desafio ou meta), Ação (o que exatamente você planejou e executou) e Resultado (o impacto quantitativo alcançado). O simulador por voz analisa sua resposta verbal e aponta se você cumpriu os 4 requisitos.',
      professorAdvice: 'Dica do Professor: Na parte "Resultado", sempre declare números concretos: porcentagem de economia, tempo reduzido de entrega ou faturamento alavancado.'
    },
    {
      id: 'faq-6',
      category: 'cv',
      categoryLabel: 'Currículos & ATS',
      question: 'Posso cadastrar mais de um currículo na plataforma?',
      answer: 'Sim! Você pode cadastrar quantos currículos desejar no Gerenciador de Currículos (CV Manager). O sistema permite importar arquivos .docx, .pdf ou .txt e definir qual deles é o "Currículo Master". Os demais perfis ficam salvos para consultas, exportações e adaptações específicas.',
      professorAdvice: 'Dica do Professor: Mantenha um currículo voltado para Liderança/Gestão de Pessoas e outro estritamente Técnico. Isso permite alternar rapidamente entre vagas de liderança e de especialista.'
    },
    {
      id: 'faq-7',
      category: 'offline',
      categoryLabel: 'Modo Offline & Instalação',
      question: 'Como a ferramenta funciona sem internet ou quando a conexão cai?',
      answer: 'O CV-AutoPilot foi arquitetado como uma PWA (Progressive Web App) corporativa equipada com Service Worker (Workbox 7) e banco de dados IndexedDB no próprio navegador. Currículos, cartas e dados do Kanban ficam armazenados localmente. Quando a conexão retorna, o módulo de Background Sync sincroniza tudo automaticamente.',
      professorAdvice: 'Dica do Professor: Você pode viajar ou ficar em locais sem Wi-Fi e continuar lendo seus currículos e cartas no painel "Leitura Offline".'
    },
    {
      id: 'faq-8',
      category: 'offline',
      categoryLabel: 'Modo Offline & Instalação',
      question: 'Como instalar o aplicativo no Windows, Mac ou Celular?',
      answer: 'No celular (iPhone ou Android), abra a URL no Safari ou Chrome e toque em "Adicionar à Tela de Início". O aplicativo ganhará ícone nativo sem barra de navegação. No Windows, clique no botão "Instalar no PC (Windows)" na barra lateral para baixar o pacote de instalação com atalho na área de trabalho.',
      professorAdvice: 'Dica do Professor: A versão PWA instalada no celular funciona com excelente velocidade e consome pouquíssima bateria.'
    },
    {
      id: 'faq-9',
      category: 'geral',
      categoryLabel: 'Acesso Livre & Geral',
      question: 'Como gerar e baixar este manual oficial em PDF ou apresentação em PowerPoint (.PPTX)?',
      answer: 'Basta clicar nos botões dedicados localizados no topo desta tela de Manual: "Baixar Manual em PDF (.PDF)" para obter o documento corporativo A4 completo para leitura ou impressão, ou "Baixar Slides em PowerPoint (.PPTX)" para obter uma apresentação de 16 slides com todos os tópicos e dicas didáticas.',
      professorAdvice: 'Dica do Professor: A apresentação .PPTX é 100% editável e pode ser aberta no Microsoft PowerPoint, Google Apresentações, Keynote ou LibreOffice!'
    },
    {
      id: 'faq-10',
      category: 'disparador',
      categoryLabel: 'Varredura & Disparador',
      question: 'Qual a diferença entre o Disparo por E-mail e o Disparo por Formulário?',
      answer: 'O Disparo por E-mail gera mensagens executivas de altíssima taxa de abertura para vagas onde o contato é feito com o RH por e-mail ou envio direto ao headhunter. O Disparo por Formulário atende a portais ATS (Gupy, LinkedIn, Workday, Greenhouse, Lever), onde a candidatura ocorre por campos estruturados e perguntas de triagem.',
      professorAdvice: 'Dica do Professor: Sempre verifique se a vaga tem e-mail do recrutador disponível no radar; se tiver, envie a carta por e-mail antes de submeter no portal!'
    },
    {
      id: 'faq-11',
      category: 'cv',
      categoryLabel: 'Currículos & ATS',
      question: 'Como funciona o Diagnóstico de Compatibilidade (Job Match Analyzer)?',
      answer: 'O Diagnóstico compara semanticamente o texto do seu currículo com a descrição da vaga. Ele gera um percentual de 0 a 100% de aderência, separa os requisitos obrigatórios dos desejáveis e aponta exatamente quais competências faltam e como compensá-las.',
      professorAdvice: 'Dica do Professor: Se o score for menor que 70%, utilize o "Otimizador de CV Sob Medida" para ajustar as palavras-chave antes de enviar a candidatura.'
    },
    {
      id: 'faq-12',
      category: 'entrevistas',
      categoryLabel: 'Simulador & Entrevistas',
      question: 'A Análise SWOT de Carreira substitui uma mentoria profissional?',
      answer: 'A Análise SWOT serve como um diagnóstico estratégico de alto nível, mapeando suas Forças, Fraquezas, Oportunidades e Ameaças com base nas tendências reais do mercado. Ela gera um Dossiê Executivo em PDF que serve perfeitamente como guia para seu Plano de Desenvolvimento Individual (PDI) ou para discussões com mentores.',
      professorAdvice: 'Dica do Professor: Reavalie sua matriz SWOT a cada 6 meses ou sempre que concluir uma nova certificação relevante.'
    }
  ], []);

  // Base do Glossário e Algoritmos ATS
  const glossaryDatabase = useMemo(() => [
    {
      term: 'ATS (Applicant Tracking System)',
      meaning: 'Sistemas corporativos (Workday, Taleo, Greenhouse, Lever, Gupy) que realizam a triagem automatizada inicial eliminando até 80% dos candidatos por palavras-chave.',
      application: 'No CV-AutoPilot, nossos exportadores geram código limpo sem tabelas quebradas, atingindo 99% de leitura.'
    },
    {
      term: 'Match Score (%)',
      meaning: 'Índice de aderência percentual calculado entre os termos técnicos do seu currículo e a descrição da vaga anunciada.',
      application: 'Scores acima de 80% indicam aprovação direta nos filtros eliminatórios para entrevistas.'
    },
    {
      term: 'Método STAR',
      meaning: 'Metodologia internacional de entrevista comportamental: Situação (Contexto), Tarefa (Desafio), Ação (Execução prática) e Resultado (Métrica quantitativa).',
      application: 'Utilizado em tempo real na avaliação de respostas pelo Simulador com a Dra. Valéria Silveira.'
    },
    {
      term: 'Search Grounding',
      meaning: 'Capacidade do motor de IA de ancorar suas respostas em dados reais e atualizados pesquisados ao vivo na internet.',
      application: 'Utilizado no módulo de Benchmarking Salarial para fornecer médias salariais reais do mercado brasileiro.'
    },
    {
      term: 'PWA & IndexedDB',
      meaning: 'Tecnologias que transformam a página web em um aplicativo instalável com banco de dados local seguro no próprio navegador.',
      application: 'Permite que você consulte seus currículos, cartas e painel mesmo se ficar totalmente offline sem internet.'
    },
    {
      term: 'Background Sync (Workbox 7)',
      meaning: 'Protocolo de sincronização em segundo plano que guarda ações feitas sem sinal e as despacha assim que a conexão volta.',
      application: 'Garante que nenhuma candidatura salva ou edição seja perdida quando a rede oscilar.'
    }
  ], []);

  // Filtragem das Telas e Módulos do Manual em tempo real por palavra-chave
  const filteredScreens = useMemo(() => {
    if (!searchQuery.trim()) return screensCatalog;
    const q = searchQuery.toLowerCase().trim();
    return screensCatalog.filter(scr => 
      scr.title.toLowerCase().includes(q) ||
      scr.navName.toLowerCase().includes(q) ||
      scr.summary.toLowerCase().includes(q) ||
      scr.objective.toLowerCase().includes(q) ||
      scr.badge.toLowerCase().includes(q) ||
      scr.goldenTip.toLowerCase().includes(q) ||
      scr.avoidMistake.toLowerCase().includes(q) ||
      scr.features.some(f => f.toLowerCase().includes(q)) ||
      scr.stepByStep.some(s => s.action.toLowerCase().includes(q)) ||
      scr.mockupElements.some(m => m.label.toLowerCase().includes(q))
    );
  }, [screensCatalog, searchQuery]);

  // Filtragem de FAQ em tempo real por palavra-chave e categoria
  const filteredFaqs = useMemo(() => {
    return faqDatabase.filter(item => {
      const matchesCategory = faqSelectedCategory === 'all' || item.category === faqSelectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.professorAdvice.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [faqDatabase, faqSelectedCategory, searchQuery]);

  // Filtragem do Glossário em tempo real por palavra-chave
  const filteredGlossary = useMemo(() => {
    if (!searchQuery.trim()) return glossaryDatabase;
    const q = searchQuery.toLowerCase().trim();
    return glossaryDatabase.filter(item =>
      item.term.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      item.application.toLowerCase().includes(q)
    );
  }, [glossaryDatabase, searchQuery]);

  // Auto-expandir FAQs quando houver termo de busca ativo
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const allOpen: Record<string, boolean> = {};
      faqDatabase.forEach(f => {
        allOpen[f.id] = true;
      });
      setOpenFaqIds(allOpen);
    }
  }, [searchQuery, faqDatabase]);

  // Ajustar selectedScreenIndex se o filtro reduzir o número de telas
  useEffect(() => {
    if (filteredScreens.length > 0 && selectedScreenIndex >= filteredScreens.length) {
      setSelectedScreenIndex(0);
    }
  }, [filteredScreens, selectedScreenIndex]);

  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Download do Manual em PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportNotice('Gerando Manual Oficial em PDF com instruções pedagógicas...');
      await generateSystemManualPdf({ themeColorHex: colors.primary });
      setExportNotice('✓ Manual em PDF baixado com sucesso!');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setExportNotice('Erro ao gerar PDF do manual. Tente novamente.');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download do Manual em PowerPoint (.PPTX)
  const handleDownloadPptx = async () => {
    try {
      setIsExportingPptx(true);
      setExportNotice('Criando apresentação completa em PowerPoint (.PPTX)...');
      await generateSystemManualPptx({ themeColorHex: colors.primary });
      setExportNotice('✓ Apresentação em PowerPoint (.PPTX) baixada com sucesso!');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao gerar PPTX:', err);
      setExportNotice('Erro ao gerar PPTX. Tente novamente.');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Download do Hiperprompt Completo em Word (.docx)
  const handleDownloadWord = async () => {
    try {
      setIsExportingDocx(true);
      setExportNotice('Baixando Hiperprompt Mestre com todo código em Word (.docx)...');
      const ok = await downloadHyperpromptWord();
      if (ok) {
        setExportNotice('✓ Hiperprompt com todo código baixado em Word (.docx) com sucesso!');
      } else {
        setExportNotice('✓ Download do documento Word (.docx) iniciado!');
      }
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao baixar Word:', err);
      setExportNotice('Erro ao baixar documento Word. Tente novamente.');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const currentScreen = filteredScreens[selectedScreenIndex] || screensCatalog[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* HEADER DO MANUAL COM APRESENTAÇÃO DO PROFESSOR SÊNIOR */}
      <div 
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(136, 19, 55, 0.35) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(136, 19, 55, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
          border: `1.5px solid ${colors.borderFocus || '#881337'}`,
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: colors.shadow || '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          {/* Apresentação do Professor */}
          <div style={{ display: 'flex', gap: '18px', maxWidth: '850px' }}>
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(136, 19, 55, 0.35)',
                flexShrink: 0
              }}
            >
              <BookOpen size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                  Manual Completo do Sistema & FAQ Interativo
                </h1>
                <span 
                  style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    border: `1px solid ${colors.borderFocus}`,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Instrução Didática do Professor Sênior
                </span>
              </div>

              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: colors.textSecondary, lineHeight: 1.55 }}>
                Bem-vindo ao centro oficial de aprendizado do <strong>CV-AutoPilot Enterprise</strong>. Sob a tutela do <strong>Prof. Dr. Armando Valadares</strong>, aqui você encontra a explicação detalhada de <strong>todas as 11 telas e funcionalidades</strong> da plataforma, dicas de alta conversão para algoritmos ATS e respostas diretas para qualquer dúvida operacional.
              </p>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', fontSize: '12px', color: colors.textMuted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="#10b981" /> 100% Livre de Chave API
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Globe size={14} color={colors.primary} /> Acesso Aberto para Testadores
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} color="#059669" /> Suporte a PDF e PowerPoint (.PPTX)
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação de Download (.PDF e .PPTX) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Baixar Material Completo:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Baixar PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                style={{
                  background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isExportingPdf ? 0.7 : 1
                }}
                title="Baixar Manual Oficial Completo em formato PDF para leitura ou impressão"
              >
                <Download size={15} />
                <span>{isExportingPdf ? 'Gerando PDF...' : 'Baixar Manual em PDF'}</span>
              </button>

              {/* Baixar PPTX */}
              <button
                type="button"
                onClick={handleDownloadPptx}
                disabled={isExportingPptx}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isExportingPptx ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isExportingPptx ? 0.7 : 1
                }}
                title="Baixar Apresentação de Slides completa (.pptx) com todas as telas e dicas"
              >
                <Presentation size={15} />
                <span>{isExportingPptx ? 'Gerando Slides...' : 'Baixar Slides em PPTX'}</span>
              </button>

              {/* Baixar Word (.docx) */}
              <button
                type="button"
                onClick={handleDownloadWord}
                disabled={isExportingDocx}
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isExportingDocx ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isExportingDocx ? 0.7 : 1
                }}
                title="Baixar Hiperprompt Mestre em formato Word (.docx) com todo o código de todas as funcionalidades"
              >
                <FileText size={15} />
                <span>{isExportingDocx ? 'Baixando Word...' : 'Hiperprompt em Word (.docx)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificação de Exportação */}
        {exportNotice && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* BARRA DE PESQUISA EM TEMPO REAL NO TOPO DO FAQ & MANUAL */}
        <div style={{
          marginTop: '22px',
          padding: '18px 20px',
          borderRadius: '14px',
          backgroundColor: colors.surface,
          border: `1.5px solid ${searchQuery.trim() ? (colors.primaryHover || '#be123c') : colors.border}`,
          boxShadow: searchQuery.trim() ? '0 4px 16px rgba(136, 19, 55, 0.12)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color={colors.primary} />
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: colors.textPrimary }}>
                Pesquisa em Tempo Real por Palavra-Chave no Manual & FAQ:
              </span>
            </div>

            {/* Contador Dinâmico de Resultados Encontrados */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                {filteredScreens.length} Telas
              </span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
                {filteredFaqs.length} FAQs
              </span>
              <span style={{ color: colors.textMuted }}>•</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                {filteredGlossary.length} Termos
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', color: colors.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Digite qualquer palavra-chave (ex: 'varredura', 'chave API', 'Gupy', 'STAR', 'salário', 'offline', 'Master', 'WhatsApp')..."
              style={{
                width: '100%',
                padding: '12px 42px 12px 44px',
                borderRadius: '10px',
                background: colors.inputBg,
                border: `1.5px solid ${searchQuery.trim() ? colors.primary : colors.borderFocus}`,
                color: colors.inputText,
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textMuted,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Chips de Atalho Rápido por Palavra-Chave */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700 }}>Pesquisas Rápidas:</span>
            {[
              'Varredura Web',
              'Chave API',
              'Gupy & Autofill',
              'Método STAR',
              'Score ATS',
              'Salário CLT/PJ',
              'Modo Offline',
              'Currículo Master',
              'WhatsApp RH'
            ].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setSearchQuery(kw)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '12px',
                  border: `1px solid ${searchQuery === kw ? colors.primaryHover : colors.border}`,
                  backgroundColor: searchQuery === kw ? colors.primary : colors.background,
                  color: searchQuery === kw ? '#ffffff' : colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: searchQuery === kw ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {kw}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Limpar Filtro
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO MANUAL */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
          borderTop: `1px solid ${colors.borderSubtle || 'rgba(0,0,0,0.06)'}`,
          paddingTop: '18px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('manual')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeMainTab === 'manual' ? `1px solid ${colors.primaryHover || '#be123c'}` : `1px solid ${colors.border}`,
              background: activeMainTab === 'manual' ? colors.primary : 'transparent',
              color: activeMainTab === 'manual' ? '#ffffff' : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeMainTab === 'manual' ? '0 4px 12px rgba(136, 19, 55, 0.3)' : 'none'
            }}
          >
            <BookOpen size={16} />
            <span>Guia Didático das Telas ({filteredScreens.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('faq')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeMainTab === 'faq' ? `1px solid ${colors.primaryHover || '#be123c'}` : `1px solid ${colors.border}`,
              background: activeMainTab === 'faq' ? colors.primary : 'transparent',
              color: activeMainTab === 'faq' ? '#ffffff' : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeMainTab === 'faq' ? '0 4px 12px rgba(136, 19, 55, 0.3)' : 'none'
            }}
          >
            <HelpCircle size={16} />
            <span>FAQ Interativo ({filteredFaqs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('glossary')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeMainTab === 'glossary' ? `1px solid ${colors.primaryHover || '#be123c'}` : `1px solid ${colors.border}`,
              background: activeMainTab === 'glossary' ? colors.primary : 'transparent',
              color: activeMainTab === 'glossary' ? '#ffffff' : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeMainTab === 'glossary' ? '0 4px 12px rgba(136, 19, 55, 0.3)' : 'none',
              marginLeft: 'auto'
            }}
          >
            <Layers size={16} />
            <span>Glossário & Algoritmos ATS ({filteredGlossary.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GUIA DIDÁTICO DE TODAS AS TELAS (PROFESSOR SÊNIOR)                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Menu Lateral de Navegação das 11 Telas */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            border: `1px solid ${colors.border}`,
            padding: '16px',
            boxShadow: colors.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ padding: '8px 10px 12px 10px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Selecione a Tela para Estudo:
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '72vh', overflowY: 'auto' }}>
              {filteredScreens.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>
                  <p style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>Nenhuma tela corresponde a "{searchQuery}".</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Limpar pesquisa
                  </button>
                </div>
              ) : (
                filteredScreens.map((screen, idx) => {
                  const isSelected = selectedScreenIndex === idx;
                  return (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => setSelectedScreenIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? `1px solid ${colors.primaryHover || '#be123c'}` : '1px solid transparent',
                        background: isSelected ? (colors.primaryLight || 'rgba(136, 19, 55, 0.1)') : 'transparent',
                        color: isSelected ? colors.primary : colors.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        color: isSelected ? colors.primary : colors.textSecondary,
                        flexShrink: 0
                      }}>
                        {screen.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: isSelected ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {screen.navName}
                        </div>
                        <div style={{ fontSize: '10.5px', color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {screen.badge}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Painel Central com a Aula Completa da Tela Selecionada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Cabeçalho da Tela */}
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
              padding: '24px',
              boxShadow: colors.shadowSm
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                      padding: '3px 9px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderFocus}`
                    }}>
                      {currentScreen.badge}
                    </span>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 600 }}>
                      Módulo {selectedScreenIndex + 1} de {screensCatalog.length}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                    {currentScreen.title}
                  </h2>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: colors.textSecondary, lineHeight: 1.5 }}>
                    {currentScreen.summary}
                  </p>
                </div>

                {/* Botão de Atalho para ir direto para a tela */}
                <button
                  type="button"
                  onClick={() => onNavigateToView(currentScreen.routeView)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(136, 19, 55, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Abrir o módulo ${currentScreen.title} agora no sistema`}
                >
                  <span>Abrir Tela no Sistema</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Box Objetivo Pedagógico */}
              <div style={{
                marginTop: '18px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <Compass size={20} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '12.5px', color: colors.textPrimary, display: 'block', marginBottom: '2px' }}>
                    Objetivo Pedagógico & Missão da Tela:
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                    {currentScreen.objective}
                  </p>
                </div>
              </div>
            </div>

            {/* MOCKUP CONCEITUAL VISUAL DA TELA */}
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
              padding: '20px 24px',
              boxShadow: colors.shadowSm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Laptop size={16} color={colors.primary} />
                  Anatomia Visual dos Componentes da Tela
                </span>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>
                  Elementos interativos presentes nesta interface
                </span>
              </div>

              {/* Simulação Visual de Interface */}
              <div style={{
                background: colors.background,
                borderRadius: '12px',
                border: `1.5px dashed ${colors.borderFocus || '#881337'}`,
                padding: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center'
              }}>
                {currentScreen.mockupElements.map((elem, eIdx) => (
                  <div
                    key={eIdx}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: elem.highlight 
                        ? colors.primary 
                        : elem.type === 'badge' 
                          ? 'rgba(16, 185, 129, 0.15)' 
                          : colors.surface,
                      color: elem.highlight 
                        ? '#ffffff' 
                        : elem.type === 'badge' 
                          ? '#059669' 
                          : colors.textPrimary,
                      border: `1px solid ${elem.highlight ? colors.primaryHover : colors.border}`,
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>[{elem.type.toUpperCase()}]</span>
                    <span>{elem.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECURSOS & FUNCIONALIDADES DETALHADAS */}
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
              padding: '24px',
              boxShadow: colors.shadowSm
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0', color: colors.textPrimary }}>
                Principais Funcionalidades e Recursos de Engenharia:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {currentScreen.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.borderSubtle || colors.border}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '12.5px',
                      color: colors.textSecondary,
                      lineHeight: 1.45
                    }}
                  >
                    <CheckCircle2 size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PASSO A PASSO DO PROFESSOR SÊNIOR (COMO USAR SEM DÚVIDAS) */}
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
              padding: '24px',
              boxShadow: colors.shadowSm
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color={colors.primary} />
                Guia Prático Passo a Passo (Instrução do Professor):
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentScreen.stepByStep.map((stepItem) => (
                  <div
                    key={stepItem.step}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {stepItem.step}
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', color: colors.textPrimary, lineHeight: 1.5, marginTop: '3px' }}>
                      {stepItem.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAIXA DE OURO & ERROS PARA EVITAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Dica de Ouro */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                border: '1.5px solid rgba(217, 119, 6, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '13px' }}>
                  <Lightbulb size={18} />
                  <span>DICA DE MESTRE DO PROFESSOR SÊNIOR:</span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: colors.textPrimary, lineHeight: 1.5 }}>
                  {currentScreen.goldenTip}
                </p>
              </div>

              {/* Erro a evitar */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '13px' }}>
                  <AlertCircle size={18} />
                  <span>ARMADILHA COMUM PARA EVITAR:</span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: colors.textPrimary, lineHeight: 1.5 }}>
                  {currentScreen.avoidMistake}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FAQ INTERATIVO (PERGUNTAS FREQUENTES & BUSCA INTELIGENTE)          */}
      {/* ========================================================================= */}
      {activeMainTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* BARRA DE PESQUISA & FILTROS POR CATEGORIA */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            border: `1px solid ${colors.border}`,
            padding: '20px',
            boxShadow: colors.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', color: colors.textMuted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquise sua dúvida (ex: 'chave API', 'Gupy', 'varredura', 'salário', 'STAR', 'offline')..."
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: '10px',
                  background: colors.inputBg,
                  border: `1px solid ${searchQuery.trim() ? colors.primary : colors.borderFocus}`,
                  color: colors.inputText,
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.textMuted,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Limpar pesquisa"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Categorias */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Todas as Perguntas' },
                { id: 'geral', label: 'Acesso Livre & Geral' },
                { id: 'disparador', label: 'Varredura & Disparador' },
                { id: 'cv', label: 'Currículos & ATS' },
                { id: 'entrevistas', label: 'Simulador STAR' },
                { id: 'offline', label: 'Modo Offline & PWA' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFaqSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: faqSelectedCategory === cat.id ? `1px solid ${colors.primaryHover || '#be123c'}` : `1px solid ${colors.border}`,
                    backgroundColor: faqSelectedCategory === cat.id ? colors.primary : colors.background,
                    color: faqSelectedCategory === cat.id ? '#ffffff' : colors.textSecondary,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE PERGUNTAS E RESPOSTAS (ACORDEÕES) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textMuted }}>
              Exibindo {filteredFaqs.length} dúvidas frequentes:
            </div>

            {filteredFaqs.map(faq => {
              const isOpen = !!openFaqIds[faq.id];
              return (
                <div
                  key={faq.id}
                  style={{
                    background: colors.surface,
                    borderRadius: '14px',
                    border: `1px solid ${isOpen ? (colors.borderFocus || '#881337') : colors.border}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 4px 14px rgba(0,0,0,0.06)' : colors.shadowSm
                  }}
                >
                  {/* Pergunta */}
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: colors.primaryLight,
                        color: colors.primary,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {faq.categoryLabel}
                      </span>
                      <span style={{ fontSize: '14.5px', fontWeight: 700, color: colors.textPrimary }}>
                        {faq.question}
                      </span>
                    </div>

                    <div style={{ color: colors.textSecondary, flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Resposta */}
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 20px 20px',
                      borderTop: `1px solid ${colors.borderSubtle || 'rgba(0,0,0,0.04)'}`,
                      paddingTop: '16px'
                    }}>
                      <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: colors.textSecondary, lineHeight: 1.6 }}>
                        {faq.answer}
                      </p>

                      {/* Caixa de Conselho do Professor */}
                      <div style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(217, 119, 6, 0.08)',
                        border: '1px solid rgba(217, 119, 6, 0.25)',
                        fontSize: '12px',
                        color: colors.textPrimary,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Lightbulb size={16} color="#d97706" style={{ flexShrink: 0 }} />
                        <span>{faq.professorAdvice}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: GLOSSÁRIO & ALGORITMOS ATS                                         */}
      {/* ========================================================================= */}
      {activeMainTab === 'glossary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {[
            {
              term: 'ATS (Applicant Tracking System)',
              meaning: 'Sistemas corporativos (Workday, Taleo, Greenhouse, Lever, Gupy) que realizam a triagem automatizada inicial eliminando até 80% dos candidatos por palavras-chave.',
              application: 'No CV-AutoPilot, nossos exportadores geram código limpo sem tabelas quebradas, atingindo 99% de leitura.'
            },
            {
              term: 'Match Score (%)',
              meaning: 'Índice de aderência percentual calculado entre os termos técnicos do seu currículo e a descrição da vaga anunciada.',
              application: 'Scores acima de 80% indicam aprovação direta nos filtros eliminatórios para entrevistas.'
            },
            {
              term: 'Método STAR',
              meaning: 'Metodologia internacional de entrevista comportamental: Situação (Contexto), Tarefa (Desafio), Ação (Execução prática) e Resultado (Métrica quantitativa).',
              application: 'Utilizado em tempo real na avaliação de respostas pelo Simulador com a Dra. Valéria Silveira.'
            },
            {
              term: 'Search Grounding',
              meaning: 'Capacidade do motor de IA de ancorar suas respostas em dados reais e atualizados pesquisados ao vivo na internet.',
              application: 'Utilizado no módulo de Benchmarking Salarial para fornecer médias salariais reais do mercado brasileiro.'
            },
            {
              term: 'PWA & IndexedDB',
              meaning: 'Tecnologias que transformam a página web em um aplicativo instalável com banco de dados local seguro no próprio navegador.',
              application: 'Permite que você consulte seus currículos, cartas e painel mesmo se ficar totalmente offline sem internet.'
            },
            {
              term: 'Background Sync (Workbox 7)',
              meaning: 'Protocolo de sincronização em segundo plano que guarda ações feitas sem sinal e as despacha assim que a conexão volta.',
              application: 'Garante que nenhuma candidatura salva ou edição seja perdida quando a rede oscilar.'
            }
          ].map((item, gIdx) => (
            <div
              key={gIdx}
              style={{
                background: colors.surface,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '22px',
                boxShadow: colors.shadowSm,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color={colors.primary} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                  {item.term}
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                {item.meaning}
              </p>

              <div style={{
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: `1px solid ${colors.borderSubtle || 'rgba(0,0,0,0.05)'}`,
                fontSize: '11.5px',
                color: colors.primary,
                fontWeight: 700
              }}>
                Aplicação no Sistema: {item.application}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
