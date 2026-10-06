// components/ScreenContextFAQModal.tsx
// Modal de FAQ e Guia Contextual presente em TODAS as telas do sistema
// Detalha minuciosamente as funcionalidades, botões, campos e tópicos específicos da tela ativa
import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Presentation,
  Send,
  FileText,
  Briefcase,
  Users,
  Compass,
  Mic,
  DollarSign,
  History,
  Laptop,
  Layers,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { generateSystemManualPdf } from '../services/systemManualPdfService';
import { generateSystemManualPptx } from '../services/systemManualPptxService';

export interface ScreenFAQData {
  id: string;
  name: string;
  badge: string;
  iconName: string;
  summary: string;
  objective: string;
  topics: Array<{
    title: string;
    description: string;
    elements: Array<{ name: string; type: string; purpose: string }>;
    howToUse: string[];
  }>;
  screenFaqs: Array<{
    question: string;
    answer: string;
    seniorTip: string;
  }>;
  goldenRule: string;
  commonPitfall: string;
}

interface ScreenContextFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  colors: any;
  theme: string;
  onNavigateToView?: (view: any) => void;
}

export const ScreenContextFAQModal: React.FC<ScreenContextFAQModalProps> = ({
  isOpen,
  onClose,
  currentView,
  colors,
  theme,
  onNavigateToView
}) => {
  // Tela selecionada no modal (inicia na tela em que o usuário está)
  const [selectedViewId, setSelectedViewId] = useState<string>(currentView);
  const [activeTab, setActiveTab] = useState<'topics' | 'faq' | 'tips'>('topics');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sincronizar selectedViewId quando currentView mudar
  React.useEffect(() => {
    setSelectedViewId(currentView);
    setOpenFaqIndices({ 0: true, 1: true });
    setFaqSearchQuery('');
  }, [currentView, isOpen]);

  // Base de dados exaustiva com todas as 13 telas do sistema
  const allScreensData: Record<string, ScreenFAQData> = useMemo(() => ({
    'cv-dispatcher': {
      id: 'cv-dispatcher',
      name: 'Disparador de Currículo (IA) & Radar Web',
      badge: 'Varredura por Palavra-Chave & Região',
      iconName: 'Send',
      summary: 'Varredura da internet em tempo real por vagas ativas (por cargo ou empresa) e região, com disparo formatado por e-mail e autofill em portais.',
      objective: 'Eliminar o trabalho manual de procurar e aplicar para vagas. A IA varre os portais, calcula a aderência ATS com seu currículo e permite disparos em 1-clique.',
      topics: [
        {
          title: 'Aba 1: Radar de Varredura Web (IA)',
          description: 'Mecanismo de busca profunda na internet para localizar vagas abertas em portais e sites de carreiras.',
          elements: [
            { name: 'Palavra-Chave', type: 'Input de Texto', purpose: 'Aceita o Cargo (ex: "Tech Lead") ou a Empresa (ex: "Nubank", "Itaú").' },
            { name: 'Região Alvo', type: 'Seletor Geográfico', purpose: 'Filtra por capitais (SP, RJ, Curitiba, BH, Floripa, Remoto) ou cidade personalizada.' },
            { name: 'Currículo Base', type: 'Dropdown', purpose: 'Seleciona qual currículo será usado para calcular o score de Match ATS.' },
            { name: 'Fazer Varredura Completa', type: 'Botão de Ação', purpose: 'Aciona a IA para rastrear vagas e exibir cards com salários e portais.' },
            { name: 'Multi-Disparo Automático', type: 'Botão em Lote', purpose: 'Salva todas as vagas encontradas de uma só vez no Kanban com lembrete de 5 dias.' }
          ],
          howToUse: [
            '1. Digite o cargo ou a empresa contratante na barra de busca.',
            '2. Selecione a região desejada (ex: São Paulo ou Remoto).',
            '3. Clique em "Fazer Varredura Completa".',
            '4. Avalie o % de Match ATS exibido no topo de cada card de oportunidade.'
          ]
        },
        {
          title: 'Aba 2: Disparo por E-mail Formatado',
          description: 'Gerador executivo de e-mails de alta conversão para vagas com contato direto de RH.',
          elements: [
            { name: 'Tom do E-mail', type: 'Seletor', purpose: 'Permite alternar entre tom Corporativo, Persuasivo ou Direto ao Ponto.' },
            { name: 'Gerar Pacote de E-mail', type: 'Botão', purpose: 'Cria o assunto de alto CTR e o corpo da carta de apresentação sob medida.' },
            { name: 'Copiar Assunto / Corpo', type: 'Botões de Cópia', purpose: 'Transfere o texto formatado para a área de transferência.' },
            { name: 'Abrir no Cliente de E-mail', type: 'Botão de Abertura', purpose: 'Abre seu Gmail ou Outlook com destinatário e mensagem prontos.' }
          ],
          howToUse: [
            '1. Preencha ou confirme os dados do recrutador e da empresa.',
            '2. Clique em "Gerar Pacote de E-mail".',
            '3. Revise a mensagem gerada e clique em "Copiar Corpo" ou "Abrir E-mail".'
          ]
        },
        {
          title: 'Aba 3: Disparo por Preenchimento de Vagas (Form Autofill)',
          description: 'Bookmarklet e script inteligente para preencher cadastros em Gupy, LinkedIn, Workday e Greenhouse.',
          elements: [
            { name: 'Portal Alvo', type: 'Seletor', purpose: 'Gupy, LinkedIn, Workday, Greenhouse, Lever, Catho, InfoJobs.' },
            { name: 'Script de Preenchimento', type: 'Código Bookmarklet', purpose: 'Script JS seguro que preenche formulários e respostas eliminatórias.' },
            { name: 'Copiar Script 1-Clique', type: 'Botão', purpose: 'Copia o script para colar no console (F12) da página da vaga.' }
          ],
          howToUse: [
            '1. Gere o pacote de formulário na aba de preenchimento.',
            '2. Abra a página da vaga no portal desejado.',
            '3. Abra o console do navegador (pressione F12) e cole o script.',
            '4. Pressione Enter: todos os campos, pretensão salarial e triagem serão preenchidos!'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como a busca por Empresa se diferencia da busca por Cargo?',
          answer: 'Se você digitar uma empresa (ex: "Itaú", "Mercado Livre"), o radar varre apenas as posições abertas naquela instituição. Se digitar um cargo (ex: "Tech Lead"), ele varre diversas empresas contratando para essa função na região escolhida.',
          seniorTip: 'Dica do Professor: Se seu objetivo é entrar em uma Big Tech ou Fintech específica, use o nome da empresa como palavra-chave principal.'
        },
        {
          question: 'Como funciona o cálculo do percentual de Match ATS exibido no card da vaga?',
          answer: 'A IA compara as competências do currículo selecionado com os requisitos técnicos da vaga varrida. Scores acima de 85% têm altíssima chance de passar sem atritos na triagem.',
          seniorTip: 'Dica do Professor: Priorize candidaturas para vagas com score acima de 85% para obter respostas mais rápidas dos recrutadores.'
        },
        {
          question: 'O que o Multi-Disparo Automático faz exatamente?',
          answer: 'Ele cadastra instantaneamente todas as vagas localizadas no seu Painel Kanban (Dashboard) na coluna "Aplicou", gerando registros de histórico e programando um alerta de follow-up para dali a 5 dias úteis.',
          seniorTip: 'Dica do Professor: O Multi-Disparo poupa até 40 minutos diários de preenchimento manual de planilhas.'
        }
      ],
      goldenRule: 'Sempre defina a região com precisão: vagas presenciais ou híbridas descartam candidatos de outros estados se a pretensão ou endereço não estiverem alinhados.',
      commonPitfall: 'Não altere o texto gerado de forma a remover as palavras-chave técnicas: elas foram calculadas pela IA especificamente para bater os algoritmos ATS do portal.'
    },

    'cv-manager': {
      id: 'cv-manager',
      name: 'Gerenciador de Currículos (CV Manager)',
      badge: 'Base de Dados & ATS Master',
      iconName: 'FileText',
      summary: 'Central de armazenamento, upload (.docx/.pdf/.txt), edição de perfis múltiplos, definição de CV Master e exportação em PDF corporativo.',
      objective: 'Manter seu histórico profissional organizado e padronizado em linguagem de alto impacto executivo, auditando a densidade de termos técnicos antes de submeter a qualquer vaga.',
      topics: [
        {
          title: 'Cadastro e Upload de Currículos',
          description: 'Importação automática com extração inteligente de seções profissionais.',
          elements: [
            { name: '+ Adicionar Currículo', type: 'Botão Principal', purpose: 'Abre formulário para criação manual ou upload de arquivo.' },
            { name: 'Área de Drop de Arquivo', type: 'Dropzone', purpose: 'Lê arquivos .DOCX, .PDF e .TXT extraindo texto sem perda de formatação.' },
            { name: 'Marcar como Master', type: 'Botão de Estado', purpose: 'Torna o currículo a referência padrão para todas as análises de IA do sistema.' },
            { name: 'Exportar PDF', type: 'Botão de Download', purpose: 'Gera documento A4 com tipografia balanceada e leitura de máquina 99%.' }
          ],
          howToUse: [
            '1. Clique em "+ Adicionar Novo Currículo".',
            '2. Arraste seu arquivo existente ou digite seus dados.',
            '3. Revise as informações extraídas (cargo, resumo executivo, histórico e competências).',
            '4. Defina o currículo prioritário como "Master".'
          ]
        },
        {
          title: 'Auditoria de Compatibilidade ATS',
          description: 'Análise de legibilidade algorítmica para grandes portais (Workday, Taleo, Greenhouse).',
          elements: [
            { name: 'Score de Densidade ATS', type: 'Indicador Numérico', purpose: 'Avalia se o currículo possui volume adequado de termos da área.' },
            { name: 'Lista de Competências Extraídas', type: 'Tags', purpose: 'Exibe as palavras-chave indexadas pelo sistema.' }
          ],
          howToUse: [
            '1. Abra o currículo desejado e confira o Score ATS exibido.',
            '2. Adicione termos de metodologias e ferramentas que estejam faltando.'
          ]
        },
        {
          title: 'Exportação em Lote & Arquivo Único (.PDF)',
          description: 'Seleção de múltiplos currículos para unificação em um dossiê executivo contínuo.',
          elements: [
            { name: 'Caixas de Seleção nos Cards', type: 'Checkbox', purpose: 'Permite marcar quais perfis farão parte do documento compilado.' },
            { name: 'Exportar em PDF Único', type: 'Botão de Ação em Lote', purpose: 'Abre o configurador de dossiê consolidado com capa, sumário e reordenação.' },
            { name: 'Reordenação de Perfis', type: 'Setas Cima/Baixo', purpose: 'Define a ordem sequencial dos currículos dentro do PDF único.' },
            { name: 'Capa & Sumário Dinâmico', type: 'Opções de Estrutura', purpose: 'Gera capa executiva com título customizado e índice apontando as páginas iniciais exatas.' }
          ],
          howToUse: [
            '1. Marque as caixas de seleção de dois ou mais currículos salvos.',
            '2. Clique em "Exportar em PDF Único" no topo ou na barra flutuante de seleção.',
            '3. Na janela de configuração, organize a ordem dos perfis, escolha o tema visual e customize o título.',
            '4. Clique em "Visualizar Prévia" para conferir o resultado ou "Gerar e Baixar PDF Único".'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como funciona a exportação em lote de currículos em arquivo único (.PDF)?',
          answer: 'O sistema permite selecionar múltiplos currículos e compilá-los em um único documento PDF corporativo contínuo. Cada currículo é formatado profissionalmente a partir de uma nova página, precedido por uma Capa Executiva com Sumário apontando as páginas iniciais exatas de cada perfil.',
          seniorTip: 'Dica do Professor: Esse recurso é ideal para apresentar diferentes versões do seu perfil (ex: Especialista Técnico, Gestor e Consultor) em um dossiê completo para comitês executivos de contratação.'
        },
        {
          question: 'O que acontece ao definir um currículo como "Master"?',
          answer: 'O currículo Master se torna a base padrão usada automaticamente pelo Disparador de Vagas, pelo Simulador de Entrevistas e pelos diagnósticos de compatibilidade.',
          seniorTip: 'Dica do Professor: Se você tiver mais de um perfil profissional, marque como Master aquele mais abrangente ou o que corresponde ao seu objetivo atual.'
        },
        {
          question: 'Por que o PDF exportado pelo sistema é superior a modelos visuais do Canva?',
          answer: 'Modelos visuais comuns usam caixas de texto flutuantes e colunas que embaralham os robôs ATS. O PDF do CV-AutoPilot foi desenhado com fluxo linear puro, garantindo 99% de aprovação na triagem óptica.',
          seniorTip: 'Dica do Professor: Em processos corporativos sérios, layout limpo e tipografia legível sempre superam firulas visuais coloridas.'
        }
      ],
      goldenRule: 'Mantenha suas realizações descritas com números de impacto (ex: "% de ganho", "R$ economizados", "tamanho do time liderado").',
      commonPitfall: 'Evite salvar currículos sem telefone ou com e-mail incorreto: o Disparador utiliza esses contatos diretamente nos e-mails aos recrutadores.'
    },

    'dashboard': {
      id: 'dashboard',
      name: 'Painel de Controle & Kanban de Candidaturas',
      badge: 'Esteira de Acompanhamento Executivo',
      iconName: 'Briefcase',
      summary: 'Funil seletivo com estágios Kanban, follow-ups no 5º dia útil, gráficos de desempenho semanal e exportação de dados.',
      objective: 'Proporcionar visão panorâmica de todo o seu pipeline de vagas, garantindo que você nunca perca o timing de contatar um recrutador ou acompanhar uma proposta.',
      topics: [
        {
          title: 'Quadro Kanban com 5 Estágios',
          description: 'Organização das vagas em colunas: Salvas, Aplicadas, Entrevistas, Propostas e Recusadas.',
          elements: [
            { name: 'Cartão de Vaga', type: 'Card Interativo', purpose: 'Exibe cargo, empresa, salário, link e data de lembrete de follow-up.' },
            { name: 'Arrastar e Soltar / Mover', type: 'Ação', purpose: 'Altera o status da vaga conforme o processo avança.' },
            { name: 'Filtros Rápidos', type: 'Botões', purpose: 'Filtra por empresa, período ou vagas com follow-up pendente.' }
          ],
          howToUse: [
            '1. Acompanhe suas aplicações nas colunas.',
            '2. Ao ser chamado para uma entrevista, mova o cartão para a coluna "Entrevistas".',
            '3. Clique no cartão para editar anotações ou adicionar o nome do entrevistador.'
          ]
        },
        {
          title: 'Alertas de Follow-up & Gráficos',
          description: 'Notificações inteligentes para acompanhamento de candidaturas.',
          elements: [
            { name: 'Tag de Lembrete', type: 'Badge Colorida', purpose: 'Alerta quando se passaram 5 dias da candidatura.' },
            { name: 'Exportar Planilha Excel', type: 'Botão', purpose: 'Baixa arquivo .xlsx consolidado com todas as candidaturas.' }
          ],
          howToUse: [
            '1. Consulte os cartões com alerta de follow-up.',
            '2. Envie uma mensagem breve de acompanhamento ao recrutador.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Por que o follow-up é calculado especificamente para 5 dias úteis?',
          answer: 'Pesquisas com headhunters mostram que 5 dias é a janela perfeita: tempo suficiente para o RH processar a triagem, mas recente o bastante para demonstrar alto engajamento do candidato.',
          seniorTip: 'Dica do Professor: Uma mensagem curta perguntando se precisam de dados adicionais reativa candidaturas paradas.'
        }
      ],
      goldenRule: 'Nunca deixe o quadro sem atualização semanal: alimente o pipeline com pelo menos 10 candidaturas novas por semana do Radar Web.',
      commonPitfall: 'Não exclua candidaturas recusadas: mova para a coluna "Recusadas" para que o sistema aprenda com seu histórico de conversão.'
    },

    'contact-extractor': {
      id: 'contact-extractor',
      name: 'Extrator Inteligente de Contatos de RH',
      badge: 'Prospecção Direta de Headhunters',
      iconName: 'Users',
      summary: 'Extração automática de e-mails corporativos, telefones, WhatsApp e perfis de LinkedIn a partir de anúncios brutos.',
      objective: 'Identificar os responsáveis diretos pela contratação a partir de anúncios no LinkedIn ou portais, permitindo uma abordagem consultiva e direcionada.',
      topics: [
        {
          title: 'Parser e Higienização de Contatos',
          description: 'Varredura por IA que filtra e-mails pessoais e de suporte, focando no time de Talent Acquisition.',
          elements: [
            { name: 'Área de Texto', type: 'Textarea', purpose: 'Recebe o texto copiado de posts, anúncios ou e-mails.' },
            { name: 'Extrair Contatos com IA', type: 'Botão', purpose: 'Processa o texto e extrai nomes, e-mails e celulares.' },
            { name: 'Chamar no WhatsApp Web', type: 'Botão de Ação', purpose: 'Abre conversa com mensagem executiva pronta.' },
            { name: 'Baixar Contatos em Excel', type: 'Botão', purpose: 'Gera planilha .xlsx com todos os contatos minerados.' }
          ],
          howToUse: [
            '1. Copie o texto de uma vaga divulgada no LinkedIn ou e-mail.',
            '2. Cole na caixa de texto e clique em "Extrair Contatos com IA".',
            '3. Veja a lista gerada e clique no ícone de WhatsApp para iniciar o contato.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'O extrator higieniza números para o formato do WhatsApp Brasil?',
          answer: 'Sim! Ele converte automaticamente qualquer formato de telefone para o padrão internacional com DDD (+55 DD 9XXXX-XXXX).',
          seniorTip: 'Dica do Professor: Utilize a mensagem profissional gerada pelo sistema para iniciar o contato de forma respeitosa e executiva.'
        }
      ],
      goldenRule: 'Sempre cite o nome do recrutador extraído na primeira frase da mensagem: isso remove a sensação de mensagem automática.',
      commonPitfall: 'Evite fazer ligações não solicitadas: dê preferência a um e-mail corporativo ou mensagem curta no WhatsApp em horário comercial.'
    },

    'job-tailored-cv': {
      id: 'job-tailored-cv',
      name: 'Otimizador de CV Sob Medida (Tailored Builder)',
      badge: 'Calibração Fina para Filtros ATS',
      iconName: 'Sparkles',
      summary: 'Reescrita cirúrgica de palavras-chave e tópicos do currículo para obter nota máxima em filtros ATS para uma vaga específica.',
      objective: 'Garantir que seu currículo passe sem restrições pelos robôs de triagem, inserindo exatamente os termos que o algoritmo da vaga procura.',
      topics: [
        {
          title: 'Alinhamento Semântico para ATS',
          description: 'Cruzamento dos requisitos mandatórios com as experiências reais do candidato.',
          elements: [
            { name: 'Selecionar Currículo Base', type: 'Dropdown', purpose: 'Escolhe qual perfil será customizado.' },
            { name: 'Descrição da Vaga', type: 'Textarea', purpose: 'Recebe o texto integral dos requisitos da vaga.' },
            { name: 'Otimizar Currículo Sob Medida', type: 'Botão de IA', purpose: 'Gera a versão adaptada calibrada para o anúncio.' },
            { name: 'Baixar CV Adaptado', type: 'Botão', purpose: 'Exporta o documento formatado pronto para envio.' }
          ],
          howToUse: [
            '1. Selecione o currículo base e cole o texto da vaga.',
            '2. Clique em "Otimizar Currículo Sob Medida".',
            '3. Revise as alterações semânticas sugeridas e faça o download.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'A IA inventa experiências que eu nunca tive?',
          answer: 'Não! O modelo foi calibrado com diretrizes éticas estritas: ele reescreve e realça suas experiências reais usando os termos técnicos exatos da vaga, sem inventar cargos ou competências fictícias.',
          seniorTip: 'Dica do Professor: Enviar um currículo adaptado para cada vaga prioritária aumenta em 8 vezes a taxa de resposta dos recrutadores.'
        }
      ],
      goldenRule: 'Sempre confira se as 5 principais palavras-chave da vaga aparecem no resumo executivo e na última experiência profissional.',
      commonPitfall: 'Não envie o mesmo currículo genérico para vagas com senioridades diferentes: calibre sempre que a vaga for estratégica.'
    },

    'job-analyzer': {
      id: 'job-analyzer',
      name: 'Diagnóstico de Compatibilidade (Job Match Analyzer)',
      badge: 'Score Percentual & Gap Analysis',
      iconName: 'Compass',
      summary: 'Score numérico (0 a 100%), mapeamento de lacunas e recomendações de mitigação de requisitos para a vaga.',
      objective: 'Saber com precisão matemática sua probabilidade de aprovação antes de aplicar, descobrindo quais competências faltam e como defendê-las na entrevista.',
      topics: [
        {
          title: 'Auditoria de Job Description',
          description: 'Classificação de requisitos mandatórios vs. desejáveis.',
          elements: [
            { name: 'Match Score (%)', type: 'Medidor Circular', purpose: 'Pontuação de aderência técnica e comportamental.' },
            { name: 'Requisitos Atendidos', type: 'Lista Verde', purpose: 'Pontos fortes que você deve enfatizar na entrevista.' },
            { name: 'Gaps & Recomendações', type: 'Lista Amarela', purpose: 'Competências faltantes e argumentos para compensá-las.' }
          ],
          howToUse: [
            '1. Cole a vaga e execute o diagnóstico.',
            '2. Se o score for > 80%, aplique imediatamente; se for < 70%, utilize o Otimizador de CV.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'O que fazer quando o Match Score está entre 65% e 75%?',
          answer: 'Verifique se os gaps são requisitos mandatórios ou apenas desejáveis. Se forem desejáveis, aplique destacando sua velocidade de aprendizado em ferramentas correlatas.',
          seniorTip: 'Dica do Professor: Empresas raramente encontram candidatos com 100% de match; estar acima de 75% já coloca você na esteira de entrevistas.'
        }
      ],
      goldenRule: 'Priorize os requisitos mandatórios: se faltar um requisito eliminatório indispensável, procure outra vaga no radar.',
      commonPitfall: 'Não desista de vagas apenas porque falta uma ferramenta secundária: mencione na entrevista tecnologias equivalentes que você já domina.'
    },

    'ai-tools': {
      id: 'ai-tools',
      name: 'Ferramentas de IA & Algoritmo ATS',
      badge: 'Calibração Avançada de Keywords',
      iconName: 'Wand',
      summary: 'Auditoria profunda de termos técnicos e alinhamento contra filtros de triagem Workday, Taleo, Greenhouse e Gupy.',
      objective: 'Garantir que seu perfil técnico não seja descartado por robôs por causa de sinônimos incompatíveis ou falta de termos mandatórios da indústria.',
      topics: [
        {
          title: 'Auditoria de Keywords e Match Semântico',
          description: 'Verificação da densidade de termos técnicos no perfil.',
          elements: [
            { name: 'Matriz de Termos ATS', type: 'Tabela', purpose: 'Mapeia tecnologias requeridas no seu segmento de mercado.' },
            { name: 'Sugestões de Sinônimos', type: 'Tags', purpose: 'Mostra como diferentes portais chamam a mesma competência.' }
          ],
          howToUse: [
            '1. Analise os termos recomendados para seu cargo.',
            '2. Incorpore os termos sugeridos no seu currículo Master.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'O que são sinônimos de ATS?',
          answer: 'São variações que os robôs procuram: por exemplo, "Engenheiro de Software", "Desenvolvedor Full Stack" e "Programador Sênior". O sistema garante que seu texto contenha essas variações.',
          seniorTip: 'Dica do Professor: Inclua a sigla e o nome por extenso de metodologias (ex: "CI/CD (Integração e Entrega Contínua)").'
        }
      ],
      goldenRule: 'Use termos padronizados pelo mercado em vez de nomenclaturas internas da sua empresa anterior.',
      commonPitfall: 'Evite acumular termos sem contexto: os robôs modernos penalizam o "keyword stuffing" (empilhar palavras-chave sem frases reais).'
    },

    'creative-studio': {
      id: 'creative-studio',
      name: 'Simulador STAR por Voz (Dra. Valéria)',
      badge: 'Treinamento Verbal pelo Método STAR',
      iconName: 'Mic',
      summary: 'Treinamento oral em tempo real com a Headhunter Virtual, com perguntas técnicas e comportamentais.',
      objective: 'Destravar sua comunicação verbal e eliminar a ansiedade da entrevista real, treinando respostas estruturadas pelo consagrado método STAR (Situação, Tarefa, Ação e Resultado).',
      topics: [
        {
          title: 'Simulação Verbal em Tempo Real',
          description: 'Interação por áudio bidirecional com avaliação de síntese e impacto.',
          elements: [
            { name: 'Dra. Valéria Silveira', type: 'Avatar da Headhunter', purpose: 'Conduz a entrevista simulada de acordo com seu cargo.' },
            { name: 'Conectar Microfone', type: 'Botão de Áudio', purpose: 'Ativa captura de voz segura no navegador.' },
            { name: 'Iniciar Simulação', type: 'Botão Principal', purpose: 'Inicia a rodada de perguntas da recrutadora.' },
            { name: 'Relatório Executivo', type: 'Dossiê em PDF', purpose: 'Emite notas de clareza, concisão e poder de persuasão.' }
          ],
          howToUse: [
            '1. Conecte o microfone e inicie a simulação.',
            '2. Responda verbalmente à pergunta da Dra. Valéria seguindo o método STAR.',
            '3. Ouça o feedback imediato e avance para as próximas perguntas.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como estruturar minha resposta no método STAR?',
          answer: 'S = Situação (descreva o cenário em 20 segundos); T = Tarefa (qual era a sua missão ou problema); A = Ação (o que você fez na prática); R = Resultado (número ou benefício alcançado).',
          seniorTip: 'Dica do Professor: O recrutador quer ouvir a sua ação individual ("eu decidi", "eu liderei"), não apenas do time.'
        }
      ],
      goldenRule: 'Nunca termine uma resposta sem citar o resultado quantitativo: métricas são o que convencem a diretoria.',
      commonPitfall: 'Evite gastar mais de 40 segundos apenas na introdução da história: vá direto ao desafio e à solução.'
    },

    'personal-swot': {
      id: 'personal-swot',
      name: 'Análise SWOT Pessoal de Carreira',
      badge: 'Posicionamento Estratégico & Dossiê',
      iconName: 'Compass',
      summary: 'Matriz Forças, Fraquezas, Oportunidades e Ameaças com exportação de Dossiê Executivo em PDF.',
      objective: 'Mapear analiticamente suas competências contra as tendências de mercado, criando um plano de ação para alavancar sua remuneração e mitigar riscos profissionais.',
      topics: [
        {
          title: 'Matriz Estratégica 2x2',
          description: 'Cruzamento das competências internas com as demandas do mercado.',
          elements: [
            { name: 'Forças (Strengths)', type: 'Quadrante Verde', purpose: 'Diferenciais competitivos que colocam você à frente.' },
            { name: 'Fraquezas (Weaknesses)', type: 'Quadrante Amarelo', purpose: 'Lacunas técnicas que precisam de capacitação.' },
            { name: 'Oportunidades (Opportunities)', type: 'Quadrante Azul', purpose: 'Áreas de alta demanda e escassez de profissionais.' },
            { name: 'Ameaças (Threats)', type: 'Quadrante Vermelho', purpose: 'Riscos de obsolescência, automação ou crise no setor.' },
            { name: 'Exportar Dossiê em PDF', type: 'Botão de Download', purpose: 'Gera relatório executivo completo para seu PDI.' }
          ],
          howToUse: [
            '1. Selecione o currículo base e clique em "Gerar Matriz SWOT Pessoal".',
            '2. Analise os 4 quadrantes e as estratégias de alavancagem.',
            '3. Exporte o Dossiê Executivo em PDF para guiar seu plano de carreira.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como usar a matriz SWOT para responder "Qual seu maior defeito?" na entrevista?',
          answer: 'Declare uma das Fraquezas identificadas na matriz e em seguida apresente o plano de ação concreto que você já está executando para superá-la.',
          seniorTip: 'Dica do Professor: Admitir uma fraqueza acompanhada de um plano de estudos transmite maturidade e autoliderança.'
        }
      ],
      goldenRule: 'Utilize suas Forças para capturar as Oportunidades mais bem remuneradas identificadas no mercado.',
      commonPitfall: 'Não ignore as Ameaças de mercado: capacite-se nas novas tecnologias antes que elas se tornem mandatórias.'
    },

    'salary-benchmark': {
      id: 'salary-benchmark',
      name: 'Benchmarking Salarial Regionalizado',
      badge: 'Remuneração Real com Search Grounding',
      iconName: 'DollarSign',
      summary: 'Pesquisa salarial em tempo real com Search Grounding por cargo, senioridade e região geográfica.',
      objective: 'Descobrir a remuneração exata praticada no mercado brasileiro por cargo, modelo de contratação (CLT vs. PJ) e estado, evitando pretensões fora da realidade.',
      topics: [
        {
          title: 'Pesquisa Salarial com Search Grounding',
          description: 'Dados ancorados ao vivo em tabelas corporativas e portais de contratação.',
          elements: [
            { name: 'Cargo Pretendido', type: 'Input', purpose: 'Nome da posição (ex: "Tech Lead", "Engenheiro de Dados").' },
            { name: 'Estado / Região', type: 'Seletor', purpose: 'Filtra pela unidade federativa ou modelo remoto.' },
            { name: 'Gráfico Piso • Mediana • Teto', type: 'Visualização', purpose: 'Faixas de remuneração P25, P50 e P90.' },
            { name: 'Calculadora CLT vs. PJ', type: 'Card Comparativo', purpose: 'Compara salário líquido e impostos estimados.' }
          ],
          howToUse: [
            '1. Informe o cargo e a região pretendida.',
            '2. Clique em "Consultar Faixas Salariais com Search Grounding".',
            '3. Use a mediana como referência de pretensão salarial no Disparador.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como definir minha pretensão salarial no formulário da vaga?',
          answer: 'Defina a mediana (P50) como valor mínimo aceitável e o teto (P90) como objetivo de negociação.',
          seniorTip: 'Dica do Professor: Nunca deixe o campo salarial em branco ou como "A combinar": robôs ATS descartam perfis sem valor numérico.'
        }
      ],
      goldenRule: 'Considere a variação de custo de vida e impostos ao comparar propostas CLT e contratos PJ.',
      commonPitfall: 'Evite pedir o teto salarial logo na primeira triagem se você ainda não comprova todos os requisitos mandatórios da vaga.'
    },

    'lead-finder': {
      id: 'lead-finder',
      name: 'Pesquisa 360° de Candidatos & Currículos Locais',
      badge: 'Busca 360° Regional & Bairros',
      iconName: 'Target',
      summary: 'Varredura profunda por estados, cidades e bairros integrados para identificar candidatos, currículos e vagas locais.',
      objective: 'Permitir que recrutadores e profissionais encontrem talentos e conexões locais em qualquer cidade ou bairro do Brasil com integração de dados geográficos.',
      topics: [
        {
          title: 'Busca Geográfica 360°',
          description: 'Mapeamento por CEP, cidade, estado e polo corporativo.',
          elements: [
            { name: 'Seletor de Estado e Cidade', type: 'Filtro Duplo', purpose: 'Mapeia municípios e bairros cadastrados.' },
            { name: 'Filtro por Especialidade', type: 'Tags', purpose: 'Filtra por tecnologia ou área de atuação.' },
            { name: 'Exportar Base Local', type: 'Botão', purpose: 'Exporta os dados em formato de planilha.' }
          ],
          howToUse: [
            '1. Selecione o estado e a cidade desejada.',
            '2. Escolha o segmento ou cargo para filtrar os perfis locais.',
            '3. Visualize as informações consolidadas da região.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Para quem serve a Pesquisa 360° Local?',
          answer: 'Serve para recrutadores buscando talentos específicos em determinada cidade e para candidatos mapeando vagas presenciais próximas à sua residência.',
          seniorTip: 'Dica do Professor: Buscar vagas na mesma cidade ou bairro reduz o tempo de deslocamento e aumenta o interesse do empregador.'
        }
      ],
      goldenRule: 'Ao buscar vagas locais, valorize a proximidade geográfica como um ponto forte de estabilidade na entrevista.',
      commonPitfall: 'Não esqueça de verificar a exigência de modelo híbrido ao pesquisar por regiões fora do seu domicílio atual.'
    },

    'form-autofill': {
      id: 'form-autofill',
      name: 'Auto-Preenchimento de Formulários de Vagas (IA)',
      badge: 'Gupy • Workday • Greenhouse',
      iconName: 'Zap',
      summary: 'Preenchimento automatizado de campos cadastrais, redações de motivação e respostas para perguntas eliminatórias.',
      objective: 'Acelerar o preenchimento de candidaturas longas e repetitivas em portais ATS, gerando respostas personalizadas alinhadas à cultura de cada empresa.',
      topics: [
        {
          title: 'Respostas de Triagem & Bookmarklet',
          description: 'Cálculo de respostas estratégicas para perguntas frequentes de RH.',
          elements: [
            { name: 'Portal Selecionado', type: 'Seletor', purpose: 'Adapta a formatação para Gupy, LinkedIn ou Workday.' },
            { name: 'Script de Inserção 1-Clique', type: 'Código Seguro', purpose: 'Preenche os campos da página da vaga instantaneamente.' },
            { name: 'Respostas de Triagem', type: 'Cards de Perguntas', purpose: 'Exibe as respostas ideais de pretensão e mobilidade.' }
          ],
          howToUse: [
            '1. Selecione o portal da vaga.',
            '2. Clique em "Gerar Script de Preenchimento".',
            '3. Cole o script no console do navegador (F12) na página de inscrição da vaga.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'O script pode danificar minha conta no portal?',
          answer: 'Não! O script é um bookmarklet client-side seguro: ele apenas localiza os campos de texto do formulário e insere seus dados cadastrais, exatamente como se você estivesse digitando manualmente.',
          seniorTip: 'Dica do Professor: O script preenche campos com segurança e economiza até 20 minutos por candidatura.'
        }
      ],
      goldenRule: 'Revise sempre as respostas de redação geradas antes de submeter a inscrição final no portal.',
      commonPitfall: 'Não altere o link da vaga durante a geração: o sistema usa a URL para identificar o nome e as regras do portal.'
    },

    'history': {
      id: 'history',
      name: 'Central de Histórico & Dossiê Consolidado',
      badge: 'Auditoria & Repositório de Documentos',
      iconName: 'History',
      summary: 'Repositório cronológico de todas as candidaturas, cartas de apresentação, currículos gerados e diagnósticos.',
      objective: 'Manter a rastreabilidade total de todas as interações e documentos produzidos, permitindo recuperar qualquer carta ou currículo com 1-clique.',
      topics: [
        {
          title: 'Auditoria e Recuperação de Documentos',
          description: 'Histórico com carimbo de data, versão e contexto de cada geração realizada.',
          elements: [
            { name: 'Filtro por Tipo', type: 'Dropdown', purpose: 'Currículos, Cartas, Diagnósticos ou Disparos.' },
            { name: 'Busca por Empresa', type: 'Input', purpose: 'Localiza instantaneamente cartas enviadas a uma empresa.' },
            { name: 'Baixar Dossiê Consolidado', type: 'Botão de Download', purpose: 'Reúne todas as análises em um único PDF corporativo.' }
          ],
          howToUse: [
            '1. Filtre ou busque o documento desejado.',
            '2. Clique em "Visualizar" para reler a carta ou diagnóstico.',
            '3. Baixe o PDF consolidado para apresentar a mentores.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'Como o histórico me ajuda antes de uma entrevista?',
          answer: 'Você pode reler exatamente qual carta de apresentação e quais argumentos enviou para aquela empresa, garantindo total coerência durante a conversa.',
          seniorTip: 'Dica do Professor: Releia a carta 15 minutos antes da entrevista para refrescar suas métricas e argumentos.'
        }
      ],
      goldenRule: 'Mantenha o histórico preservado: ele serve de base para medir sua evolução e taxa de retorno.',
      commonPitfall: 'Evite limpar o cache do navegador sem antes exportar seus dados se estiver em computador compartilhado.'
    },

    'faq-manual': {
      id: 'faq-manual',
      name: 'Manual do Sistema & FAQ Interativo',
      badge: 'PDF • PPTX • Prof. Sênior',
      iconName: 'BookOpen',
      summary: 'Guia didático de todas as telas, funcionalidades, exportação em PDF e slides em PowerPoint (.pptx).',
      objective: 'Garantir que usuários e testadores externos compreendam 100% da ferramenta, sem dúvidas operacionais, com opção de baixar o material completo em PDF e PPTX.',
      topics: [
        {
          title: 'Downloads Oficiais e Guia Didático',
          description: 'Apostila executiva em PDF e apresentação em slides .pptx.',
          elements: [
            { name: 'Baixar Manual em PDF', type: 'Botão', purpose: 'Gera PDF A4 completo com todas as seções e tabelas.' },
            { name: 'Baixar Slides em PPTX', type: 'Botão', purpose: 'Gera apresentação de 16 slides pronta para PowerPoint.' },
            { name: 'FAQ com Busca', type: 'Busca em Tempo Real', purpose: 'Filtra respostas imediatas para dúvidas frequentes.' }
          ],
          howToUse: [
            '1. Navegue entre as abas para consultar qualquer tela.',
            '2. Clique em "Baixar Manual em PDF" ou "Baixar Slides em PPTX" para levar o material consigo.'
          ]
        }
      ],
      screenFaqs: [
        {
          question: 'O material baixado em PPTX pode ser editado?',
          answer: 'Sim! Os slides são gerados no formato nativo do Microsoft PowerPoint (.pptx), totalmente editáveis no Google Apresentações, Keynote ou LibreOffice.',
          seniorTip: 'Dica do Professor: Utilize os slides para apresentações de negócios, demonstrações de produto ou treinamentos.'
        }
      ],
      goldenRule: 'Consulte o manual sempre que tiver dúvida sobre a melhor prática de preenchimento de cada tela.',
      commonPitfall: 'Não guarde dúvidas: use a busca em tempo real para encontrar respostas imediatas sobre qualquer tópico.'
    }
  }), []);

  if (!isOpen) return null;

  const currentData: ScreenFAQData = allScreensData[selectedViewId] || allScreensData['cv-dispatcher'];

  // Filtragem de tópicos/funcionalidades da tela em tempo real por palavra-chave
  const filteredTopics = useMemo(() => {
    if (!faqSearchQuery.trim()) return currentData.topics;
    const q = faqSearchQuery.toLowerCase().trim();
    return currentData.topics.filter(top =>
      top.title.toLowerCase().includes(q) ||
      top.description.toLowerCase().includes(q) ||
      top.elements.some(elem =>
        elem.name.toLowerCase().includes(q) ||
        elem.purpose.toLowerCase().includes(q) ||
        elem.type.toLowerCase().includes(q)
      ) ||
      top.howToUse.some(step => step.toLowerCase().includes(q))
    );
  }, [currentData.topics, faqSearchQuery]);

  // Filtragem de perguntas da tela em tempo real por palavra-chave
  const filteredScreenFaqs = useMemo(() => {
    if (!faqSearchQuery.trim()) return currentData.screenFaqs;
    const q = faqSearchQuery.toLowerCase().trim();
    return currentData.screenFaqs.filter(faq =>
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      faq.seniorTip.toLowerCase().includes(q)
    );
  }, [currentData.screenFaqs, faqSearchQuery]);

  // Auto-expandir dúvidas quando usuário pesquisar
  React.useEffect(() => {
    if (faqSearchQuery.trim().length >= 2) {
      const allOpen: Record<number, boolean> = {};
      filteredScreenFaqs.forEach((_, idx) => {
        allOpen[idx] = true;
      });
      setOpenFaqIndices(allOpen);
    }
  }, [faqSearchQuery, filteredScreenFaqs]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Download do Manual Completo em PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportNotice('Gerando Manual Completo em PDF...');
      await generateSystemManualPdf({ themeColorHex: colors.primary });
      setExportNotice('✓ Manual em PDF baixado com sucesso!');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error(err);
      setExportNotice('Erro ao gerar PDF do manual.');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download em PPTX
  const handleDownloadPptx = async () => {
    try {
      setIsExportingPptx(true);
      setExportNotice('Gerando Apresentação em PowerPoint (.PPTX)...');
      await generateSystemManualPptx({ themeColorHex: colors.primary });
      setExportNotice('✓ Apresentação em PowerPoint (.PPTX) baixada com sucesso!');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error(err);
      setExportNotice('Erro ao gerar apresentação em PPTX.');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(5px)'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          backgroundColor: colors.surface || '#ffffff',
          borderRadius: '20px',
          border: `1.5px solid ${colors.borderFocus || '#881337'}`,
          color: colors.textPrimary || '#1f2937',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* HEADER DO MODAL */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)',
              flexShrink: 0
            }}>
              <HelpCircle size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  FAQ & Guia Explicativo Desta Tela
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.borderFocus}`
                }}>
                  {currentData.badge}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Instruções didáticas do <strong>Prof. Dr. Armando Valadares</strong> para operar esta tela sem dúvidas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Atalhos para baixar PDF ou PPTX */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: isExportingPdf ? 'not-allowed' : 'pointer'
              }}
              title="Baixar Manual Oficial em PDF"
            >
              <Download size={13} />
              <span>{isExportingPdf ? 'PDF...' : 'Baixar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPptx}
              disabled={isExportingPptx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: isExportingPptx ? 'not-allowed' : 'pointer'
              }}
              title="Baixar Apresentação em PowerPoint (.pptx)"
            >
              <Presentation size={13} />
              <span>{isExportingPptx ? 'PPTX...' : 'Baixar PPTX'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FEEDBACK DE EXPORTAÇÃO */}
        {exportNotice && (
          <div style={{
            padding: '8px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#059669',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={14} />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* BARRA DE SELEÇÃO RÁPIDA DE TELAS DO SISTEMA */}
        <div style={{
          padding: '12px 24px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: colors.textMuted, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
            Explorar FAQ de Outra Tela:
          </span>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {Object.values(allScreensData).map(scr => {
              const isSelected = selectedViewId === scr.id;
              return (
                <button
                  key={scr.id}
                  type="button"
                  onClick={() => setSelectedViewId(scr.id)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '8px',
                    border: isSelected ? `1px solid ${colors.primaryHover || '#be123c'}` : `1px solid ${colors.border}`,
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    color: isSelected ? '#ffffff' : colors.textSecondary,
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {scr.name.split(' (')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRA DE PESQUISA EM TEMPO REAL NO TOPO DO FAQ & GUIA */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: colors.textMuted }} />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={e => setFaqSearchQuery(e.target.value)}
              placeholder="Pesquisar em tempo real: perguntas, tópicos, botões ou palavras-chave desta tela..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 38px',
                borderRadius: '10px',
                backgroundColor: colors.inputBg || colors.surface,
                border: `1.5px solid ${faqSearchQuery.trim() ? (colors.primaryHover || '#be123c') : colors.border}`,
                color: colors.inputText,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: faqSearchQuery.trim() ? '0 2px 8px rgba(136, 19, 55, 0.12)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
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
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: colors.textMuted, fontWeight: 700 }}>Filtros rápidos:</span>
              {['ATS', 'Palavra-Chave', 'Varredura', 'Passo a Passo', 'Botões', 'Dica Sênior'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setFaqSearchQuery(chip)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${faqSearchQuery === chip ? colors.primary : colors.border}`,
                    backgroundColor: faqSearchQuery === chip ? colors.primaryLight : colors.surface,
                    color: faqSearchQuery === chip ? colors.primary : colors.textSecondary,
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {faqSearchQuery.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <span style={{ color: colors.primary }}>
                  {filteredTopics.length} {filteredTopics.length === 1 ? 'tópico' : 'tópicos'}
                </span>
                <span style={{ color: colors.textMuted }}>•</span>
                <span style={{ color: '#d97706' }}>
                  {filteredScreenFaqs.length} {filteredScreenFaqs.length === 1 ? 'dúvida' : 'dúvidas'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO MODAL */}
        <div style={{
          padding: '10px 24px 0 24px',
          backgroundColor: colors.surface,
          display: 'flex',
          gap: '12px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'topics' ? `2px solid ${colors.primary}` : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: activeTab === 'topics' ? colors.primary : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={15} />
            <span>Funcionalidades & Tópicos</span>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '8px',
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              fontWeight: 800
            }}>
              {filteredTopics.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'faq' ? `2px solid ${colors.primary}` : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: activeTab === 'faq' ? colors.primary : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={15} />
            <span>Dúvidas Frequentes</span>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '8px',
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              fontWeight: 800
            }}>
              {filteredScreenFaqs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'tips' ? `2px solid ${colors.primary}` : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: activeTab === 'tips' ? colors.primary : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lightbulb size={15} />
            <span>Dicas do Professor Sênior</span>
          </button>
        </div>

        {/* CORPO DO MODAL (ROLÁVEL) */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: '66vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Card Resumo do Módulo */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                {currentData.name}
              </span>
              {onNavigateToView && selectedViewId !== currentView && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToView(selectedViewId);
                    onClose();
                  }}
                  style={{
                    background: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>Ir para esta Tela</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
              {currentData.objective}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* ABA 1: FUNCIONALIDADES & TÓPICOS                                         */}
          {/* ========================================================================= */}
          {activeTab === 'topics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {filteredTopics.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  borderRadius: '14px',
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <HelpCircle size={32} color={colors.textMuted} />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: colors.textPrimary }}>
                    Nenhum tópico encontrado para "{faqSearchQuery}"
                  </span>
                  <span style={{ fontSize: '12.5px', color: colors.textSecondary, maxWidth: '460px', lineHeight: 1.5 }}>
                    Tente palavras-chave mais genéricas (ex: "botão", "passo a passo", "ATS", "radar") ou limpe o filtro para ver todos os tópicos desta tela.
                  </span>
                  <button
                    type="button"
                    onClick={() => setFaqSearchQuery('')}
                    style={{
                      marginTop: '6px',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Limpar Pesquisa
                  </button>
                </div>
              ) : (
                filteredTopics.map((top, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      borderRadius: '14px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      padding: '18px 20px',
                      boxShadow: colors.shadowSm,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: colors.primary }}>
                        {top.title}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                        {top.description}
                      </p>
                    </div>

                    {/* Elementos, Campos e Botões */}
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Anatomia de Botões e Campos deste Tópico:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                        {top.elements.map((elem, eIdx) => (
                          <div
                            key={eIdx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: colors.background,
                              border: `1px solid ${colors.border}`,
                              fontSize: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                                {elem.type}
                              </span>
                              <strong style={{ color: colors.textPrimary }}>{elem.name}</strong>
                            </div>
                            <span style={{ color: colors.textSecondary, fontSize: '11.5px', lineHeight: 1.4 }}>
                              {elem.purpose}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roteiro Como Usar */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Instrução Passo a Passo:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {top.howToUse.map((stepStr, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', gap: '6px' }}>
                            <span style={{ color: colors.primary, fontWeight: 800 }}>•</span>
                            <span>{stepStr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: DÚVIDAS FREQUENTES DESTA TELA (FAQ)                               */}
          {/* ========================================================================= */}
          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredScreenFaqs.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  borderRadius: '14px',
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <HelpCircle size={32} color={colors.textMuted} />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: colors.textPrimary }}>
                    Nenhuma dúvida encontrada para "{faqSearchQuery}"
                  </span>
                  <span style={{ fontSize: '12.5px', color: colors.textSecondary, maxWidth: '460px', lineHeight: 1.5 }}>
                    Tente buscar por outras palavras ou clique abaixo para ver todas as dúvidas desta tela.
                  </span>
                  <button
                    type="button"
                    onClick={() => setFaqSearchQuery('')}
                    style={{
                      marginTop: '6px',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Limpar Pesquisa
                  </button>
                </div>
              ) : (
                filteredScreenFaqs.map((faq, fIdx) => {
                  const isOpen = !!openFaqIndices[fIdx];
                  return (
                    <div
                      key={fIdx}
                      style={{
                        borderRadius: '12px',
                        border: `1px solid ${isOpen ? (colors.borderFocus || '#881337') : colors.border}`,
                        backgroundColor: colors.surface,
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(fIdx)}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: colors.textPrimary }}>
                          {faq.question}
                        </span>
                        {isOpen ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: '0 16px 16px 16px',
                          borderTop: `1px solid ${colors.borderSubtle}`,
                          paddingTop: '12px'
                        }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.55 }}>
                            {faq.answer}
                          </p>
                          <div style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(217, 119, 6, 0.08)',
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Lightbulb size={15} color="#d97706" style={{ flexShrink: 0 }} />
                            <span>{faq.seniorTip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: DICAS DO PROFESSOR SÊNIOR & PONTOS DE ATENÇÃO                     */}
          {/* ========================================================================= */}
          {activeTab === 'tips' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Regra de Ouro */}
              <div style={{
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                border: '1.5px solid rgba(217, 119, 6, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '14px' }}>
                  <Lightbulb size={20} />
                  <span>REGRA DE OURO DO PROFESSOR SÊNIOR:</span>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: colors.textPrimary, lineHeight: 1.6 }}>
                  {currentData.goldenRule}
                </p>
              </div>

              {/* Ponto Crítico / O que Evitar */}
              <div style={{
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '14px' }}>
                  <AlertCircle size={20} />
                  <span>ARMADILHA FREQUENTE PARA EVITAR NESTA TELA:</span>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: colors.textPrimary, lineHeight: 1.6 }}>
                  {currentData.commonPitfall}
                </p>
              </div>

              {/* Chamada para o Manual Geral */}
              {onNavigateToView && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: colors.textPrimary, display: 'block' }}>
                      Quer o manual impresso completo com todas as 11 telas?
                    </strong>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                      Acesse a tela do Manual Geral ou faça o download imediato em PDF ou PowerPoint.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToView('faq-manual');
                      onClose();
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Ir para o Manual Geral</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12px',
          color: colors.textMuted
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>CV-AutoPilot Enterprise • Guia Contextual de Tela Ativa</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
