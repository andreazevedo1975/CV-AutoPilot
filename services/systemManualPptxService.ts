// services/systemManualPptxService.ts
// Gerador oficial de apresentação de slides (.pptx) do Manual do Sistema CV-AutoPilot
// Usando pptxgenjs com layout 16:9 corporativo e didática do Professor Sênior
import pptxgen from 'pptxgenjs';

export interface ManualPptxOptions {
  themeColorHex?: string;
}

export const generateSystemManualPptx = async (options?: ManualPptxOptions): Promise<void> => {
  const primaryHex = (options?.themeColorHex || '#881337').replace('#', '');
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Prof. Dr. Armando Valadares';
  pptx.company = 'CV-AutoPilot Enterprise';
  pptx.title = 'Manual Completo do Sistema CV-AutoPilot';
  pptx.subject = 'Treinamento e Instrução de Todas as Telas e Funcionalidades';

  // Cores do tema
  const C_PRIMARY = primaryHex; // 881337
  const C_DARK = '0F172A';
  const C_MUTED = '64748B';
  const C_LIGHT_BG = 'F8FAFC';
  const C_GOLD = 'D97706';
  const C_SUCCESS = '059669';

  // Helper para adicionar cabeçalho padrão de slide de conteúdo
  const addSlideHeader = (slide: any, moduleNumber: string, title: string, badge: string) => {
    // Top Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.15,
      fill: { color: C_PRIMARY }
    });

    // Module Number & Badge
    slide.addText(`${moduleNumber} • ${badge.toUpperCase()}`, {
      x: 0.8,
      y: 0.35,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: C_PRIMARY,
      fontFace: 'Arial'
    });

    // Slide Main Title
    slide.addText(title, {
      x: 0.8,
      y: 0.65,
      w: 11.5,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: C_DARK,
      fontFace: 'Arial'
    });

    // Rodapé sutil
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 7.0,
      w: 11.7,
      h: 0,
      line: { color: 'CBD5E1', width: 1 }
    });

    slide.addText('CV-AutoPilot Enterprise • Manual Oficial do Sistema • Prof. Dr. Armando Valadares', {
      x: 0.8,
      y: 7.05,
      w: 8.5,
      h: 0.3,
      fontSize: 9,
      color: C_MUTED,
      fontFace: 'Arial'
    });

    slide.addText('Ambiente de Teste Livre • Sem Exigência de Chave API', {
      x: 8.0,
      y: 7.05,
      w: 4.5,
      h: 0.3,
      fontSize: 9,
      align: 'right',
      color: C_SUCCESS,
      bold: true,
      fontFace: 'Arial'
    });
  };

  // =========================================================================
  // SLIDE 1: CAPA EXECUTIVA
  // =========================================================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: C_PRIMARY };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 0.3,
    h: 5.8,
    fill: { color: C_GOLD }
  });

  slide1.addText('CV-AUTOPILOT ENTERPRISE • GUIA DE TREINAMENTO', {
    x: 1.4,
    y: 1.2,
    w: 10.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: C_PRIMARY,
    fontFace: 'Arial'
  });

  slide1.addText('MANUAL COMPLETO DO SISTEMA\nTODAS AS TELAS & FUNCIONALIDADES', {
    x: 1.4,
    y: 1.6,
    w: 10.5,
    h: 1.4,
    fontSize: 26,
    bold: true,
    color: C_DARK,
    fontFace: 'Arial'
  });

  slide1.addText('Instrução Didática Passo a Passo • Engenharia Reversa de Algoritmos ATS • Varredura Web de Vagas • Simulador STAR', {
    x: 1.4,
    y: 3.1,
    w: 10.5,
    h: 0.6,
    fontSize: 13,
    color: C_MUTED,
    fontFace: 'Arial'
  });

  // Box do Professor Sênior na Capa
  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.4,
    y: 3.9,
    w: 10.5,
    h: 1.6,
    fill: { color: C_LIGHT_BG },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide1.addText('MENTOR E AUTOR DO MANUAL:', {
    x: 1.7,
    y: 4.1,
    w: 9.8,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: C_PRIMARY,
    fontFace: 'Arial'
  });

  slide1.addText('Prof. Dr. Armando Valadares • Professor Sênior de Tecnologia & Headhunter de Carreiras', {
    x: 1.7,
    y: 4.4,
    w: 9.8,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: C_DARK,
    fontFace: 'Arial'
  });

  slide1.addText('Guia projetado para que testadores externos, recrutadores e candidatos dominem 100% da ferramenta sem nenhuma dúvida.', {
    x: 1.7,
    y: 4.85,
    w: 9.8,
    h: 0.4,
    fontSize: 11,
    color: C_MUTED,
    fontFace: 'Arial'
  });

  slide1.addText(`Acesso Universal Livre • Data de Edição: ${new Date().toLocaleDateString('pt-BR')}`, {
    x: 1.4,
    y: 5.9,
    w: 10.5,
    h: 0.3,
    fontSize: 10,
    color: C_MUTED,
    fontFace: 'Arial'
  });

  // =========================================================================
  // SLIDE 2: TRILHA DE APRENDIZAGEM (SUMÁRIO)
  // =========================================================================
  const slide2 = pptx.addSlide();
  addSlideHeader(slide2, 'SUMÁRIO GERAL', 'Trilha Pedagógica de Domínio da Plataforma', 'Visão Geral');

  const topicsList = [
    { n: '01', title: 'Gerenciador de Currículos (CV Manager)', desc: 'Upload .docx/.pdf, versionamento e pontuação prévia de ATS' },
    { n: '02', title: 'Disparador & Radar Web por Palavra-Chave', desc: 'Varredura na internet por cargo/empresa e região desejada' },
    { n: '03', title: 'Painel de Controle & Kanban (Dashboard)', desc: 'Funil de vagas, gráficos semanais e lembretes de follow-up' },
    { n: '04', title: 'Extrator Inteligente de Contatos de RH', desc: 'Mineração de e-mails, telefones, WhatsApp e LinkedIn de recrutadores' },
    { n: '05', title: 'Otimizador de CV Sob Medida (Tailored Builder)', desc: 'Reescrita cirúrgica de palavras-chave para vencer filtros ATS' },
    { n: '06', title: 'Diagnóstico de Compatibilidade Vaga vs. CV', desc: 'Score numérico (0-100%), gap analysis e plano de mitigação' },
    { n: '07', title: 'Simulador de Entrevista por Voz (Dra. Valéria)', desc: 'Treinamento verbal em tempo real pelo método comportamental STAR' },
    { n: '08', title: 'Análise SWOT Pessoal de Carreira', desc: 'Matriz estratégica de forças, fraquezas e dossiê em PDF' },
    { n: '09', title: 'Benchmarking Salarial Regionalizado', desc: 'Consultas ao vivo de faixas salariais CLT/PJ com Search Grounding' },
    { n: '10', title: 'Histórico de Gerações & Dossiê Consolidado', desc: 'Repositório de auditoria e exportação unificada' },
    { n: '11', title: 'Acesso Livre, Modo Offline (PWA) & Windows', desc: 'Operação sem chave API, em qualquer rede, celular ou PC' },
    { n: '12', title: 'FAQ & Respostas do Professor Sênior', desc: 'Soluções diretas para as dúvidas mais comuns dos usuários' }
  ];

  topicsList.forEach((t, i) => {
    const col = i < 6 ? 0 : 1;
    const row = i % 6;
    const xPos = 0.8 + col * 5.9;
    const yPos = 1.35 + row * 0.9;

    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 0.8,
      fill: { color: C_LIGHT_BG },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: 0.6,
      h: 0.8,
      fill: { color: C_PRIMARY }
    });

    slide2.addText(t.n, {
      x: xPos,
      y: yPos + 0.15,
      w: 0.6,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      fontFace: 'Arial'
    });

    slide2.addText(t.title, {
      x: xPos + 0.7,
      y: yPos + 0.08,
      w: 4.8,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: C_DARK,
      fontFace: 'Arial'
    });

    slide2.addText(t.desc, {
      x: xPos + 0.7,
      y: yPos + 0.4,
      w: 4.8,
      h: 0.35,
      fontSize: 9,
      color: C_MUTED,
      fontFace: 'Arial'
    });
  });

  // =========================================================================
  // SLIDES DE CADA UMA DAS TELAS
  // =========================================================================
  const slidesContent = [
    {
      modNum: 'TELA 01',
      title: 'Gerenciador de Currículos (CV Manager)',
      badge: 'Base de Dados & ATS Master',
      objective: 'Cadastrar, importar e auditar múltiplos currículos para diferentes momentos de carreira.',
      features: [
        'Importação inteligente de arquivos .DOCX, .PDF e .TXT com extração automática.',
        'Versionamento com definição de "Currículo Master" para alimentação dos módulos de IA.',
        'Auditoria prévia de compatibilidade com sistemas ATS (densidade de termos técnicos).',
        'Exportação em PDF corporativo de alta conversão visual pronto para submissão.'
      ],
      steps: [
        '1. Clique em "+ Adicionar Novo Currículo" ou solte o arquivo na área pontilhada.',
        '2. O sistema preenche nome, e-mail, telefone, resumo executivo e cargos anteriores.',
        '3. Marque o perfil como "Master" para torná-lo o padrão de disparos e diagnósticos.',
        '4. Exporte em PDF ou utilize a sincronização automática para proteger seus dados.'
      ],
      tip: 'Mantenha um perfil focado em Gestão/Liderança e outro em Especialista Técnico para dobrar a taxa de retorno.',
      metrics: 'Métricas ATS: Densidade Semântica, Clareza de Impacto e Legibilidade de Algoritmos.'
    },
    {
      modNum: 'TELA 02',
      title: 'Disparador Automático de Currículo & Radar Web',
      badge: 'Varredura por Palavra-Chave & Região',
      objective: 'Varre a internet inteira atrás de vagas ativas por cargo ou empresa e dispara candidaturas em 1-clique.',
      features: [
        'Radar Web: Busca por Palavra-Chave (Cargo como "Tech Lead" ou Empresa como "Nubank").',
        'Filtro Geográfico: São Paulo, Rio, Curitiba, BH, Floripa, Remoto ou região customizada.',
        'Disparo por E-mail: Geração de cartas executivas com alto CTR e assunto persuasivo.',
        'Disparo por Formulário: Script bookmarklet que preenche portais ATS (Gupy, LinkedIn, Workday).',
        'Multi-Disparo Automático: Salva todas as vagas varridas de uma só vez na esteira Kanban.'
      ],
      steps: [
        '1. Acesse a aba "Radar de Varredura Web (IA)" dentro do Disparador.',
        '2. Digite a palavra-chave desejada e selecione a região de contratação pretendida.',
        '3. Clique em "Fazer Varredura Completa": as vagas são listadas com % de Match ATS.',
        '4. Escolha entre Disparar E-mail, Preencher Formulário ou Multi-Disparo em Lote.'
      ],
      tip: 'Pesquisar pela empresa contratante lista as vagas abertas naquela corporação; pesquisar por cargo mapeia o mercado regional.',
      metrics: 'Ações Disponíveis: E-mail Formatado • Preenchimento ATS • Registro Kanban com Follow-up.'
    },
    {
      modNum: 'TELA 03',
      title: 'Painel de Controle, Kanban & Métricas (Dashboard)',
      badge: 'Gestão da Esteira de Candidaturas',
      objective: 'Controlar o funil de contratação, prazos de follow-up e medir o retorno das aplicações.',
      features: [
        'Quadro Kanban interativo com colunas: Salvas, Aplicou, Entrevista, Proposta e Recusadas.',
        'Lembretes de follow-up programados para o 5º dia útil após o envio.',
        'Gráficos comparativos semanais e mensais de volume de aplicações e taxas de sucesso.',
        'Exportação de todas as candidaturas para planilha Excel (.xlsx) e relatórios em PDF.'
      ],
      steps: [
        '1. Visualize seus cartões de candidatura com cargo, empresa, salário e data de aplicação.',
        '2. Mova os cartões entre as colunas conforme avançar no processo seletivo.',
        '3. Consulte os alertas de follow-up para recontatar os recrutadores no tempo certo.',
        '4. Exporte relatórios para auditar o progresso da sua transição ou recolocação.'
      ],
      tip: 'Recrutadores respondem até 4x mais quando recebem um follow-up educado e pontual no 5º dia útil.',
      metrics: 'Métricas Chave: Taxa de Resposta de RH • Volume Semanal • Tempo Médio de Conversão.'
    },
    {
      modNum: 'TELA 04',
      title: 'Extrator Inteligente de Contatos de RH',
      badge: 'Prospecção Direta de Headhunters',
      objective: 'Minerar e-mails, telefones, WhatsApp e LinkedIn a partir de anúncios brutos de contratação.',
      features: [
        'Filtros anti-lixo que eliminam e-mails genéricos de suporte e focam no time de Talent Acquisition.',
        'Higienização de números para padrão internacional WhatsApp (+55 DD 9XXXX-XXXX).',
        'Exportação da lista gerada em planilha Excel (.xlsx) e catálogo corporativo em PDF.',
        'Abertura direta de conversa no WhatsApp Web com mensagem de apresentação pronta.'
      ],
      steps: [
        '1. Copie o texto de um anúncio de vaga (LinkedIn, Gupy ou e-mail) e cole no extrator.',
        '2. Clique em "Extrair Contatos com IA" para identificar tomadores de decisão.',
        '3. Confira os dados estruturados em tabela com os níveis de precisão da informação.',
        '4. Baixe a planilha ou dispare contato direto com os recrutadores identificados.'
      ],
      tip: 'Sempre mencione o nome do recrutador no primeiro contato: transforma abordagem fria em diálogo executivo.',
      metrics: 'Extração Suportada: E-mails Corporativos • Celulares/WhatsApp • Perfis LinkedIn • Nomes de TA.'
    },
    {
      modNum: 'TELA 05',
      title: 'Otimizador de CV Sob Medida (Tailored Builder)',
      badge: 'Calibração Fina para Filtros ATS',
      objective: 'Reescrever tópicos do currículo para obter nota máxima nos algoritmos de triagem corporativos.',
      features: [
        'Alinhamento com diretrizes de Workday, Taleo, Greenhouse, Lever e SAP SuccessFactors.',
        'Inserção semântica das competências e metodologias exigidas na vaga alvo.',
        'Preservação da veracidade do histórico do candidato sem criar dados fictícios.',
        'Exportação direta do currículo otimizado com diagramação limpa e moderna.'
      ],
      steps: [
        '1. Selecione o currículo base que deseja calibrar.',
        '2. Cole o texto integral da vaga pretendida no campo indicado.',
        '3. Clique em "Otimizar Currículo Sob Medida" para acionar o motor de reescrita.',
        '4. Revise os pontos ajustados e baixe a nova versão pronta para envio ao recrutador.'
      ],
      tip: 'Nunca envie o mesmo currículo para 20 vagas: ajustar 10 palavras-chave específicas multiplica o retorno por 8.',
      metrics: 'Compatibilidade ATS: Termos Técnicos • Sinônimos da Indústria • Estrutura Linear.'
    },
    {
      modNum: 'TELA 06',
      title: 'Diagnóstico de Compatibilidade (Job Match Analyzer)',
      badge: 'Score Percentual & Gap Analysis',
      objective: 'Avaliar matematicamente as chances reais de aprovação antes de aplicar para uma vaga.',
      features: [
        'Cálculo do percentual de Match Score (0 a 100%) entre o currículo e o anúncio da vaga.',
        'Separação analítica: Requisitos Mandatórios atendidos vs. Requisitos Desejáveis pendentes.',
        'Mapeamento de Lacunas (Gaps de formação, certificações ou ferramentas requeridas).',
        'Recomendações práticas e roteiro de estudo rápido para compensar fragilidades na entrevista.'
      ],
      steps: [
        '1. Selecione o currículo e insira o texto ou URL da vaga pretendida.',
        '2. Clique em "Executar Diagnóstico de Compatibilidade".',
        '3. Analise a nota geral de aderência e a lista detalhada de correspondências.',
        '4. Se o score for > 75%, aplique imediatamente; se for < 70%, utilize o Otimizador de CV.'
      ],
      tip: 'Um score acima de 80% indica passagem direta pelos filtros ATS; acima de 90%, o perfil entra no top 5% dos candidatos.',
      metrics: 'Critérios Analisados: Requisitos Obrigatórios • Tempo de Experiência • Formação • Soft Skills.'
    },
    {
      modNum: 'TELA 07',
      title: 'Simulador de Entrevistas por Voz (Dra. Valéria)',
      badge: 'Treinamento Verbal pelo Método STAR',
      objective: 'Treinar verbalmente respostas convincentes para perguntas comportamentais e técnicas de RH.',
      features: [
        'Headhunter Virtual com áudio bidirecional em tempo real.',
        'Perguntas customizadas de acordo com a senioridade e o segmento do cargo pretendido.',
        'Avaliação rigorosa pelo Método STAR: Situação, Tarefa, Ação e Resultado quantitativo.',
        'Relatório executivo pós-entrevista com nota de clareza, concisão e poder de convencimento.'
      ],
      steps: [
        '1. Ative seu microfone e clique em "Iniciar Simulação de Entrevista".',
        '2. Ouça a pergunta da Dra. Valéria e responda pausadamente pelo método STAR.',
        '3. Receba o feedback imediato após cada resposta com orientações de postura e foco.',
        '4. Conclua a sessão para gerar o dossiê da entrevista com pontos a lapidar antes da real.'
      ],
      tip: 'Sempre mencione números na parte "Resultado" do STAR: % de aumento de faturamento, prazo economizado ou equipe liderada.',
      metrics: 'Avaliação STAR: Situação (Contexto) • Tarefa (Desafio) • Ação (Execução) • Resultado (Métrica).'
    },
    {
      modNum: 'TELA 08',
      title: 'Análise SWOT Pessoal de Carreira',
      badge: 'Posicionamento Estratégico & Dossiê',
      objective: 'Diagnosticar estrategicamente Forças, Fraquezas, Oportunidades e Ameaças da sua trajetória.',
      features: [
        'Matriz 2x2 com cruzamento das competências internas com as tendências do mercado externo.',
        'Plano de Alavancagem: Como potencializar suas Forças para capturar Oportunidades de alto valor.',
        'Plano de Mitigação: Como blindar sua carreira contra Ameaças (automação, obsolescência).',
        'Exportação de Dossiê Executivo de Carreira em PDF de alta qualidade para seu PDI.'
      ],
      steps: [
        '1. Selecione o currículo base e indique seu objetivo profissional de médio e longo prazo.',
        '2. Clique em "Gerar Matriz SWOT Pessoal".',
        '3. Analise cada um dos 4 quadrantes preenchidos pela inteligência executiva.',
        '4. Exporte o documento oficial em PDF para orientar sua evolução profissional continuada.'
      ],
      tip: 'Na entrevista, sua maior Fraqueza deve vir acompanhada da ação prática que você já iniciou para superá-la.',
      metrics: 'Dimensões: Strengths (Forças) • Weaknesses (Fraquezas) • Opportunities (Oportunidades) • Threats (Ameaças).'
    },
    {
      modNum: 'TELA 09',
      title: 'Benchmarking Salarial Regionalizado',
      badge: 'Remuneração Real com Search Grounding',
      objective: 'Consultar faixas salariais atualizadas para calibrar sua pretensão sem perder oportunidades.',
      features: [
        'Pesquisa em tempo real com dados de mercado calibrados por região geográfica e estado.',
        'Comparação estruturada entre modelos CLT e Pessoa Jurídica (PJ) com impostos calculados.',
        'Abertura por senioridade: Júnior, Pleno, Sênior, Especialista, Tech Lead e Diretoria.',
        'Dicas de negociação para pleitear o teto da faixa sem assustar a equipe de recrutamento.'
      ],
      steps: [
        '1. Digite o cargo desejado e selecione a cidade/estado pretendido.',
        '2. Clique em "Consultar Faixas Salariais com Search Grounding".',
        '3. Analise o piso, a mediana e o teto da remuneração praticada no mercado.',
        '4. Use a mediana como pretensão mínima no Disparador de Currículo.'
      ],
      tip: 'No preenchimento de vagas, nunca informe um valor fixo rígido; utilize a faixa salarial entre a mediana e o teto regional.',
      metrics: 'Métricas de Remuneração: Piso • Mediana de Mercado • Teto Salarial • Benefícios Praticados.'
    },
    {
      modNum: 'TELA 10',
      title: 'Central de Histórico & Dossiê Consolidado',
      badge: 'Auditoria & Repositório de Documentos',
      objective: 'Auditar, consultar e recuperar todas as versões de cartas e currículos gerados pela IA.',
      features: [
        'Armazenamento cronológico de todas as candidaturas, cartas de apresentação e relatórios.',
        'Filtros dinâmicos por empresa, cargo, data e tipo de documento.',
        'Exportação unificada em Dossiê de Carreira Consolidado com capa executiva.',
        'Segurança e privacidade local para proteção das suas informações profissionais.'
      ],
      steps: [
        '1. Abra o menu "Histórico" na barra lateral.',
        '2. Utilize o campo de busca ou os filtros para localizar um documento gerado.',
        '3. Clique para visualizar o conteúdo ou baixar o arquivo em PDF.',
        '4. Gere um Dossiê Consolidado para apresentar a mentores ou consultores de carreira.'
      ],
      tip: 'Antes de entrar na sala de entrevista, consulte a carta salva no histórico para alinhar seu discurso ao que foi enviado.',
      metrics: 'Documentos Mantidos: Cartas de Apresentação • Currículos Tailored • Diagnósticos • Registros de Disparo.'
    },
    {
      modNum: 'TELA 11',
      title: 'Acesso Livre Universal, Modo Offline & Windows',
      badge: 'Tecnologia de Acesso Descomplicado',
      objective: 'Garantir que qualquer pessoa teste e acesse a ferramenta livremente em celular ou computador.',
      features: [
        'Acesso Livre por Link: Não exige cadastro Google, senhas ou configurações de chave API.',
        'Modo Offline com PWA & IndexedDB: Permite ler documentos mesmo sem internet.',
        'Background Sync (Workbox 7): Salva candidaturas offline e sincroniza na reconexão.',
        'Instalador Desktop para Windows e aplicativo instalável para Android e iPhone.'
      ],
      steps: [
        '1. Para enviar a avaliadores ou testadores, clique em "URL Livre" no topo da página.',
        '2. Compartilhe o link oficial ou utilize o QR Code para abrir diretamente no celular.',
        '3. Para usar no Windows, clique em "Instalar no PC (Windows)" no menu lateral.',
        '4. Caso fique sem internet, o sistema continua funcionando e sincroniza ao reconectar.'
      ],
      tip: 'A URL oficial pública roda em qualquer rede ou dispositivo do mundo sem telas de bloqueio de segurança.',
      metrics: 'Compatibilidade: Google Chrome • Safari (iOS) • Microsoft Edge • Windows 10/11 • Android.'
    }
  ];

  slidesContent.forEach((sc) => {
    const slide = pptx.addSlide();
    addSlideHeader(slide, sc.modNum, sc.title, sc.badge);

    // Box Esquerdo: Objetivo e Recursos
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.35,
      w: 5.6,
      h: 4.4,
      fill: { color: C_LIGHT_BG },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.35,
      w: 5.6,
      h: 0.45,
      fill: { color: C_PRIMARY }
    });

    slide.addText('OBJETIVO & PRINCIPAIS RECURSOS', {
      x: 1.0,
      y: 1.45,
      w: 5.2,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial'
    });

    slide.addText(`Objetivo: ${sc.objective}`, {
      x: 1.0,
      y: 1.95,
      w: 5.2,
      h: 0.65,
      fontSize: 10,
      bold: true,
      color: C_DARK,
      fontFace: 'Arial'
    });

    sc.features.forEach((feat, idx) => {
      slide.addText(`• ${feat}`, {
        x: 1.0,
        y: 2.65 + idx * 0.68,
        w: 5.2,
        h: 0.6,
        fontSize: 9.5,
        color: C_MUTED,
        fontFace: 'Arial'
      });
    });

    // Box Direito Superior: Passo a Passo
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.7,
      y: 1.35,
      w: 5.8,
      h: 3.2,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1', width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 6.7,
      y: 1.35,
      w: 5.8,
      h: 0.45,
      fill: { color: C_DARK }
    });

    slide.addText('COMO USAR PASSO A PASSO (SEM DÚVIDAS)', {
      x: 6.9,
      y: 1.45,
      w: 5.4,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial'
    });

    sc.steps.forEach((st, idx) => {
      slide.addText(st, {
        x: 6.9,
        y: 1.95 + idx * 0.62,
        w: 5.4,
        h: 0.55,
        fontSize: 9.5,
        bold: idx === 0,
        color: C_DARK,
        fontFace: 'Arial'
      });
    });

    // Box Direito Inferior: Dica de Mestre do Professor
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.7,
      y: 4.75,
      w: 5.8,
      h: 1.0,
      fill: { color: 'FEF3C7' },
      line: { color: 'F59E0B', width: 1 }
    });

    slide.addText('💡 DICA DE MESTRE DO PROFESSOR SÊNIOR:', {
      x: 6.9,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: 'B45309',
      fontFace: 'Arial'
    });

    slide.addText(sc.tip, {
      x: 6.9,
      y: 5.12,
      w: 5.4,
      h: 0.55,
      fontSize: 9,
      color: '78350F',
      fontFace: 'Arial'
    });

    // Box de Métricas Inferior (Full Width)
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 5.95,
      w: 11.7,
      h: 0.8,
      fill: { color: C_LIGHT_BG },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addText(sc.metrics, {
      x: 1.0,
      y: 6.2,
      w: 11.3,
      h: 0.35,
      fontSize: 10,
      bold: true,
      color: C_PRIMARY,
      fontFace: 'Arial'
    });
  });

  // =========================================================================
  // SLIDE 15: FAQ - PERGUNTAS FREQUENTES
  // =========================================================================
  const slideFaq = pptx.addSlide();
  addSlideHeader(slideFaq, 'FAQ', 'Perguntas Frequentes & Respostas Práticas', 'Soluções Diretas');

  const faqItems = [
    {
      q: '1. Preciso de chave de API do Google ou cadastro para testar?',
      a: 'Não! O sistema possui resiliência total e geradores heurísticos. Usuários externos acessam e testam todas as funções com 1-clique pelo link oficial.'
    },
    {
      q: '2. Como a varredura na internet por palavra-chave funciona?',
      a: 'Basta informar o cargo ou empresa e a região. O radar mapeia oportunidades ativas e calcula o índice de aderência ATS com seu currículo.'
    },
    {
      q: '3. O preenchimento automático funciona em qualquer portal de vagas?',
      a: 'Sim! O sistema gera um script seguro (bookmarklet) que preenche Gupy, LinkedIn, Workday, Greenhouse e Lever com pretensão regional e respostas de triagem.'
    },
    {
      q: '4. Posso usar no celular ou instalar no computador?',
      a: 'Sim! A ferramenta é uma PWA responsiva (funciona em iOS e Android) e possui instalador dedicado para Windows (PC).'
    }
  ];

  faqItems.forEach((faq, idx) => {
    const yPos = 1.35 + idx * 1.35;

    slideFaq.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 11.7,
      h: 1.15,
      fill: { color: idx % 2 === 0 ? C_LIGHT_BG : 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 }
    });

    slideFaq.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 0.2,
      h: 1.15,
      fill: { color: C_PRIMARY }
    });

    slideFaq.addText(faq.q, {
      x: 1.2,
      y: yPos + 0.12,
      w: 11.0,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: C_DARK,
      fontFace: 'Arial'
    });

    slideFaq.addText(faq.a, {
      x: 1.2,
      y: yPos + 0.48,
      w: 11.0,
      h: 0.55,
      fontSize: 10,
      color: C_MUTED,
      fontFace: 'Arial'
    });
  });

  // =========================================================================
  // SLIDE 16: CONCLUSÃO & BOAS PRÁTICAS
  // =========================================================================
  const slideEnd = pptx.addSlide();
  slideEnd.background = { color: C_PRIMARY };

  slideEnd.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slideEnd.addText('PALAVRA FINAL DO PROFESSOR SÊNIOR', {
    x: 1.4,
    y: 1.3,
    w: 10.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: C_PRIMARY,
    fontFace: 'Arial'
  });

  slideEnd.addText('Você agora possui um ecossistema completo de alta conversão.', {
    x: 1.4,
    y: 1.7,
    w: 10.5,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: C_DARK,
    fontFace: 'Arial'
  });

  slideEnd.addText('A aprovação em processos seletivos de alta remuneração não é uma questão de sorte, mas sim de precisão algorítmica, consistência no funil de candidaturas e preparação comportamental estruturada.', {
    x: 1.4,
    y: 2.4,
    w: 10.5,
    h: 0.8,
    fontSize: 13,
    color: C_MUTED,
    fontFace: 'Arial'
  });

  // 3 Dicas Finais
  const finalTips = [
    { title: '1. Varredura Contínua', desc: 'Execute o radar por palavra-chave pelo menos duas vezes por semana na sua região alvo.' },
    { title: '2. Nunca Envie sem Otimizar', desc: 'Calibre o currículo na tela "Tailored Builder" para bater mais de 85% de Match ATS.' },
    { title: '3. Treine Verbalmente', desc: 'Faça ao menos 3 simulações com a Dra. Valéria Silveira antes de entrevistas reais.' }
  ];

  finalTips.forEach((ft, idx) => {
    slideEnd.addShape(pptx.ShapeType.rect, {
      x: 1.4 + idx * 3.6,
      y: 3.4,
      w: 3.3,
      h: 2.0,
      fill: { color: C_LIGHT_BG },
      line: { color: 'E2E8F0', width: 1 }
    });

    slideEnd.addText(ft.title, {
      x: 1.6 + idx * 3.6,
      y: 3.6,
      w: 2.9,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: C_PRIMARY,
      fontFace: 'Arial'
    });

    slideEnd.addText(ft.desc, {
      x: 1.6 + idx * 3.6,
      y: 4.1,
      w: 2.9,
      h: 1.1,
      fontSize: 10,
      color: C_DARK,
      fontFace: 'Arial'
    });
  });

  slideEnd.addText('Manual Oficial do Sistema CV-AutoPilot Enterprise • Pronto para Download e Apresentação', {
    x: 1.4,
    y: 5.8,
    w: 10.5,
    h: 0.35,
    fontSize: 10,
    color: C_MUTED,
    fontFace: 'Arial'
  });

  // Baixar arquivo .pptx diretamente no navegador
  await pptx.writeFile({ fileName: 'Manual_do_Sistema_CV_AutoPilot.pptx' });
};
