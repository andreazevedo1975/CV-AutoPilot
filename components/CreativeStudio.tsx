// Enhanced CreativeStudio - Dra. Valéria Silveira, Senior HR Director & Master Career Strategist
import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChatMessage } from '../types';
import { chat } from '../services/geminiService';
import { InterviewSimulator } from './InterviewSimulator';
import { 
  SendIcon, 
  RefreshCwIcon, 
  DownloadIcon, 
  CopyIcon, 
  CheckCircleIcon,
  ExternalLinkIcon,
  MicIcon
} from './icons';
import { ThemeContext } from '../App';

const HR_DIRECTOR_AVATAR = "/src/assets/images/hr_director_avatar_1789832765437.jpg";

const INITIAL_WELCOME: ChatMessage = {
  role: 'model',
  text: `Olá! Sou a **Dra. Valéria Silveira**, Diretora Sênior de Recursos Humanos (Chief People Officer) e Orientadora Master de Carreira Executiva do **CV-AutoPilot**.

Com mais de duas décadas presidindo comitês de promoção C-Level, contratações estratégicas e People Analytics em corporações globais, minha missão aqui é elevar o seu posicionamento ao mais alto patamar de competitividade do mercado.

### 🌟 Pilares em que posso acelerar seus resultados hoje:
- 🎯 **Simulação Rigorosa de Entrevista (Método STAR)**: Conduzo perguntas comportamentais com avaliação em tempo real e reescrita de respostas para o padrão executivo.
- 💼 **Estratégia de Negociação Salarial (Total Compensation)**: Calibramos pacotes de remuneração fixa, bônus (PLR), equity/stock options e contrapropostas elegantes.
- 🔍 **Auditoria Crítica de Posicionamento & ATS**: Identificamos gargalos que reprovam currículos nos robôs de triagem e nos primeiros 6 segundos do olhar humano.
- 🚀 **Transição de Carreira & Pitch Executivo**: Estruturamos narrativas de valor e justificativas maduras para mudanças de rumo profissional.

Selecione um dos temas rápidos abaixo ou digite sua dúvida diretamente para começarmos!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

interface QuickPill {
  id: string;
  icon: string;
  category: 'entrevista' | 'salario' | 'ats' | 'transicao';
  label: string;
  prompt: string;
}

const QUICK_PILLS: QuickPill[] = [
  {
    id: 'star-interview',
    icon: '🎯',
    category: 'entrevista',
    label: 'Simulação STAR (Liderança/Sênior)',
    prompt: 'Dra. Valéria, por favor inicie uma simulação de entrevista para uma vaga de liderança/sênior. Faça a primeira pergunta comportamental rigorosa utilizando a metodologia STAR.'
  },
  {
    id: 'salary-neg',
    icon: '💼',
    category: 'salario',
    label: 'Negociação Salarial & Total Comp',
    prompt: 'Dra. Valéria, recebi uma proposta abaixo da minha expectativa salarial. Como devo conduzir a negociação do pacote de Total Compensation (salário fixo, bônus por metas, benefícios e possível signing bonus) com assertividade e elegância executiva?'
  },
  {
    id: 'ats-audit',
    icon: '🔍',
    category: 'ats',
    label: 'Auditoria dos 6 Segundos & ATS',
    prompt: 'Dra. Valéria, na sua visão de Diretora de RH, quais são os 5 erros fatais que eliminam currículos imediatamente nos algoritmos ATS (Workday, Taleo, Greenhouse, Gupy) e nos primeiros 6 segundos do olhar de um recrutador executivo?'
  },
  {
    id: 'career-pivot',
    icon: '🚀',
    category: 'transicao',
    label: 'Transição / Pivotagem de Carreira',
    prompt: 'Dra. Valéria, estou planejando uma transição de carreira para um novo setor. Como devo articular minhas competências transferíveis e estruturar uma narrativa profissional sólida para que o mercado não me veja como um iniciante?'
  },
  {
    id: 'pitch-60s',
    icon: '🎤',
    category: 'entrevista',
    label: 'Pitch Executivo de Impacto (60s)',
    prompt: 'Dra. Valéria, me ajude a estruturar um Pitch de Apresentação Pessoal de 60 segundos com proposta única de valor (UVP) para impressionar conselhos, diretores e headhunters.'
  },
  {
    id: 'career-gap',
    icon: '⚖️',
    category: 'transicao',
    label: 'Explicar Lacunas ou Demissão',
    prompt: 'Dra. Valéria, qual é a resposta mais estratégica e madura para justificar um período de transição/sabático ou uma demissão em uma reestruturação anterior sem gerar desconfiança?'
  }
];

const CreativeStudio: React.FC = () => {
  const { colors, theme } = useContext(ThemeContext);
  const styles = getStyles(colors, theme);

  const [studioMode, setStudioMode] = useState<'simulador' | 'consultoria'>('simulador');
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chatMessages_v2', [INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'entrevista' | 'salario' | 'ats' | 'transicao'>('todos');

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendPrompt = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat(newMessages);
      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Desculpe, identifiquei uma interrupção temporária na conexão com a consultoria. Por favor, reformule sua pergunta ou tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Deseja reiniciar a sessão de mentoria executiva com a Dra. Valéria Silveira?")) {
      setMessages([INITIAL_WELCOME]);
      showToast("Sessão de consultoria reiniciada com sucesso.");
    }
  };

  const handleExportTranscript = () => {
    const now = new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' });
    let transcript = `# ATA EXECUTIVA DE MENTORIA DE CARREIRA - CV-AUTOPILOT\n`;
    transcript += `Data: ${now}\n`;
    transcript += `Mentora: Dra. Valéria Silveira (Chief People Officer & Orientadora Master)\n`;
    transcript += `Plataforma: CV-AutoPilot Enterprise Suite\n`;
    transcript += `========================================================================\n\n`;

    messages.forEach((msg, idx) => {
      const sender = msg.role === 'model' ? 'Dra. Valéria Silveira (Diretora de RH)' : 'Candidato / Liderança';
      transcript += `[${msg.timestamp || `${idx + 1}`}] ${sender}:\n`;
      transcript += `${msg.text}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        transcript += `Fontes Consultadas:\n`;
        msg.sources.forEach(s => transcript += ` - ${s.title}: ${s.uri}\n`);
        transcript += `\n`;
      }
      transcript += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mentoria_Carreira_Dra_Valeria_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Ata executiva da mentoria exportada em Markdown!");
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Orientação copiada para a área de transferência!");
  };

  const filteredPills = activeCategory === 'todos' 
    ? QUICK_PILLS 
    : QUICK_PILLS.filter(p => p.category === activeCategory);

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toast}>
          <CheckCircleIcon style={{ width: '18px', height: '18px', marginRight: '8px', color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Director Profile Header */}
      <div style={styles.executiveHeaderCard}>
        <div style={styles.headerLeft}>
          <div style={styles.avatarWrapper}>
            <img
              src={HR_DIRECTOR_AVATAR}
              alt="Dra. Valéria Silveira"
              style={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
            <span style={styles.onlineBadge} title="Disponível para Mentoria"></span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={styles.directorName}>Dra. Valéria Silveira</h1>
              <span style={styles.executiveBadge}>CHIEF PEOPLE OFFICER</span>
              <span style={styles.verifiedBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Mentor Master
              </span>
            </div>
            <p style={styles.directorTitle}>
              Diretora Sênior de Recursos Humanos & Orientadora Profissional Master de Carreira Executiva
            </p>
            <div style={styles.tagRow}>
              <span style={styles.skillTag}>🏛️ +20 Anos de Bancas C-Level</span>
              <span style={styles.skillTag}>🎯 Metodologia STAR / CAR</span>
              <span style={styles.skillTag}>💼 Total Compensation & Negociação</span>
              <span style={styles.skillTag}>🤖 Engenharia de Algoritmos ATS</span>
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.actionBtn}
            onClick={handleExportTranscript}
            title="Exportar Ata Completa da Sessão"
          >
            <DownloadIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            Exportar Ata
          </button>
          <button
            style={styles.actionBtnSecondary}
            onClick={handleResetSession}
            title="Iniciar Nova Sessão com a Mentora"
          >
            <RefreshCwIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            Nova Sessão
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={styles.modeTabBar}>
        <button
          style={studioMode === 'simulador' ? styles.modeTabActive : styles.modeTab}
          onClick={() => setStudioMode('simulador')}
        >
          <MicIcon style={{ width: '18px', height: '18px', marginRight: '8px' }} />
          <span>Simulador de Entrevista por Voz (Microfone & STAR)</span>
          <span style={styles.modeBadgeNew}>MODO INTERATIVO</span>
        </button>
        <button
          style={studioMode === 'consultoria' ? styles.modeTabActive : styles.modeTab}
          onClick={() => setStudioMode('consultoria')}
        >
          <SendIcon style={{ width: '18px', height: '18px', marginRight: '8px' }} />
          <span>Consultoria & Mentoria Executiva (Chat com Dra. Valéria)</span>
        </button>
      </div>

      {studioMode === 'simulador' ? (
        <InterviewSimulator />
      ) : (
        <>
          {/* Quick Strategy Consultation Pills Bar */}
          <div style={styles.pillsSection}>
        <div style={styles.categoryTabs}>
          <span style={styles.pillsTitle}>Pílulas de Consultoria Estratégica:</span>
          {(['todos', 'entrevista', 'salario', 'ats', 'transicao'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat ? styles.categoryTabActive : styles.categoryTab}
            >
              {cat === 'todos' && 'Todos'}
              {cat === 'entrevista' && 'Simulação STAR'}
              {cat === 'salario' && 'Remuneração'}
              {cat === 'ats' && 'ATS & Filtros'}
              {cat === 'transicao' && 'Transição'}
            </button>
          ))}
        </div>

        <div style={styles.pillsScroll}>
          {filteredPills.map(pill => (
            <button
              key={pill.id}
              style={styles.pillButton}
              onClick={() => handleSendPrompt(pill.prompt)}
              disabled={isLoading}
            >
              <span style={{ fontSize: '15px' }}>{pill.icon}</span>
              <span style={styles.pillLabel}>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Stream Window */}
      <div style={styles.chatWindow}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={isUser ? styles.userMessageRow : styles.modelMessageRow}
            >
              {!isUser && (
                <div style={styles.chatAvatarContainer}>
                  <img
                    src={HR_DIRECTOR_AVATAR}
                    alt="Dra. Valéria Silveira"
                    style={styles.chatAvatarImg}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div style={isUser ? styles.userMessageBubble : styles.modelMessageBubble}>
                <div style={styles.messageHeader}>
                  <strong style={isUser ? styles.userNameLabel : styles.modelNameLabel}>
                    {isUser ? 'Você (Candidato / Liderança)' : 'Dra. Valéria Silveira'}
                  </strong>
                  {msg.timestamp && (
                    <span style={styles.timestampText}>{msg.timestamp}</span>
                  )}
                  {!isUser && (
                    <button
                      style={styles.copyIconButton}
                      onClick={() => handleCopyText(msg.text)}
                      title="Copiar recomendação"
                    >
                      <CopyIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>

                {/* Rich Markdown Output */}
                <div style={styles.markdownWrapper}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* Grounding Web Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={styles.sourcesContainer}>
                    <div style={styles.sourcesHeading}>
                      🔍 Dados & Referências Reais de Mercado:
                    </div>
                    <ul style={styles.sourcesList}>
                      {msg.sources.map((source, i) => (
                        <li key={i} style={styles.sourceItem}>
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.sourceLink}
                          >
                            <ExternalLinkIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
                            {source.title || source.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={styles.modelMessageRow}>
            <div style={styles.chatAvatarContainer}>
              <img
                src={HR_DIRECTOR_AVATAR}
                alt="Dra. Valéria Silveira"
                style={styles.chatAvatarImg}
                referrerPolicy="no-referrer"
              />
            </div>
            <div style={styles.thinkingBubble}>
              <div style={styles.pulseDot}></div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                Dra. Valéria está formulando uma orientação estratégica...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(input);
              }
            }}
            placeholder="Apresente sua situação, resposta de simulação ou dúvida sobre carreira..."
            disabled={isLoading}
          />
          <button
            style={isLoading ? styles.sendBtnDisabled : styles.sendBtn}
            onClick={() => handleSendPrompt(input)}
            disabled={isLoading || !input.trim()}
            title="Enviar mensagem para a Dra. Valéria"
          >
            <SendIcon style={{ width: '18px', height: '18px', marginRight: '6px' }} />
            {isLoading ? 'Analisando...' : 'Enviar'}
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

const getStyles = (colors: any, theme: string): { [key: string]: React.CSSProperties } => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 120px)',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    position: 'relative',
    gap: '14px',
  },
  modeTabBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    backgroundColor: colors.surface,
    padding: '6px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    flexShrink: 0,
    boxShadow: colors.shadow || '0 2px 8px rgba(0,0,0,0.03)',
  },
  modeTab: {
    flex: '1 1 240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeTabActive: {
    flex: '1 1 240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    border: `1px solid ${colors.primary}`,
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
  },
  modeBadgeNew: {
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '0.04em',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    marginLeft: '8px',
  },
  toast: {
    position: 'absolute',
    top: '10px',
    right: '20px',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    padding: '12px 18px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    fontSize: '13px',
    fontWeight: 600,
  },
  executiveHeaderCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '20px 24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
    border: `2px solid ${colors.primary}`,
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: `2px solid ${colors.surface}`,
    boxShadow: '0 0 6px #10b981',
  },
  directorName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: colors.textPrimary,
  },
  executiveBadge: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.06em',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: colors.primary,
    color: '#ffffff',
  },
  verifiedBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
  },
  directorTitle: {
    margin: '4px 0 8px 0',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTag: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 9px',
    borderRadius: '6px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 15px',
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textOnPrimary,
    backgroundColor: colors.primary,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
    transition: 'opacity 0.2s',
  },
  actionBtnSecondary: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 15px',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  pillsSection: {
    backgroundColor: colors.surface,
    padding: '12px 18px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  categoryTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pillsTitle: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    color: colors.textMuted,
    marginRight: '6px',
  },
  categoryTab: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    cursor: 'pointer',
  },
  categoryTabActive: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    border: `1px solid ${colors.primary}`,
    backgroundColor: colors.primary,
    color: '#ffffff',
    cursor: 'pointer',
  },
  pillsScroll: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  pillButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  pillLabel: {
    fontSize: '12px',
    fontWeight: '600',
  },
  chatWindow: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
  },
  userMessageRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
  modelMessageRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '14px',
    width: '100%',
  },
  chatAvatarContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    border: `1.5px solid ${colors.primary}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  chatAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userMessageBubble: {
    padding: 'clamp(12px, 2vw, 18px)',
    borderRadius: '18px 18px 4px 18px',
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    maxWidth: '94%',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)',
    fontSize: 'clamp(12.5px, 1.1vw, 14px)',
    lineHeight: 1.55,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  modelMessageBubble: {
    padding: 'clamp(14px, 2.2vw, 20px)',
    borderRadius: '18px 18px 18px 4px',
    backgroundColor: theme === 'dark' ? '#141d2e' : '#f8fafc',
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
    maxWidth: '96%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    fontSize: 'clamp(12.5px, 1.1vw, 14px)',
    lineHeight: 1.55,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: `1px solid ${colors.borderSubtle || 'rgba(0,0,0,0.06)'}`,
  },
  userNameLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
  },
  modelNameLabel: {
    fontSize: '13px',
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: '-0.01em',
  },
  timestampText: {
    fontSize: '11px',
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  copyIconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
  },
  markdownWrapper: {
    fontSize: '14px',
    lineHeight: 1.65,
  },
  sourcesContainer: {
    marginTop: '14px',
    padding: '10px 14px',
    backgroundColor: colors.background,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  sourcesHeading: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '6px',
  },
  sourcesList: {
    margin: 0,
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sourceItem: {
    fontSize: '12px',
  },
  sourceLink: {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
  },
  thinkingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderRadius: '18px',
    backgroundColor: theme === 'dark' ? '#141d2e' : '#f8fafc',
    border: `1px solid ${colors.border}`,
  },
  pulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    boxShadow: `0 0 10px ${colors.primary}`,
    animation: 'pulse 1.5s infinite',
  },
  inputArea: {
    flexShrink: 0,
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    backgroundColor: colors.surface,
    padding: '8px 10px 8px 16px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 18px rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.inputText,
    fontSize: '15px',
    outline: 'none',
    padding: '8px 0',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '700',
    color: colors.textOnPrimary,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
    transition: 'opacity 0.2s',
  },
  sendBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '700',
    color: colors.buttonDisabledText,
    backgroundColor: colors.buttonDisabledBg,
    border: 'none',
    borderRadius: '10px',
    cursor: 'not-allowed',
  },
});

export default CreativeStudio;
