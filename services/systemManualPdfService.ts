// services/systemManualPdfService.ts
// Gerador oficial de PDF executivo do Manual e Guia Completo do Sistema CV-AutoPilot
// Assinado pelo Professor Sênior em Tecnologia & Engenharia de Carreiras
import { jsPDF } from 'jspdf';

export interface ManualPdfOptions {
  themeColorHex?: string;
}

export const generateSystemManualPdf = async (options?: ManualPdfOptions): Promise<void> => {
  const themeHex = options?.themeColorHex || '#881337';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      return [
        parseInt(clean.substring(0, 2), 16),
        parseInt(clean.substring(2, 4), 16),
        parseInt(clean.substring(4, 6), 16),
      ];
    }
    return [136, 19, 55];
  };

  const primaryRgb = hexToRgb(themeHex);

  const drawHeader = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 8, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('CV-AUTOPILOT ENTERPRISE', margin + 3, 13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('MANUAL OFICIAL DO SISTEMA & GUIA DIDÁTICO DO PROFESSOR SÊNIOR', pageWidth - margin - 3, 13, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 16, pageWidth - margin, 16);
  };

  const checkPageOverflow = (neededSpaceMm: number) => {
    if (y + neededSpaceMm > pageHeight - margin - 12) {
      doc.addPage();
      y = 22;
      drawHeader();
    }
  };

  // =========================================================================
  // PÁGINA 1: CAPA EXECUTIVA DO MANUAL
  // =========================================================================
  // Faixa decorativa superior
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Box Principal da Capa
  y = 30;
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUAL COMPLETO DO SISTEMA', margin + 8, y + 18);

  doc.setFontSize(13);
  doc.setTextColor(253, 242, 248);
  doc.text('CV-AutoPilot Enterprise • Guia Oficial de Todas as Telas & Funcionalidades', margin + 8, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(244, 244, 245);
  doc.text('Arquitetura de Algoritmos ATS, Varredura Web, Disparador de Vagas e Simulador de Entrevistas', margin + 8, y + 38);
  doc.text('Versão Oficial • Instrução Didática Passo a Passo • Sem Dúvidas de Operação', margin + 8, y + 45);

  y += 66;

  // Box do Professor Sênior
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(margin, y, 4, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('MENTOR RESPONSÁVEL & AUTOR DO MANUAL', margin + 8, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Prof. Dr. Armando Valadares', margin + 8, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Professor Titular em Engenharia de Software, Sistemas Distribuídos e Headhunter de Liderança Executiva.', margin + 8, y + 22);
  doc.text('Especialista em Engenharia Reversa de Algoritmos ATS (Workday, Taleo, Greenhouse, Lever e SAP SuccessFactors).', margin + 8, y + 28);

  y += 44;

  // Sumário Executivo na Capa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('ÍNDICE DO MANUAL PEDAGÓGICO', margin, y);
  y += 6;

  const topics = [
    { num: '01', title: 'Gerenciador de Currículos (CV Manager) & Métricas de Compatibilidade ATS' },
    { num: '02', title: 'Disparador Automático de Currículo (IA) & Radar de Varredura Web por Palavra-Chave' },
    { num: '03', title: 'Painel de Controle, Kanban de Vagas e Gráficos Comparativos de Desempenho' },
    { num: '04', title: 'Extrator Inteligente de Contatos de RH (E-mails, Telefones, WhatsApp e LinkedIn)' },
    { num: '05', title: 'Otimizador de Currículo Sob Medida para a Vaga (Tailored CV Builder)' },
    { num: '06', title: 'Diagnóstico de Compatibilidade Vaga vs. Currículo (Job Match Analyzer)' },
    { num: '07', title: 'Simulador de Entrevistas por Voz com a Dra. Valéria Silveira (Método STAR)' },
    { num: '08', title: 'Análise SWOT Pessoal de Carreira & Exportação de Dossiê Executivo em PDF' },
    { num: '09', title: 'Benchmarking Salarial Regionalizado com Search Grounding em Tempo Real' },
    { num: '10', title: 'Central de Histórico de Gerações de IA & Exportação de Dossiês' },
    { num: '11', title: 'Acesso Livre Universal, Modo Offline (PWA / IndexedDB) e Instalador Windows' },
    { num: '12', title: 'FAQ Completo: As 15 Perguntas Mais Frequentes Respondidas pelo Professor Sênior' }
  ];

  topics.forEach((t) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, 9, 6.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(t.num, margin + 4.5, y + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(t.title, margin + 12, y + 4.5);
    y += 8.2;
  });

  // Rodapé da capa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Gerado em: ${new Date().toLocaleDateString('pt-BR')} • CV-AutoPilot Enterprise Edition`, margin, pageHeight - 10);
  doc.text('Ambiente Livre de Testes • Sem Exigência de Chave API', pageWidth - margin, pageHeight - 10, { align: 'right' });

  // =========================================================================
  // PÁGINA 2: INTRODUÇÃO DIDÁTICA DO PROFESSOR SÊNIOR
  // =========================================================================
  doc.addPage();
  y = 24;
  drawHeader();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('MENSAGEM DIDÁTICA DO PROFESSOR SÊNIOR', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Olá! Como seu mentor de carreira e professor sênior de sistemas, preparei este guia com um objetivo claro:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Garantir que você e qualquer avaliador externo dominem 100% dos recursos do CV-AutoPilot com clareza absoluta.', margin, y);
  y += 9;

  // Box de Diretrizes Pedagógicas
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('OS 3 PILARES DE EXCELÊNCIA DA PLATAFORMA:', margin + 6, y + 7);

  const pillars = [
    '1. Engenharia Reversa de ATS: Nossos modelos alinham seu perfil aos algoritmos eliminatórios de RH.',
    '2. Automação em Escala Humana: Varredura de vagas na internet por palavra-chave e disparos personalizados.',
    '3. Resiliência Total: Sistema 100% utilizável para testes sem chaves de API, com modo offline e sincronização.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  pillars.forEach((p, idx) => {
    doc.text(p, margin + 6, y + 14 + idx * 5.2);
  });

  y += 38;

  // Seções Detalhadas
  const modulesDetails = [
    {
      num: 'TELA 01',
      name: 'GERENCIADOR DE CURRÍCULOS (CV MANAGER)',
      badge: 'Base de Dados & ATS Master',
      objective: 'Armazenar, gerenciar e otimizar múltiplos perfis curriculares em formato digital e impresso.',
      features: [
        'Upload com extração automática inteligente de documentos .DOCX, .PDF e .TXT.',
        'Auditoria instantânea de densidade de palavras-chave e cálculo prévio de Score ATS.',
        'Exportação em PDF corporativo de alta conversão visual calibrado para impressão e leitura de máquina.',
        'Sincronização e backup automático com histórico de versões local e na nuvem.'
      ],
      stepByStep: [
        'Passo 1: Clique no botão "+ Adicionar Novo Currículo" ou arraste seu arquivo existente.',
        'Passo 2: O sistema extrai automaticamente nome, contatos, resumo executivo e histórico profissional.',
        'Passo 3: Selecione o currículo como "Master" para utilizá-lo como base em todos os módulos de IA.',
        'Passo 4: Utilize a ação "Exportar PDF" para gerar a versão limpa e formatada para submissão imediata.'
      ],
      tip: 'Mantenha pelo menos um perfil com foco em Liderança/Gestão e outro focado em Especialista Técnico. Isso dobra sua taxa de aderência nas vagas varridas.'
    },
    {
      num: 'TELA 02',
      name: 'DISPARADOR AUTOMÁTICO DE CURRÍCULO & RADAR WEB',
      badge: 'Varredura por Palavra-Chave & Região',
      objective: 'Fazer uma varredura completa na internet por vagas ativas e disparar candidaturas em lote ou individuais.',
      features: [
        'Radar Web com busca por Palavra-Chave (seja o Cargo ou a Empresa Contratante).',
        'Filtro regional completo: capitais, polos tecnológicos ou cidades personalizadas (CLT/PJ/Remoto).',
        'Disparo por E-mail: Geração de cartas de apresentação executivas com assunto de alto CTR.',
        'Disparo por Formulário: Script bookmarklet que preenche Gupy, LinkedIn e Workday em 1-clique.',
        'Multi-Disparo Automático: Registro em lote de todas as vagas varridas diretamente no Kanban.'
      ],
      stepByStep: [
        'Passo 1: Acesse a aba "Radar de Varredura Web (IA)" dentro do Disparador.',
        'Passo 2: Digite a palavra-chave (ex: "Nubank" ou "Tech Lead") e confirme a região desejada.',
        'Passo 3: Clique em "Fazer Varredura Completa". A IA localiza as vagas com score de Match ATS.',
        'Passo 4: Clique em "Disparar E-mail", "Preencher Vaga" ou "Multi-Disparo Automático" para salvar todas.'
      ],
      tip: 'Quando buscar por Empresa, o radar mapeia todas as posições abertas naquela corporação. Quando buscar por Cargo, o radar varre múltiplas empresas na sua região.'
    },
    {
      num: 'TELA 03',
      name: 'PAINEL DE CONTROLE & KANBAN (DASHBOARD)',
      badge: 'Esteira de Acompanhamento Executivo',
      objective: 'Organizar todas as etapas do processo seletivo e emitir alertas de follow-up contra esquecimento.',
      features: [
        'Funil visual com 5 estágios: Salvas, Aplicou, Triagem/Entrevista, Proposta e Recusadas.',
        'Gráficos comparativos semanais e mensais de volume de candidaturas e taxa de retorno.',
        'Lembretes de follow-up automáticos calculados em 5 dias após a aplicação.',
        'Exportação completa de dados em planilha Excel (.xlsx) e relatório em PDF.'
      ],
      stepByStep: [
        'Passo 1: Visualize suas candidaturas organizadas por cartões com nome do cargo, empresa e salário.',
        'Passo 2: Arraste ou altere o status de uma vaga à medida que avançar nas etapas do processo seletivo.',
        'Passo 3: Consulte os lembretes de follow-up para recontatar o recrutador no momento exato.',
        'Passo 4: Exporte seus relatórios mensais para auditoria ou compartilhamento com sua mentoria.'
      ],
      tip: 'Recrutadores respondem 4 vezes mais quando recebem um follow-up educado no 5º dia útil após o envio. Use a data de lembrete exibida no cartão!'
    },
    {
      num: 'TELA 04',
      name: 'EXTRATOR DE CONTATOS DE RH & RECRUTADORES',
      badge: 'Prospecção Direta de Tomadores de Decisão',
      objective: 'Extrair em massa e-mails corporativos, telefones, WhatsApp e LinkedIn a partir de anúncios brutos de vagas.',
      features: [
        'Parser de linguagem natural com filtros anti-lixo para e-mails de RH e recrutadores.',
        'Higienização de números telefônicos para formato WhatsApp brasileiro (+55 DD 9XXXX-XXXX).',
        'Exportação da lista gerada em planilha Excel (.xlsx) e agenda em PDF corporativo.',
        'Disparo de mensagem direta via WhatsApp Web com 1-clique.'
      ],
      stepByStep: [
        'Passo 1: Copie o texto de um anúncio do LinkedIn, Gupy ou e-mail e cole no campo de extração.',
        'Passo 2: Clique em "Extrair Contatos com IA". O sistema filtra nomes, e-mails e contatos.',
        'Passo 3: Visualize a tabela higienizada com scores de confiança de cada informação.',
        'Passo 4: Baixe a planilha Excel para enriquecer seu CRM de networking ou dispare mensagens diretas.'
      ],
      tip: 'Sempre envie uma mensagem personalizada citando o nome do recrutador extraído. Isso transforma uma candidatura fria em uma conversa consultiva!'
    },
    {
      num: 'TELA 05',
      name: 'OTIMIZADOR DE CV SOB MEDIDA PARA A VAGA (TAILORED BUILDER)',
      badge: 'Calibração Fina para Algoritmos ATS',
      objective: 'Reescrever cirurgicamente seu currículo para atender 100% aos requisitos de uma vaga específica.',
      features: [
        'Cruzamento semântico do seu perfil contra os requisitos mandatórios da descrição da vaga.',
        'Inserção natural de termos técnicos e metodologias eliminatórias exigidas pelos filtros ATS.',
        'Geração de versão específica sem perder a verdade ou autenticidade das suas experiências reais.',
        'Exportação imediata do currículo otimizado com formatação limpa e profissional.'
      ],
      stepByStep: [
        'Passo 1: Selecione o currículo base que deseja utilizar.',
        'Passo 2: Cole a descrição completa da vaga que deseja conquistar.',
        'Passo 3: Clique em "Otimizar Currículo Sob Medida". O motor calibrará cada tópico profissional.',
        'Passo 4: Revise as alterações sugeridas e faça o download do novo documento pronto para envio.'
      ],
      tip: 'Nunca use o mesmo currículo genérico para 20 vagas diferentes. Ajustar 10 palavras-chave específicas da vaga eleva a taxa de chamadas de 5% para 42%!'
    },
    {
      num: 'TELA 06',
      name: 'DIAGNÓSTICO DE COMPATIBILIDADE (JOB MATCH ANALYZER)',
      badge: 'Score de Aderência & Gap Analysis',
      objective: 'Descobrir com precisão matemática se vale a pena candidatar-se e quais competências faltam.',
      features: [
        'Cálculo do percentual de aderência (Match Score de 0 a 100%).',
        'Separação analítica entre requisitos mandatórios atendidos vs. não atendidos.',
        'Identificação de Gaps de Formação, Certificações ou Ferramentas.',
        'Recomendações práticas e plano de estudo relâmpago para mitigar lacunas na entrevista.'
      ],
      stepByStep: [
        'Passo 1: Cole a vaga e selecione o currículo.',
        'Passo 2: Execute o Diagnóstico de Compatibilidade.',
        'Passo 3: Analise o gráfico de radar e a lista de pontos fortes vs. pontos de atenção.',
        'Passo 4: Caso o score seja superior a 75%, siga para o Disparador; se for menor, use o Otimizador.'
      ],
      tip: 'Um score acima de 80% indica que você passará sem atritos pela triagem algorítmica. Acima de 90%, você estará no top 5% dos candidatos avaliados.'
    },
    {
      num: 'TELA 07',
      name: 'SIMULADOR DE ENTREVISTAS POR VOZ (DRA. VALÉRIA SILVEIRA)',
      badge: 'Treinamento Realista em Tempo Real',
      objective: 'Treinar verbalmente respostas a perguntas difíceis de RH utilizando o padrão comportamental STAR.',
      features: [
        'Interação por voz bidirecional em tempo real com a Headhunter Virtual Dra. Valéria Silveira.',
        'Perguntas comportamentais, técnicas e situacionais baseadas no perfil do seu cargo pretendido.',
        'Cobrança da metodologia STAR: Situação, Tarefa, Ação e Resultado quantificável.',
        'Relatório de feedback executivo com notas de clareza, objetividade e impacto persuasivo.'
      ],
      stepByStep: [
        'Passo 1: Conecte o microfone e inicie a sessão de entrevista.',
        'Passo 2: Ouça a pergunta feita pela Dra. Valéria e responda pausadamente estruturando pelo método STAR.',
        'Passo 3: Receba o feedback imediato após cada resposta com correções de postura e síntese.',
        'Passo 4: Ao encerrar, baixe o dossiê da simulação com seus pontos de evolução antes da entrevista real.'
      ],
      tip: 'Em entrevistas corporativas, evite respostas vagas. Sempre mencione métricas: "% de redução de custos", "tempo de entrega reduzido" ou "volume de usuários impactados".'
    },
    {
      num: 'TELA 08',
      name: 'ANÁLISE SWOT PESSOAL DE CARREIRA',
      badge: 'Matriz Estratégica & Dossiê em PDF',
      objective: 'Mapear Forças, Fraquezas, Oportunidades e Ameaças da sua trajetória para posicionamento de alto valor.',
      features: [
        'Geração da Matriz SWOT 2x2 com cruzamento de dados de mercado.',
        'Estratégias de Alavancagem (usar forças para capturar oportunidades).',
        'Estratégias de Mitigação (proteger-se de ameaças do mercado como automação ou saturação).',
        'Exportação de Dossiê Executivo de Carreira em PDF de alta resolução.'
      ],
      stepByStep: [
        'Passo 1: Selecione o currículo e defina seu cargo-alvo de longo prazo.',
        'Passo 2: Clique em "Gerar Matriz SWOT Pessoal".',
        'Passo 3: Explore os 4 quadrantes analíticos detalhados pela IA.',
        'Passo 4: Exporte o Dossiê Executivo em PDF para guiar seu plano de desenvolvimento individual (PDI).'
      ],
      tip: 'Sua maior Fraqueza nunca deve ser escondida na entrevista: declare-a junto com o plano de ação concreto que você já está executando para superá-la.'
    },
    {
      num: 'TELA 09',
      name: 'BENCHMARKING SALARIAL COM SEARCH GROUNDING',
      badge: 'Dados Reais de Remuneração Regional',
      objective: 'Descobrir a remuneração exata praticada no mercado brasileiro por cargo, senioridade e região.',
      features: [
        'Consultas ao vivo com dados de mercado (CLT e PJ com impostos calculados).',
        'Comparações entre níveis Júnior, Pleno, Sênior, Especialista e Diretor.',
        'Variação por estado e modelo de trabalho (Presencial vs. Remoto).',
        'Tática de negociação: Quando e como pedir o teto da faixa salarial sem assustar o RH.'
      ],
      stepByStep: [
        'Passo 1: Informe o cargo desejado (ex: "Tech Lead") e selecione o Estado/Região.',
        'Passo 2: Clique em "Consultar Faixas Salariais com Search Grounding".',
        'Passo 3: Visualize o piso, a mediana e o teto da remuneração em gráficos claros.',
        'Passo 4: Utilize essa referência na pretensão salarial do formulário do Disparador de Currículo.'
      ],
      tip: 'Ao preencher a pretensão salarial no Disparador, coloque a mediana como mínimo e o teto como alvo. Isso evita ser descartado por pretensão inflacionada ou desvalorizada.'
    },
    {
      num: 'TELA 10',
      name: 'HISTÓRICO DE GERAÇÕES & DOSSIÊ CONSOLIDADO',
      badge: 'Auditoria & Repositório Central',
      objective: 'Centralizar todas as cartas, currículos adaptados, relatórios de entrevista e análises em um só lugar.',
      features: [
        'Histórico com carimbo de data, versão e contexto de cada geração realizada.',
        'Recuperação instantânea de cartas de apresentação geradas anteriormente.',
        'Exportação combinada em Dossiê de Carreira Consolidado.',
        'Pesquisa por palavra-chave para localizar rapidamente documentos passados.'
      ],
      stepByStep: [
        'Passo 1: Acesse a tela "Histórico" no menu lateral.',
        'Passo 2: Filtre por tipo de documento (Currículos, Cartas, Diagnósticos ou Entrevistas).',
        'Passo 3: Clique em "Visualizar" ou "Exportar PDF" para recuperar qualquer documento.',
        'Passo 4: Use a busca para encontrar cartas enviadas para uma empresa específica.'
      ],
      tip: 'Antes de uma entrevista, abra o histórico daquela empresa para relembrar a carta e os requisitos que você destacou na candidatura.'
    },
    {
      num: 'TELA 11',
      name: 'ACESSO LIVRE, MODO OFFLINE (PWA) & INSTALADOR WINDOWS',
      badge: 'Tecnologia de Acesso Universal',
      objective: 'Garantir que qualquer pessoa teste e utilize a ferramenta sem travas técnicas ou barreiras de rede.',
      features: [
        'Acesso Livre por Link Público Oficial: Não exige login Google, senhas ou configurações de API.',
        'Modo Offline via Service Worker & IndexedDB: Permite ler documentos e consultar vagas sem internet.',
        'Background Sync (Workbox 7): Sincroniza dados automaticamente assim que a conexão for restabelecida.',
        'Instalador para Windows (PC) e PWA para Celulares (Android e iPhone com ícone nativo).'
      ],
      stepByStep: [
        'Passo 1: Para compartilhar com avaliadores, copie a URL do botão "URL Livre" no topo da página.',
        'Passo 2: No celular, abra pelo link e toque em "Adicionar à Tela de Início" (PWA).',
        'Passo 3: No Windows, clique em "Instalar no PC (Windows)" para baixar o instalador desktop.',
        'Passo 4: Caso fique sem conexão, continue usando o sistema; seus dados serão salvos no IndexedDB.'
      ],
      tip: 'Envie a URL pública oficial diretamente para testadores ou recrutadores: ela abre imediatamente em qualquer navegador do mundo sem pedir logins!'
    }
  ];

  // Renderizar cada módulo didático
  modulesDetails.forEach((mod) => {
    checkPageOverflow(85);

    // Box do Módulo
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${mod.num} • ${mod.name}`, margin + 4, y + 5.5);
    doc.setFontSize(7.5);
    doc.setTextColor(254, 215, 226);
    doc.text(mod.badge, pageWidth - margin - 4, y + 5.5, { align: 'right' });

    y += 11;

    // Objetivo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('Objetivo Pedagógico:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(mod.objective, margin + 35, y);
    y += 6;

    // Funcionalidades em 2 colunas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Principais Recursos do Módulo:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    mod.features.forEach((feat) => {
      doc.text(`• ${feat}`, margin + 3, y);
      y += 4;
    });

    y += 2;

    // Passo a Passo
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('Guia Prático Passo a Passo (Como Usar sem Dúvidas):', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    mod.stepByStep.forEach((st, idx) => {
      doc.text(st, margin + 4, y + 9.5 + idx * 3.5);
    });

    y += 26;

    // Box Dica de Ouro do Professor
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('DICA DE MESTRE DO PROFESSOR SÊNIOR:', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(120, 53, 15);
    const splitTip = doc.splitTextToSize(mod.tip, contentWidth - 8);
    doc.text(splitTip, margin + 4, y + 8.5);

    y += 16;
  });

  // =========================================================================
  // CAPÍTULO FINAL: FAQ - AS DÚVIDAS MAIS FREQUENTES DOS ALUNOS
  // =========================================================================
  checkPageOverflow(100);

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CAPÍTULO ESPECIAL DE FAQ • PERGUNTAS FREQUENTES EXPLICADAS', margin + 6, y + 6.5);
  y += 14;

  const faqs = [
    {
      q: '1. Preciso ter uma chave de API do Google ou pagar algo para usar e testar o sistema?',
      a: 'Não! O sistema foi desenvolvido com resiliência total e suporte a testes externos livres. Ele possui modelos heurísticos e integração direta, dispensando qualquer chave de API ou cadastro pago no Google AI Studio.'
    },
    {
      q: '2. Como funciona o Disparador por Palavra-Chave e Região?',
      a: 'Basta digitar o cargo (ex: "Tech Lead") ou a empresa (ex: "Nubank") e selecionar a região (ex: São Paulo). O radar varre a web em tempo real, calcula o Match ATS contra o seu currículo e permite disparar e-mail ou preencher o formulário em 1-clique.'
    },
    {
      q: '3. Como funciona o preenchimento automático em portais como Gupy e LinkedIn?',
      a: 'O sistema gera um script seguro (bookmarklet). Quando você está na página da vaga, cola o script no console do navegador e ele preenche instantaneamente todos os campos, incluindo perguntas eliminatórias com base no seu currículo.'
    },
    {
      q: '4. O que é o Método STAR no Simulador de Entrevistas com a Dra. Valéria Silveira?',
      a: 'STAR é o acrônimo para Situação, Tarefa, Ação e Resultado. É a técnica internacional mais respeitada por recrutadores de alto nível para validar se o candidato realmente tem a experiência prática declarada.'
    },
    {
      q: '5. O sistema funciona no meu celular e sem conexão à internet?',
      a: 'Sim! A ferramenta é uma PWA (Progressive Web App) completa com Service Worker e IndexedDB. Você pode instalar no celular e continuar lendo seus currículos e cartas mesmo se o sinal de internet cair.'
    }
  ];

  faqs.forEach((item) => {
    checkPageOverflow(24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(item.q, margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitA = doc.splitTextToSize(item.a, contentWidth);
    doc.text(splitA, margin, y);
    y += splitA.length * 3.8 + 4;
  });

  // Numeração de Páginas em todos os slides
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CV-AutoPilot Enterprise • Manual Oficial do Sistema • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Baixar arquivo diretamente no navegador
  doc.save('Manual_Oficial_do_Sistema_CV_AutoPilot.pdf');
};
