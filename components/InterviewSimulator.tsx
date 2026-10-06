// InterviewSimulator.tsx - Interactive Voice & STAR Interview Simulator with Dra. Valéria Silveira
import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { InterviewConfig, InterviewTurn, InterviewEvaluation, InterviewSessionRecord } from '../types';
import { generateInterviewQuestion, evaluateInterviewAnswer } from '../services/geminiService';
import {
  exportInterviewSessionToPdf,
  exportSingleTurnToPdf,
  exportEvolutionDossierToPdf
} from '../services/interviewPdfService';
import { InterviewEvolutionTracker } from './InterviewEvolutionTracker';
import {
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  SquareIcon,
  PlayIcon,
  RefreshCwIcon,
  DownloadIcon,
  CheckCircleIcon,
  AwardIcon,
  SlidersIcon,
  TrendingUpIcon,
  CopyIcon,
  BarChartIcon,
  FileText
} from './icons';

const HR_DIRECTOR_AVATAR = "/src/assets/images/hr_director_avatar_1789832765437.jpg";

const DEFAULT_CONFIG: InterviewConfig = {
  targetRole: 'Liderança Sênior / Especialista',
  seniority: 'Sênior',
  focusArea: 'Metodologia STAR (Comportamental & Resultados)',
  companyTarget: 'Empresa de Alta Performance'
};

const SUGGESTED_ROLES = [
  'Tech Lead / Arquiteto de Software',
  'Head of Product / PM Sênior',
  'Gerente de Recursos Humanos / BP',
  'Diretor Comercial / Head of Sales',
  'Engenheiro de Software Sênior',
  'Coordenador de Operações & Finanças'
];

const SENIORITY_LEVELS = [
  'Júnior',
  'Pleno',
  'Sênior',
  'Especialista / Lead',
  'Coordenação / Gerência',
  'Diretoria / C-Level'
];

const FOCUS_AREAS = [
  'Metodologia STAR (Comportamental & Resultados)',
  'Liderança sob Crise & Tomada de Decisão',
  'Visão Estratégica de Negócios & ROI',
  'Gestão de Conflitos & Fit Cultural',
  'Negociação Executiva & Gestão de Stakeholders'
];

export const InterviewSimulator: React.FC = () => {
  const { colors, theme } = useContext(ThemeContext);
  const styles = getStyles(colors, theme);

  // Configuration State
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Tab State: 'simulation' | 'evolution'
  const [activeTab, setActiveTab] = useState<'simulation' | 'evolution'>('simulation');

  // Persistent Performance History & Candidate Data
  const [sessionHistory, setSessionHistory] = useLocalStorage<InterviewSessionRecord[]>('interview_performance_history_v1', []);
  const [userName] = useLocalStorage<string>('userName', '');
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `session_${Date.now()}`);

  // Current Question & Turns History
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentCompetency, setCurrentCompetency] = useState<string>('');
  const [contextTip, setContextTip] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Loading & Evaluation State
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<InterviewEvaluation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Speech-to-Text (Microphone) State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Speech Synthesis (TTS) State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check Speech Recognition capability
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer handling during recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Start new interview simulation session
  const startNewSimulation = async (customConfig?: InterviewConfig) => {
    const activeConfig = customConfig || config;
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setIsGeneratingQuestion(true);
    setSessionStarted(true);
    setActiveTab('simulation');
    setTurns([]);
    setCurrentEvaluation(null);
    setUserAnswer('');
    setIsConfigOpen(false);

    try {
      const q = await generateInterviewQuestion(activeConfig, []);
      setCurrentQuestion(q.question);
      setCurrentCompetency(q.competency);
      setContextTip(q.contextTip);
      showToast("Simulação iniciada! Dra. Valéria apresentou a pergunta.");
    } catch (err) {
      showToast("Erro ao iniciar simulação. Tente novamente.");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // Start voice recording via Web Speech API
  const handleStartRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de fala não suportado neste navegador. Digite sua resposta abaixo.");
      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      let accumulated = userAnswer;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulated += (accumulated ? ' ' : '') + event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setUserAnswer(accumulated + (interim ? ' ' + interim : ''));
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          showToast("Acesso ao microfone negado pelo navegador.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      showToast("Microfone ativo! Fale com calma utilizando o método STAR.");
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
      showToast("Não foi possível acionar o microfone.");
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    showToast("Gravação finalizada. Revise sua resposta ou envie para avaliação.");
  };

  // Speak question aloud using browser SpeechSynthesis
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      showToast("Síntese de voz não suportada pelo navegador.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95; // slightly deliberate, executive pace
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Submit answer for Dra. Valéria's evaluation
  const handleSubmitAnswer = async () => {
    const trimmed = userAnswer.trim();
    if (!trimmed) {
      showToast("Por favor, fale ao microfone ou digite sua resposta antes de enviar.");
      return;
    }

    if (isRecording) {
      handleStopRecording();
    }

    setIsEvaluating(true);

    try {
      const evaluation = await evaluateInterviewAnswer(
        config,
        currentQuestion,
        currentCompetency,
        trimmed
      );

      setCurrentEvaluation(evaluation);

      // Save to turn history
      const newTurn: InterviewTurn = {
        id: `turn_${Date.now()}`,
        questionNumber: turns.length + 1,
        question: currentQuestion,
        competency: currentCompetency,
        userAnswer: trimmed,
        durationSeconds: recordingSeconds > 0 ? recordingSeconds : undefined,
        evaluation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedTurns = [...turns, newTurn];
      setTurns(updatedTurns);

      // Persist / update this session in the performance evolution tracker
      const sessionAvg = Math.round(
        updatedTurns.reduce((acc, t) => acc + (t.evaluation?.score || 0), 0) / updatedTurns.length
      );

      let verdictGrade = 'Necessita Ajustes & Prática';
      if (sessionAvg >= 85) verdictGrade = 'Excepcional • Aprovado Padrão C-Level';
      else if (sessionAvg >= 70) verdictGrade = 'Apto com Boa Estrutura • Em Calibração';
      else if (sessionAvg >= 55) verdictGrade = 'Básico • Necessita Maior Protagonismo e Métricas';

      const sessionRecord: InterviewSessionRecord = {
        id: currentSessionId,
        date: new Date().toISOString(),
        targetRole: config.targetRole,
        seniority: config.seniority,
        focusArea: config.focusArea,
        companyTarget: config.companyTarget,
        averageScore: sessionAvg,
        verdictGrade,
        turns: updatedTurns,
        competenciesTested: Array.from(new Set(updatedTurns.map(t => t.competency))),
        durationMinutes: Math.max(1, Math.round(recordingSeconds / 60))
      };

      setSessionHistory(hist => {
        const existingIdx = hist.findIndex(s => s.id === currentSessionId);
        if (existingIdx >= 0) {
          const copy = [...hist];
          copy[existingIdx] = sessionRecord;
          return copy;
        }
        return [...hist, sessionRecord];
      });

      showToast(`Avaliação concluída! Pontuação da banca: ${evaluation.score}/100`);
    } catch (err) {
      showToast("Erro ao processar avaliação. Tente novamente.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Advance to next question
  const handleNextQuestion = async () => {
    setIsGeneratingQuestion(true);
    setCurrentEvaluation(null);
    setUserAnswer('');
    setRecordingSeconds(0);

    try {
      const q = await generateInterviewQuestion(config, turns);
      setCurrentQuestion(q.question);
      setCurrentCompetency(q.competency);
      setContextTip(q.contextTip);
      showToast(`Pergunta #${turns.length + 1} formulada.`);
    } catch (err) {
      showToast("Erro ao formular próxima pergunta.");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // Retry the same question
  const handleRetryQuestion = () => {
    setCurrentEvaluation(null);
    setUserAnswer('');
    setRecordingSeconds(0);
    showToast("Pratique sua nova resposta para esta pergunta aplicando os feedbacks!");
  };

  // PDF Export Handlers
  const handleExportSessionPdf = (targetSession?: InterviewSessionRecord) => {
    const turnsToExport = targetSession ? targetSession.turns : turns;
    const configToExport: InterviewConfig = targetSession
      ? {
          targetRole: targetSession.targetRole,
          seniority: targetSession.seniority,
          focusArea: targetSession.focusArea,
          companyTarget: targetSession.companyTarget,
        }
      : config;

    if (!turnsToExport || turnsToExport.length === 0) {
      showToast("Nenhuma pergunta avaliada nesta sessão para exportar em PDF.");
      return;
    }

    try {
      const fileName = exportInterviewSessionToPdf({
        config: configToExport,
        turns: turnsToExport,
        candidateName: userName,
        historicalSessions: sessionHistory
      });
      showToast(`Dossiê em PDF exportado com sucesso: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao gerar arquivo PDF. Tente novamente.");
    }
  };

  const handleExportTurnPdf = (turn: InterviewTurn) => {
    try {
      const fileName = exportSingleTurnToPdf(turn, config, userName);
      showToast(`Feedback da pergunta exportado em PDF: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao exportar PDF.");
    }
  };

  const handleExportFullEvolutionPdf = () => {
    if (sessionHistory.length === 0) {
      showToast("Nenhuma rodada histórica registrada para exportar.");
      return;
    }
    try {
      const fileName = exportEvolutionDossierToPdf(sessionHistory, userName);
      showToast(`Dossiê completo de evolução exportado: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Erro ao exportar dossiê em PDF.");
    }
  };

  const handleClearHistory = () => {
    setSessionHistory([]);
    showToast("Histórico de simulações e evolução limpo.");
  };

  const handleLoadDemoHistory = () => {
    const sampleSessions: InterviewSessionRecord[] = [
      {
        id: 'demo_session_1',
        date: new Date(Date.now() - 7 * 86400000).toISOString(),
        targetRole: config.targetRole,
        seniority: config.seniority,
        focusArea: 'Metodologia STAR & Comunicação',
        companyTarget: config.companyTarget || 'Mercado Geral',
        averageScore: 68,
        verdictGrade: 'Básico • Necessita Maior Protagonismo e Métricas',
        competenciesTested: ['Gestão de Crise', 'Comunicação STAR'],
        turns: [
          {
            id: 'demo_t1',
            questionNumber: 1,
            question: 'Conte sobre um projeto de alta complexidade que você liderou e enfrentou atrasos graves.',
            competency: 'Gestão de Crise',
            userAnswer: 'No meu emprego tínhamos um projeto que atrasou por causa de fornecedores. Eu convoquei a equipe e cobrei os prazos para entregar tudo.',
            timestamp: '14:30',
            evaluation: {
              score: 68,
              executiveVerdict: 'Comunicação reativa; faltou evidenciar governança e métricas de impacto financeiro.',
              starAnalysis: {
                situation: 'Contexto citado brevemente sobre atraso de fornecedores.',
                task: 'Necessidade de recuperar o cronograma sem onerar o cliente.',
                action: 'Reunião com equipe e cobrança direta de entregas.',
                result: 'Projeto entregue, porém sem percentuais ou economia citada.'
              },
              strengths: ['Honestidade sobre a adversidade', 'Foco na data limite de entrega'],
              improvements: ['Ausência de números/ROI', 'Verbos reativos ("cobrei") ao invés de estratégicos'],
              cLevelRewrite: 'Assumi o comitê de crise, renegociei SLAs contratuais com 3 fornecedores e implementei sprints de alinhamento diário, recuperando o cronograma em 12 dias e preservando R$ 380 mil de margem.',
              overallTip: 'Troque declarações operacionais por metodologias de mitigação e dados financeiros.'
            }
          }
        ]
      },
      {
        id: 'demo_session_2',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        targetRole: config.targetRole,
        seniority: config.seniority,
        focusArea: 'Liderança Estratégica & Métricas',
        companyTarget: config.companyTarget || 'Empresa de Alta Performance',
        averageScore: 82,
        verdictGrade: 'Apto com Boa Estrutura • Em Calibração',
        competenciesTested: ['Liderança sob Pressão', 'ROI & Métricas'],
        turns: [
          {
            id: 'demo_t2',
            questionNumber: 1,
            question: 'Como você equilibra decisões técnicas arrojadas com os objetivos fiscais do negócio?',
            competency: 'ROI & Métricas',
            userAnswer: 'Calculo o custo total de propriedade (TCO). Em um caso real, estruturei a tese de migração para nuvem gerando 25% de economia comprovada.',
            timestamp: '16:15',
            evaluation: {
              score: 82,
              executiveVerdict: 'Excelente domínio de TCO e linguagem de negócios orientada a resultados tangíveis.',
              starAnalysis: {
                situation: 'Custos de infraestrutura legada crescendo acima do orçamento corporativo.',
                task: 'Reduzir despesas recorrentes preservando confiabilidade.',
                action: 'Modelagem financeira de TCO e defesa executiva junto ao CFO.',
                result: 'Redução de 25% na fatura anual e ganho de 40% em agilidade de deploy.'
              },
              strengths: ['Linguagem executiva focada em custo e negócio', 'Uso claro de percentuais no resultado'],
              improvements: ['Explorar o alinhamento com a diretoria técnica'],
              cLevelRewrite: 'Apresentei uma tese de TCO comparando o payback da infraestrutura legada versus nuvem, pactuando com o CFO uma economia de 25% (R$ 800k/ano) aprovada pelo comitê executivo.',
              overallTip: 'Excelente evolução! Demonstre também como você engaja os liderados nessa eficiência.'
            }
          }
        ]
      },
      {
        id: 'demo_session_3',
        date: new Date().toISOString(),
        targetRole: config.targetRole,
        seniority: config.seniority,
        focusArea: 'Visão Estratégica C-Level',
        companyTarget: config.companyTarget || 'Corporação Global',
        averageScore: 92,
        verdictGrade: 'Excepcional • Aprovado C-Level',
        competenciesTested: ['Visão Estratégica', 'Gestão de Stakeholders'],
        turns: [
          {
            id: 'demo_t3',
            questionNumber: 1,
            question: 'Descreva uma negociação de alto impacto com stakeholders céticos onde você unificou visões opostas.',
            competency: 'Gestão de Stakeholders',
            userAnswer: 'Mapeei a matriz de poder e interesse dos diretores, promovi rodadas individuais de alinhamento com dados de mercado e chegamos a um consenso que acelerou a expansão em 30%.',
            timestamp: '10:05',
            evaluation: {
              score: 92,
              executiveVerdict: 'Padrão C-Level impecável: diplomacia madura, protagonismo e impacto de expansão consolidado.',
              starAnalysis: {
                situation: 'Divergência estratégica entre diretorias Comercial e Operações.',
                task: 'Unificar a visão do conselho para aprovar o plano plurianual.',
                action: 'Aplicação de matriz de poder e alinhamento prévio baseado em benchmarks de mercado.',
                result: 'Aprovação unânime e aceleração de 30% no pipeline de expansão.'
              },
              strengths: ['Uso de ferramentas executivas', 'Protagonismo e diplomacia corporativa', 'Métrica de expansão robusta'],
              improvements: ['Mencionar brevemente o acompanhamento pós-aprovação'],
              cLevelRewrite: 'Conduzi a mediação estruturando cenários de sensibilidade financeira para cada diretoria, convertendo a resistência em coautoria do projeto com aprovação consensual no Conselho.',
              overallTip: 'Postura de alta liderança. Mantenha essa cadência serena e assertiva na entrevista presencial.'
            }
          }
        ]
      }
    ];

    setSessionHistory(sampleSessions);
    showToast("3 rodadas de exemplo carregadas para você visualizar a curva de evolução!");
  };

  // Export Markdown report
  const handleExportReport = () => {
    if (turns.length === 0) {
      showToast("Nenhuma pergunta avaliada nesta sessão para exportar.");
      return;
    }

    const avgScore = Math.round(
      turns.reduce((acc, t) => acc + (t.evaluation?.score || 0), 0) / turns.length
    );

    let report = `# RELATÓRIO EXECUTIVO DE SIMULAÇÃO DE ENTREVISTA\n`;
    report += `Data: ${new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}\n`;
    report += `Mentora: Dra. Valéria Silveira (Chief People Officer & Orientadora Master)\n`;
    report += `Candidato(a): ${userName || 'Profissional Executivo'}\n`;
    report += `Posição Alvo: ${config.targetRole} (${config.seniority})\n`;
    report += `Foco da Rodada: ${config.focusArea}\n`;
    report += `Pontuação Média da Entrevista: ${avgScore} / 100\n`;
    report += `Total de Perguntas Respondidas: ${turns.length}\n`;
    report += `========================================================================\n\n`;

    turns.forEach((t) => {
      report += `## PERGUNTA #${t.questionNumber}: ${t.question}\n`;
      report += `Competência Avaliada: ${t.competency}\n\n`;
      report += `### Resposta do Candidato:\n"${t.userAnswer}"\n\n`;
      if (t.evaluation) {
        report += `### Pontuação: ${t.evaluation.score} / 100\n`;
        report += `Veredito Executivo: ${t.evaluation.executiveVerdict}\n\n`;
        report += `#### Diagnóstico STAR:\n`;
        report += `- Situação: ${t.evaluation.starAnalysis.situation}\n`;
        report += `- Tarefa: ${t.evaluation.starAnalysis.task}\n`;
        report += `- Ação: ${t.evaluation.starAnalysis.action}\n`;
        report += `- Resultado: ${t.evaluation.starAnalysis.result}\n\n`;
        report += `#### Pontos Fortes:\n`;
        t.evaluation.strengths.forEach(s => (report += ` - ${s}\n`));
        report += `\n#### Oportunidades de Melhoria:\n`;
        t.evaluation.improvements.forEach(imp => (report += ` - ${imp}\n`));
        report += `\n#### Como a Dra. Valéria Responderia (Padrão C-Level):\n"${t.evaluation.cLevelRewrite}"\n\n`;
        report += `#### Dica de Ouro:\n${t.evaluation.overallTip}\n\n`;
      }
      report += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Simulacao_Entrevista_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Relatório em Markdown exportado com sucesso!");
  };

  // Helper for score colors
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return { bg: '#10b981', text: '#ffffff', label: 'Excelente / C-Level' };
    if (score >= 60) return { bg: '#f59e0b', text: '#ffffff', label: 'Bom / Em Calibração' };
    return { bg: '#ef4444', text: '#ffffff', label: 'Necessita Reformulação' };
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toast}>
          <CheckCircleIcon style={{ width: '18px', height: '18px', marginRight: '8px', color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar / Session Header */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={styles.avatarWrapper}>
            <img
              src={HR_DIRECTOR_AVATAR}
              alt="Dra. Valéria Silveira"
              style={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
            <span style={styles.onlineBadge} title="Simulador de Voz Ativo"></span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={styles.headerTitle}>Simulador de Entrevista Executiva por Voz</h2>
              <span style={styles.badgeLive}>● AO VIVO</span>
              <span style={styles.badgeRole}>{config.targetRole} ({config.seniority})</span>
            </div>
            <p style={styles.headerSub}>
              Conduzido pela <strong>Dra. Valéria Silveira</strong> • Metodologia STAR & Feedback Cirúrgico Instantâneo
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.actionBtnSecondary}
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            title="Configurar Parâmetros da Entrevista"
          >
            <SlidersIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            {isConfigOpen ? 'Fechar Ajustes' : 'Ajustar Vaga'}
          </button>
          {turns.length > 0 && (
            <>
              <button
                style={styles.actionBtnPdf}
                onClick={() => handleExportSessionPdf()}
                title="Exportar Dossiê Executivo da Rodada em PDF Profissional"
              >
                <DownloadIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                Exportar PDF ({turns.length} Q)
              </button>
              <button
                style={styles.actionBtnSecondary}
                onClick={handleExportReport}
                title="Exportar Relatório em Markdown"
              >
                <FileText style={{ width: '14px', height: '14px', marginRight: '5px' }} />
                MD
              </button>
            </>
          )}
          {sessionHistory.length > 0 && (
            <button
              style={styles.actionBtnSecondary}
              onClick={handleExportFullEvolutionPdf}
              title="Exportar Dossiê Histórico Consolidado em PDF"
            >
              <BarChartIcon style={{ width: '15px', height: '15px', marginRight: '5px' }} />
              Dossiê Histórico ({sessionHistory.length})
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Simulação vs Evolução */}
      <div style={styles.tabNavRow}>
        <button
          style={activeTab === 'simulation' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('simulation')}
        >
          <MicIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          <span>Simulador de Entrevista por Voz</span>
          {sessionStarted && turns.length > 0 && (
            <span style={styles.tabBadgeActive}>
              {turns.length} Q
            </span>
          )}
        </button>

        <button
          style={activeTab === 'evolution' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('evolution')}
        >
          <TrendingUpIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          <span>Evolução de Performance & Dossiê PDF</span>
          <span style={styles.tabBadgeCounter}>
            {sessionHistory.length} {sessionHistory.length === 1 ? 'rodada' : 'rodadas'}
          </span>
        </button>
      </div>

      {/* Configuration Drawer / Accordion */}
      {isConfigOpen && (
        <div style={styles.configCard}>
          <div style={styles.configHeader}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>
              ⚙️ Calibração da Rodada de Entrevista
            </h3>
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>
              Personalize o cargo e os critérios da banca da Dra. Valéria
            </span>
          </div>

          <div style={styles.configGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cargo / Área Almejada:</label>
              <input
                type="text"
                style={styles.input}
                value={config.targetRole}
                onChange={e => setConfig({ ...config, targetRole: e.target.value })}
                placeholder="Ex: Head of Product, Tech Lead..."
              />
              <div style={styles.quickRoles}>
                {SUGGESTED_ROLES.slice(0, 3).map(r => (
                  <button
                    key={r}
                    type="button"
                    style={styles.miniChip}
                    onClick={() => setConfig({ ...config, targetRole: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nível de Senioridade:</label>
              <select
                style={styles.select}
                value={config.seniority}
                onChange={e => setConfig({ ...config, seniority: e.target.value })}
              >
                {SENIORITY_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Foco da Avaliação:</label>
              <select
                style={styles.select}
                value={config.focusArea}
                onChange={e => setConfig({ ...config, focusArea: e.target.value })}
              >
                {FOCUS_AREAS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Empresa / Cultura Alvo (Opcional):</label>
              <input
                type="text"
                style={styles.input}
                value={config.companyTarget || ''}
                onChange={e => setConfig({ ...config, companyTarget: e.target.value })}
                placeholder="Ex: Nubank, Google, Itaú, Ambev..."
              />
            </div>
          </div>

          <div style={styles.configFooter}>
            <button
              style={styles.actionBtn}
              onClick={() => startNewSimulation()}
              disabled={isGeneratingQuestion}
            >
              <RefreshCwIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
              Aplicar e Iniciar Nova Rodada
            </button>
          </div>
        </div>
      )}

      {/* Main Stage: Either Evolution Tracker or Simulation */}
      {activeTab === 'evolution' ? (
        <InterviewEvolutionTracker
          sessions={sessionHistory}
          currentConfig={config}
          onExportSessionPdf={handleExportSessionPdf}
          onExportFullPdf={handleExportFullEvolutionPdf}
          onStartNewSession={() => {
            setActiveTab('simulation');
            startNewSimulation();
          }}
          onClearHistory={handleClearHistory}
          onLoadDemoHistory={handleLoadDemoHistory}
        />
      ) : !sessionStarted ? (
        /* Welcome / Start Banner */
        <div style={styles.startBanner}>
          <div style={styles.startBannerInner}>
            <div style={styles.startIconCircle}>
              <MicIcon style={{ width: '40px', height: '40px', color: colors.primary }} />
            </div>
            <h3 style={styles.startTitle}>Pronto para entrar na sala da Diretoria de RH?</h3>
            <p style={styles.startDesc}>
              A <strong>Dra. Valéria Silveira</strong> formulará perguntas de alta complexidade adaptadas para o cargo de{' '}
              <strong>{config.targetRole}</strong> ({config.seniority}). Você responderá usando sua própria voz pelo microfone,
              e o modelo avaliará sua estruturação STAR, protagonismo e métricas em tempo real.
            </p>

            <div style={styles.featurePillsRow}>
              <span style={styles.featurePill}>🎙️ Captura por Voz em Português</span>
              <span style={styles.featurePill}>⏱️ Cronômetro de Resposta STAR</span>
              <span style={styles.featurePill}>🎯 Reescrita Padrão C-Level</span>
              <span style={styles.featurePill}>📊 Nota de 0 a 100 & Veredito</span>
            </div>

            <button
              style={styles.startBigBtn}
              onClick={() => startNewSimulation()}
              disabled={isGeneratingQuestion}
            >
              {isGeneratingQuestion ? (
                <span>Formulando pergunta executiva...</span>
              ) : (
                <>
                  <PlayIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                  Iniciar Simulação de Entrevista
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Interactive Area */
        <div style={styles.activeStageGrid}>
          {/* Left Column: Question Card & Microphone Controls */}
          <div style={styles.leftCol}>
            {/* Question Card */}
            <div style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.questionNumberBadge}>
                    Pergunta #{turns.length + 1}
                  </span>
                  <span style={styles.competencyTag}>
                    🎯 {currentCompetency || 'Avaliação STAR'}
                  </span>
                </div>

                <button
                  style={isPlayingAudio ? styles.speakBtnActive : styles.speakBtn}
                  onClick={handleToggleSpeak}
                  title={isPlayingAudio ? "Pausar leitura de voz" : "Ouvir a pergunta com a voz da Dra. Valéria"}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeXIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                      Pausar Voz
                    </>
                  ) : (
                    <>
                      <Volume2Icon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                      Ouvir Pergunta
                    </>
                  )}
                </button>
              </div>

              {isGeneratingQuestion ? (
                <div style={styles.loadingQuestionBox}>
                  <div style={styles.pulseDot}></div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textSecondary }}>
                    Dra. Valéria está formulando a pergunta da banca...
                  </span>
                </div>
              ) : (
                <>
                  <div style={styles.questionText}>
                    "{currentQuestion}"
                  </div>

                  {contextTip && (
                    <div style={styles.contextTipBox}>
                      <span style={{ fontWeight: '700', color: colors.primary, marginRight: '6px' }}>
                        💡 O que a banca busca:
                      </span>
                      <span>{contextTip}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Voice Capture & Answer Box */}
            <div style={styles.answerBox}>
              <div style={styles.answerHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: colors.textPrimary }}>
                    Sua Resposta:
                  </span>
                  {isRecording && (
                    <span style={styles.recordingTimer}>
                      🔴 Gravando: {formatTime(recordingSeconds)}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Ideal: 60 a 120 segundos (Clareza + Métricas)
                </span>
              </div>

              {/* Microphone Master Button */}
              <div style={styles.micControlRow}>
                {isRecording ? (
                  <button
                    style={styles.micBtnRecording}
                    onClick={handleStopRecording}
                    title="Parar gravação"
                  >
                    <SquareIcon style={{ width: '22px', height: '22px', marginRight: '10px' }} />
                    Concluir Fala ({formatTime(recordingSeconds)})
                  </button>
                ) : (
                  <button
                    style={styles.micBtnReady}
                    onClick={handleStartRecording}
                    disabled={isEvaluating || isGeneratingQuestion}
                    title="Gravar resposta pelo microfone"
                  >
                    <MicIcon style={{ width: '22px', height: '22px', marginRight: '10px' }} />
                    Gravar Resposta por Voz
                  </button>
                )}

                {userAnswer && !isRecording && (
                  <button
                    style={styles.clearBtn}
                    onClick={() => setUserAnswer('')}
                    title="Limpar texto da resposta"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Live Transcript / Text Editor */}
              <div style={styles.textareaWrapper}>
                <textarea
                  style={styles.answerTextarea}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder={
                    isRecording
                      ? "Fale ao microfone... As palavras aparecerão aqui em tempo real."
                      : "Clique em 'Gravar Resposta por Voz' ou digite sua resposta diretamente aqui..."
                  }
                  rows={6}
                />
              </div>

              {/* Action Buttons */}
              <div style={styles.answerFooterActions}>
                <button
                  style={isEvaluating || !userAnswer.trim() ? styles.submitBtnDisabled : styles.submitBtn}
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluating || !userAnswer.trim()}
                >
                  {isEvaluating ? (
                    <>
                      <div style={styles.spinner}></div>
                      Dra. Valéria está avaliando seu desempenho...
                    </>
                  ) : (
                    <>
                      <AwardIcon style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                      Submeter Resposta para Avaliação STAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Feedback & History */}
          <div style={styles.rightCol}>
            {currentEvaluation ? (
              /* Evaluation Card */
              <div style={styles.evaluationCard}>
                <div style={styles.evaluationHeader}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em', color: colors.primary }}>
                      DIAGNÓSTICO EXECUTIVO DA BANCA
                    </span>
                    <h3 style={styles.verdictTitle}>
                      "{currentEvaluation.executiveVerdict}"
                    </h3>
                  </div>

                  <div style={{
                    ...styles.scoreBadge,
                    backgroundColor: getScoreBadgeColor(currentEvaluation.score).bg
                  }}>
                    <span style={styles.scoreNumber}>{currentEvaluation.score}</span>
                    <span style={styles.scoreLabel}>/ 100</span>
                  </div>
                </div>

                {/* STAR Analysis Breakdown Grid */}
                <div style={styles.starGrid}>
                  <div style={styles.starCol}>
                    <span style={styles.starLabel}>S • Situação</span>
                    <p style={styles.starText}>{currentEvaluation.starAnalysis.situation}</p>
                  </div>
                  <div style={styles.starCol}>
                    <span style={styles.starLabel}>T • Tarefa</span>
                    <p style={styles.starText}>{currentEvaluation.starAnalysis.task}</p>
                  </div>
                  <div style={styles.starCol}>
                    <span style={styles.starLabel}>A • Ação (Protagonismo)</span>
                    <p style={styles.starText}>{currentEvaluation.starAnalysis.action}</p>
                  </div>
                  <div style={styles.starCol}>
                    <span style={styles.starLabel}>R • Resultado (ROI/Métricas)</span>
                    <p style={styles.starText}>{currentEvaluation.starAnalysis.result}</p>
                  </div>
                </div>

                {/* Strengths and Gaps */}
                <div style={styles.analysisTwoCols}>
                  <div style={styles.analysisBoxGreen}>
                    <h4 style={styles.analysisTitleGreen}>✅ Pontos Fortes Notáveis:</h4>
                    <ul style={styles.bulletList}>
                      {currentEvaluation.strengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={styles.analysisBoxOrange}>
                    <h4 style={styles.analysisTitleOrange}>⚠️ Oportunidades de Melhoria:</h4>
                    <ul style={styles.bulletList}>
                      {currentEvaluation.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* C-Level Rewrite Box */}
                <div style={styles.rewriteCard}>
                  <div style={styles.rewriteHeader}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: colors.primary }}>
                      🏛️ Como a Dra. Valéria Responderia (Padrão C-Level):
                    </span>
                    <button
                      style={styles.copyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(currentEvaluation.cLevelRewrite);
                        showToast("Resposta modelo copiada!");
                      }}
                      title="Copiar resposta modelo"
                    >
                      <CopyIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
                      Copiar Modelo
                    </button>
                  </div>
                  <p style={styles.rewriteText}>
                    "{currentEvaluation.cLevelRewrite}"
                  </p>
                </div>

                {/* Overall Tip */}
                <div style={styles.overallTipCard}>
                  <strong style={{ color: colors.textPrimary, display: 'block', marginBottom: '4px' }}>
                    💡 Dica de Ouro da Diretora:
                  </strong>
                  <span style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                    {currentEvaluation.overallTip}
                  </span>
                </div>

                {/* Next Steps Controls */}
                <div style={styles.evalNextActions}>
                  <button
                    style={styles.actionBtnSecondary}
                    onClick={handleRetryQuestion}
                    disabled={isGeneratingQuestion}
                  >
                    <RefreshCwIcon style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                    Tentar Novamente
                  </button>

                  <button
                    style={styles.actionBtnPdf}
                    onClick={() => {
                      if (turns.length > 0) {
                        handleExportTurnPdf(turns[turns.length - 1]);
                      }
                    }}
                    title="Exportar esta pergunta e diagnóstico em PDF"
                  >
                    <FileText style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                    Baixar Feedback em PDF
                  </button>

                  <button
                    style={styles.actionBtn}
                    onClick={handleNextQuestion}
                    disabled={isGeneratingQuestion}
                  >
                    Próxima Pergunta da Banca →
                  </button>
                </div>
              </div>
            ) : (
              /* Waiting / Tips Banner */
              <div style={styles.placeholderCard}>
                <div style={styles.placeholderIconBox}>
                  <AwardIcon style={{ width: '36px', height: '36px', color: colors.primary }} />
                </div>
                <h4 style={{ margin: '12px 0 6px 0', fontSize: '17px', fontWeight: '700', color: colors.textPrimary }}>
                  Aguardando Sua Resposta
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.6, textAlign: 'center' }}>
                  Acione o microfone à esquerda ou digite seus argumentos. Assim que submeter, a <strong>Dra. Valéria Silveira</strong> fará a auditoria estrutural STAR e calculará sua nota executiva.
                </p>

                <div style={styles.quickTipsList}>
                  <div style={styles.quickTipItem}>
                    <strong>1. Situação:</strong> Descreva o contexto em 2 frases objetivas.
                  </div>
                  <div style={styles.quickTipItem}>
                    <strong>2. Tarefa:</strong> Deixe claro o desafio e o risco de negócio.
                  </div>
                  <div style={styles.quickTipItem}>
                    <strong>3. Ação:</strong> Use "Eu liderei", "Eu decidi" (protagonismo).
                  </div>
                  <div style={styles.quickTipItem}>
                    <strong>4. Resultado:</strong> Finalize com números, % e impacto tangível.
                  </div>
                </div>
              </div>
            )}

            {/* Session History Summary */}
            {turns.length > 0 && (
              <div style={styles.historyListCard}>
                <div style={styles.historyHeader}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: colors.textPrimary }}>
                      Histórico da Rodada ({turns.length} respondidas)
                    </h4>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: colors.primary }}>
                      Média:{' '}
                      {Math.round(
                        turns.reduce((acc, t) => acc + (t.evaluation?.score || 0), 0) / turns.length
                      )}
                      /100
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      style={styles.btnMiniPdf}
                      onClick={() => handleExportSessionPdf()}
                      title="Exportar dossiê desta rodada em PDF"
                    >
                      <DownloadIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
                      PDF Rodada
                    </button>
                    <button
                      style={styles.btnMiniOutline}
                      onClick={() => setActiveTab('evolution')}
                      title="Abrir painel de acompanhamento de evolução"
                    >
                      <TrendingUpIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
                      Ver Evolução
                    </button>
                  </div>
                </div>

                <div style={styles.historyItems}>
                  {turns.map(turn => (
                    <div key={turn.id} style={styles.historyItemRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: colors.textPrimary }}>
                          Pergunta #{turn.questionNumber} ({turn.competency})
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: getScoreBadgeColor(turn.evaluation?.score || 0).bg,
                          color: '#ffffff'
                        }}>
                          {turn.evaluation?.score} pts
                        </span>
                      </div>
                      <p style={styles.historyQuestionSnippet}>
                        "{turn.question}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getStyles = (colors: any, theme: string): { [key: string]: React.CSSProperties } => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    position: 'relative',
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
  headerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '18px 24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    position: 'relative',
    width: '54px',
    height: '54px',
    borderRadius: '14px',
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
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: `2px solid ${colors.surface}`,
    boxShadow: '0 0 6px #10b981',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: colors.textPrimary,
  },
  badgeLive: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '6px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    letterSpacing: '0.04em',
  },
  badgeRole: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
  },
  headerSub: {
    margin: '4px 0 0 0',
    fontSize: '13px',
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
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textOnPrimary,
    backgroundColor: colors.primary,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
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
  },
  configCard: {
    backgroundColor: colors.surface,
    padding: '20px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: colors.shadow || '0 4px 18px rgba(0,0,0,0.04)',
  },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: '10px',
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: '0.02em',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.inputText,
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.inputText,
    outline: 'none',
  },
  quickRoles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px',
  },
  miniChip: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    cursor: 'pointer',
  },
  configFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '12px',
  },
  startBanner: {
    backgroundColor: colors.surface,
    padding: '48px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
  },
  startBannerInner: {
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  startIconCircle: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(37, 99, 235, 0.15)',
  },
  startTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  startDesc: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  featurePillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '4px',
  },
  featurePill: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
  },
  startBigBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '800',
    color: colors.textOnPrimary,
    backgroundColor: colors.primary,
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
    marginTop: '8px',
  },
  activeStageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '18px',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionCard: {
    backgroundColor: colors.surface,
    padding: '20px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  questionNumberBadge: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: colors.primary,
    color: '#ffffff',
  },
  competencyTag: {
    fontSize: '12px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '6px',
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
  },
  speakBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.background,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
  speakBtnActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  loadingQuestionBox: {
    padding: '30px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  pulseDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    boxShadow: `0 0 10px ${colors.primary}`,
    animation: 'pulse 1.5s infinite',
  },
  questionText: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 1.6,
    fontStyle: 'italic',
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#141d2e' : '#f8fafc',
    borderRadius: '12px',
    borderLeft: `4px solid ${colors.primary}`,
  },
  contextTipBox: {
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    backgroundColor: colors.background,
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  answerBox: {
    backgroundColor: colors.surface,
    padding: '20px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingTimer: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#ef4444',
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  micControlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  micBtnReady: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 22px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: colors.primary,
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
    transition: 'transform 0.1s',
  },
  micBtnRecording: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 22px',
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)',
    animation: 'pulse 1.5s infinite',
  },
  clearBtn: {
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  textareaWrapper: {
    width: '100%',
  },
  answerTextarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    lineHeight: 1.6,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.inputText,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  answerFooterActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '800',
    color: colors.textOnPrimary,
    backgroundColor: colors.primary,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
  },
  submitBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '700',
    color: colors.buttonDisabledText,
    backgroundColor: colors.buttonDisabledBg,
    borderRadius: '10px',
    border: 'none',
    cursor: 'not-allowed',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  evaluationCard: {
    backgroundColor: colors.surface,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  evaluationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: '14px',
  },
  verdictTitle: {
    margin: '4px 0 0 0',
    fontSize: '17px',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: '-0.01em',
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '12px',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  scoreNumber: {
    fontSize: '24px',
    fontWeight: '900',
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '10px',
    fontWeight: '700',
    opacity: 0.9,
  },
  starGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
  },
  starCol: {
    padding: '10px 12px',
    backgroundColor: colors.background,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  starLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: colors.primary,
    display: 'block',
    marginBottom: '4px',
    letterSpacing: '0.02em',
  },
  starText: {
    margin: 0,
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  analysisTwoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  analysisBoxGreen: {
    padding: '12px 14px',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  analysisTitleGreen: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: '800',
    color: '#10b981',
  },
  analysisBoxOrange: {
    padding: '12px 14px',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: '10px',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  analysisTitleOrange: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: '800',
    color: '#f59e0b',
  },
  bulletList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '12px',
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  rewriteCard: {
    padding: '14px 16px',
    backgroundColor: theme === 'dark' ? '#141d2e' : '#eff6ff',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  rewriteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.primary,
    cursor: 'pointer',
  },
  rewriteText: {
    margin: 0,
    fontSize: '13px',
    color: colors.textPrimary,
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  overallTipCard: {
    padding: '12px 14px',
    backgroundColor: colors.background,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  evalNextActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '14px',
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    padding: '32px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  placeholderIconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTipsList: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  quickTipItem: {
    fontSize: '12px',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  historyListCard: {
    backgroundColor: colors.surface,
    padding: '18px 20px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItemRow: {
    padding: '10px 12px',
    backgroundColor: colors.background,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  historyQuestionSnippet: {
    margin: 0,
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tabNavRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: colors.surface,
    padding: '8px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 2px 10px rgba(0,0,0,0.03)',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    borderRadius: '8px',
    border: `1px solid ${colors.primary}`,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
  },
  tabBadgeActive: {
    marginLeft: '8px',
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '6px',
    backgroundColor: colors.primary,
    color: '#ffffff',
  },
  tabBadgeCounter: {
    marginLeft: '8px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px',
    backgroundColor: colors.border,
    color: colors.textPrimary,
  },
  actionBtnPdf: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#0284c7',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
    transition: 'all 0.15s ease',
  },
  btnMiniPdf: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#0284c7',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  btnMiniOutline: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight || 'rgba(37, 99, 235, 0.1)',
    borderRadius: '6px',
    border: `1px solid ${colors.primary}`,
    cursor: 'pointer',
  },
});
