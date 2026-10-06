// InterviewEvolutionTracker.tsx - Tracks candidate performance evolution over time with Dra. Valéria's feedback
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { InterviewSessionRecord, InterviewTurn } from '../types';
import {
  TrendingUpIcon,
  AwardIcon,
  CheckCircleIcon,
  DownloadIcon,
  PlayIcon,
  RefreshCwIcon,
  CopyIcon,
  SlidersIcon
} from './icons';

interface InterviewEvolutionTrackerProps {
  sessions: InterviewSessionRecord[];
  onExportSessionPdf: (session?: InterviewSessionRecord) => void;
  onExportFullEvolutionPdf?: () => void;
  onExportFullPdf?: () => void;
  onClearHistory: () => void;
  onLoadDemoHistory: () => void;
  onStartNewRound?: () => void;
  onStartNewSession?: () => void;
  candidateName?: string;
  currentConfig?: any;
}

export const InterviewEvolutionTracker: React.FC<InterviewEvolutionTrackerProps> = ({
  sessions,
  onExportSessionPdf,
  onExportFullEvolutionPdf,
  onExportFullPdf,
  onClearHistory,
  onLoadDemoHistory,
  onStartNewRound,
  onStartNewSession,
  candidateName
}) => {
  const handleExportFull = onExportFullEvolutionPdf || onExportFullPdf || (() => {});
  const handleStartNew = onStartNewRound || onStartNewSession || (() => {});
  const { colors, theme } = useContext(ThemeContext);
  const styles = getStyles(colors, theme);

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[sessions.length - 1].id : null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute Aggregate Stats
  const totalSessions = sessions.length;
  const allTurns: InterviewTurn[] = sessions.flatMap(s => s.turns || []);
  const totalQuestions = allTurns.length;

  const validScores = sessions.map(s => s.averageScore).filter(s => s > 0);
  const globalAvg =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, s) => acc + s, 0) / validScores.length)
      : 0;

  // Evolution difference between first and latest session
  const firstScore = validScores.length > 0 ? validScores[0] : 0;
  const latestScore = validScores.length > 0 ? validScores[validScores.length - 1] : 0;
  const evolutionDiff = latestScore - firstScore;

  // C-Level standard rate (score >= 80)
  const cLevelTurnsCount = allTurns.filter(t => (t.evaluation?.score || 0) >= 80).length;
  const cLevelRate = totalQuestions > 0 ? Math.round((cLevelTurnsCount / totalQuestions) * 100) : 0;

  // Color helper for scores
  const getScoreColor = (score: number) => {
    if (score >= 85) return { bg: '#10b981', light: 'rgba(16, 185, 129, 0.12)', border: '#10b981', label: 'C-Level / Excepcional' };
    if (score >= 70) return { bg: '#2563eb', light: 'rgba(37, 99, 235, 0.12)', border: '#2563eb', label: 'Apto • Calibrado' };
    if (score >= 55) return { bg: '#f59e0b', light: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', label: 'Em Ajuste' };
    return { bg: '#ef4444', light: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', label: 'Necessita Treino' };
  };

  const handleCopyModel = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (totalSessions === 0) {
    return (
      <div style={styles.emptyCard}>
        <div style={styles.emptyIconCircle}>
          <TrendingUpIcon style={{ width: '38px', height: '38px', color: colors.primary }} />
        </div>
        <h3 style={styles.emptyTitle}>Acompanhamento de Evolução de Performance</h3>
        <p style={styles.emptySubtitle}>
          Você ainda não possui rodadas registradas nesta conta. Conforme você responde às perguntas da{' '}
          <strong>Dra. Valéria Silveira</strong> no simulador de voz, cada nota, análise STAR e evolução temporal
          serão consolidadas aqui para mensurar seu progresso rumo ao padrão C-Level.
        </p>

        <div style={styles.emptyActionsRow}>
          <button style={styles.btnPrimary} onClick={handleStartNew}>
            <PlayIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            Iniciar 1ª Rodada no Simulador
          </button>
          <button style={styles.btnSecondary} onClick={onLoadDemoHistory}>
            <AwardIcon style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            Carregar 3 Rodadas Demo (Visualizar Curva)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Banner with Master PDF Export */}
      <div style={styles.masterBanner}>
        <div style={styles.masterBannerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={styles.badgeExecutive}>PAINEL LONGITUDINAL</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: colors.primary }}>
              {candidateName ? `Candidato(a): ${candidateName}` : 'Auditoria Executiva STAR'}
            </span>
          </div>
          <h2 style={styles.masterTitle}>Evolução de Performance ao Longo do Tempo</h2>
          <p style={styles.masterDesc}>
            Histórico consolidado de avaliações, comparativo de maturidade executiva e pareceres da{' '}
            <strong>Dra. Valéria Silveira</strong>.
          </p>
        </div>

        <div style={styles.masterBannerRight}>
          <button
            style={styles.btnExportMasterPdf}
            onClick={handleExportFull}
            title="Exportar todo o histórico consolidado e gráficos de evolução em PDF profissional"
          >
            <DownloadIcon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Exportar Dossiê Completo em PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        {/* Card 1: Média Global */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>MÉDIA GLOBAL DAS RODADAS</span>
            <AwardIcon style={{ width: '18px', height: '18px', color: colors.primary }} />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={{ ...styles.kpiBigNumber, color: getScoreColor(globalAvg).bg }}>
              {globalAvg}
            </span>
            <span style={styles.kpiSubNumber}>/ 100</span>
          </div>
          <span
            style={{
              ...styles.kpiBadge,
              backgroundColor: getScoreColor(globalAvg).light,
              color: getScoreColor(globalAvg).bg,
              border: `1px solid ${getScoreColor(globalAvg).border}`
            }}
          >
            {getScoreColor(globalAvg).label}
          </span>
        </div>

        {/* Card 2: Evolução Acumulada */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>CRESCIMENTO HISTÓRICO</span>
            <TrendingUpIcon style={{ width: '18px', height: '18px', color: '#10b981' }} />
          </div>
          <div style={styles.kpiValueRow}>
            <span
              style={{
                ...styles.kpiBigNumber,
                color: evolutionDiff >= 0 ? '#10b981' : '#ef4444'
              }}
            >
              {evolutionDiff >= 0 ? `+${evolutionDiff}` : evolutionDiff}
            </span>
            <span style={styles.kpiSubNumber}>pts</span>
          </div>
          <span style={styles.kpiHelperText}>
            Da 1ª sessão ({firstScore} pts) para a última ({latestScore} pts)
          </span>
        </div>

        {/* Card 3: Perguntas Avaliadas */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>RESPOSTAS STAR AUDITADAS</span>
            <CheckCircleIcon style={{ width: '18px', height: '18px', color: colors.primary }} />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiBigNumber}>{totalQuestions}</span>
            <span style={styles.kpiSubNumber}>respostas</span>
          </div>
          <span style={styles.kpiHelperText}>
            Distribuídas em {totalSessions} rodada(s) de simulação
          </span>
        </div>

        {/* Card 4: Taxa Padrão C-Level */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>ÍNDICE PADRÃO C-LEVEL</span>
            <span style={{ fontSize: '15px' }}>🏛️</span>
          </div>
          <div style={styles.kpiValueRow}>
            <span style={{ ...styles.kpiBigNumber, color: cLevelRate >= 60 ? '#10b981' : '#f59e0b' }}>
              {cLevelRate}%
            </span>
            <span style={styles.kpiSubNumber}>≥ 80 pts</span>
          </div>
          <span style={styles.kpiHelperText}>
            {cLevelTurnsCount} de {totalQuestions} respostas em nível de alta diretoria
          </span>
        </div>
      </div>

      {/* Visual Evolution Chart / Timeline */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <div>
            <h3 style={styles.chartTitle}>📈 Curva Visual de Desempenho ao Longo do Tempo</h3>
            <p style={styles.chartSub}>
              Acompanhe a trajetória da sua nota em cada sessão simulada com a Dra. Valéria
            </p>
          </div>
          <div style={styles.legendRow}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }}></span>
              ≥ 85 C-Level
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }}></span>
              70-84 Apto
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#f59e0b' }}></span>
              &lt; 70 Calibração
            </span>
          </div>
        </div>

        {/* SVG / Styled Score Curve */}
        <div style={styles.chartContainer}>
          <div style={styles.chartBarsGrid}>
            {sessions.map((sess, idx) => {
              const score = sess.averageScore;
              const colorInfo = getScoreColor(score);
              const heightPct = Math.max(15, Math.min(100, score));
              const isLatest = idx === sessions.length - 1;
              const dateFormatted = new Date(sess.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short'
              });

              return (
                <div key={sess.id} style={styles.barColumn}>
                  {/* Score Pill on top */}
                  <div
                    style={{
                      ...styles.barPill,
                      backgroundColor: colorInfo.bg,
                      boxShadow: isLatest ? '0 0 10px rgba(37, 99, 235, 0.4)' : 'none'
                    }}
                  >
                    {score} pts
                  </div>

                  {/* Vertical Bar */}
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        height: `${heightPct}%`,
                        backgroundColor: colorInfo.bg
                      }}
                    ></div>
                  </div>

                  {/* Date & Role label */}
                  <div style={styles.barMeta}>
                    <span style={styles.barDate}>{dateFormatted}</span>
                    <span style={styles.barRole} title={sess.targetRole}>
                      R#{idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STAR Methodology Mastery Breakdown */}
      <div style={styles.starBreakdownCard}>
        <h3 style={styles.sectionTitle}>🎯 Domínio Metodológico STAR (Diagnóstico Agregado)</h3>
        <p style={styles.sectionSub}>
          Média estimada de aderência em cada um dos 4 pilares comportamentais exigidos pela banca
        </p>

        <div style={styles.starMetricsGrid}>
          {/* Situation */}
          <div style={styles.starPillarBox}>
            <div style={styles.starPillarHeader}>
              <span style={styles.starPillarLetter}>S</span>
              <div>
                <strong style={styles.starPillarName}>Situação</strong>
                <span style={styles.starPillarDesc}>Contexto, mercado e momento</span>
              </div>
            </div>
            <div style={styles.starPillarProgress}>
              <div style={{ ...styles.starPillarBar, width: `${Math.min(100, Math.max(50, globalAvg + 2))}%`, backgroundColor: '#3b82f6' }}></div>
            </div>
            <span style={styles.starPillarScore}>Aderência: {Math.min(100, Math.max(50, globalAvg + 2))}%</span>
          </div>

          {/* Task */}
          <div style={styles.starPillarBox}>
            <div style={styles.starPillarHeader}>
              <span style={styles.starPillarLetter}>T</span>
              <div>
                <strong style={styles.starPillarName}>Tarefa</strong>
                <span style={styles.starPillarDesc}>Desafio, risco e meta</span>
              </div>
            </div>
            <div style={styles.starPillarProgress}>
              <div style={{ ...styles.starPillarBar, width: `${Math.min(100, Math.max(45, globalAvg - 3))}%`, backgroundColor: '#8b5cf6' }}></div>
            </div>
            <span style={styles.starPillarScore}>Aderência: {Math.min(100, Math.max(45, globalAvg - 3))}%</span>
          </div>

          {/* Action */}
          <div style={styles.starPillarBox}>
            <div style={styles.starPillarHeader}>
              <span style={styles.starPillarLetter}>A</span>
              <div>
                <strong style={styles.starPillarName}>Ação</strong>
                <span style={styles.starPillarDesc}>Protagonismo ("Eu") e governança</span>
              </div>
            </div>
            <div style={styles.starPillarProgress}>
              <div style={{ ...styles.starPillarBar, width: `${Math.min(100, Math.max(50, globalAvg))}%`, backgroundColor: '#10b981' }}></div>
            </div>
            <span style={styles.starPillarScore}>Aderência: {Math.min(100, Math.max(50, globalAvg))}%</span>
          </div>

          {/* Result */}
          <div style={styles.starPillarBox}>
            <div style={styles.starPillarHeader}>
              <span style={styles.starPillarLetter}>R</span>
              <div>
                <strong style={styles.starPillarName}>Resultado</strong>
                <span style={styles.starPillarDesc}>ROI, métricas, % e impacto</span>
              </div>
            </div>
            <div style={styles.starPillarProgress}>
              <div style={{ ...styles.starPillarBar, width: `${Math.min(100, Math.max(40, globalAvg - 5))}%`, backgroundColor: '#f59e0b' }}></div>
            </div>
            <span style={styles.starPillarScore}>Aderência: {Math.min(100, Math.max(40, globalAvg - 5))}%</span>
          </div>
        </div>
      </div>

      {/* Historical Sessions List with Direct PDF Download */}
      <div style={styles.historyListSection}>
        <div style={styles.historyListHeader}>
          <div>
            <h3 style={styles.sectionTitle}>📋 Registro Detalhado de Rodadas e Feedbacks</h3>
            <span style={styles.sectionSub}>
              Clique em qualquer rodada para rever as respostas e exportar o PDF executivo
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.btnSecondaryMini} onClick={onStartNewRound}>
              <PlayIcon style={{ width: '13px', height: '13px', marginRight: '4px' }} />
              Nova Simulação
            </button>
            <button
              style={styles.btnClearMini}
              onClick={() => {
                if (window.confirm("Deseja realmente limpar o histórico gravado de simulações?")) {
                  onClearHistory();
                }
              }}
              title="Limpar histórico"
            >
              Limpar
            </button>
          </div>
        </div>

        <div style={styles.sessionsList}>
          {sessions.slice().reverse().map((session, reverseIdx) => {
            const isExpanded = expandedSessionId === session.id;
            const scoreColor = getScoreColor(session.averageScore);
            const dateStr = new Date(session.date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={session.id} style={styles.sessionCard}>
                {/* Session Card Summary Header */}
                <div
                  style={styles.sessionCardHeader}
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                >
                  <div style={styles.sessionLeftMeta}>
                    <div
                      style={{
                        ...styles.sessionScoreBadge,
                        backgroundColor: scoreColor.bg
                      }}
                    >
                      <span style={styles.sessionScoreNum}>{session.averageScore}</span>
                      <span style={styles.sessionScoreLabel}>/100</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={styles.sessionTitle}>
                          {session.targetRole} ({session.seniority})
                        </h4>
                        <span style={styles.sessionDateBadge}>{dateStr}</span>
                      </div>
                      <p style={styles.sessionSubText}>
                        Foco: {session.focusArea} • {session.turns?.length || 0} pergunta(s) respondida(s)
                      </p>
                    </div>
                  </div>

                  <div style={styles.sessionRightActions} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      style={styles.btnDownloadPdfRound}
                      onClick={() => onExportSessionPdf(session)}
                      title="Exportar esta rodada em arquivo PDF profissional"
                    >
                      <DownloadIcon style={{ width: '14px', height: '14px', marginRight: '5px' }} />
                      Exportar PDF da Rodada
                    </button>

                    <button
                      type="button"
                      style={styles.btnToggleExpand}
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    >
                      {isExpanded ? 'Ocultar ▲' : 'Ver Detalhes ▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded Session Turns */}
                {isExpanded && (
                  <div style={styles.expandedTurnsContainer}>
                    <div style={styles.sessionVerdictNotice}>
                      <span style={{ fontWeight: '700', color: scoreColor.bg }}>
                        🏛️ Parecer da Diretoria:
                      </span>{' '}
                      <span>{session.verdictGrade}</span>
                    </div>

                    {session.turns && session.turns.map(turn => (
                      <div key={turn.id} style={styles.expandedTurnItem}>
                        <div style={styles.turnTopRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={styles.turnBadge}>Pergunta #{turn.questionNumber}</span>
                            <span style={styles.turnCompBadge}>🎯 {turn.competency}</span>
                          </div>
                          {turn.evaluation && (
                            <span
                              style={{
                                ...styles.turnScorePill,
                                backgroundColor: getScoreColor(turn.evaluation.score).bg
                              }}
                            >
                              Nota: {turn.evaluation.score}/100
                            </span>
                          )}
                        </div>

                        <p style={styles.turnQuestionText}>"{turn.question}"</p>

                        <div style={styles.turnAnswerBox}>
                          <strong style={{ fontSize: '11px', color: colors.textSecondary, display: 'block', marginBottom: '3px' }}>
                            Resposta do Candidato:
                          </strong>
                          <p style={styles.turnAnswerText}>"{turn.userAnswer}"</p>
                        </div>

                        {turn.evaluation && (
                          <div style={styles.turnEvalDetails}>
                            <div style={styles.starMiniGrid}>
                              <div>
                                <span style={styles.starMiniLabel}>S • Situação:</span>
                                <p style={styles.starMiniText}>{turn.evaluation.starAnalysis.situation}</p>
                              </div>
                              <div>
                                <span style={styles.starMiniLabel}>T • Tarefa:</span>
                                <p style={styles.starMiniText}>{turn.evaluation.starAnalysis.task}</p>
                              </div>
                              <div>
                                <span style={styles.starMiniLabel}>A • Ação:</span>
                                <p style={styles.starMiniText}>{turn.evaluation.starAnalysis.action}</p>
                              </div>
                              <div>
                                <span style={styles.starMiniLabel}>R • Resultado:</span>
                                <p style={styles.starMiniText}>{turn.evaluation.starAnalysis.result}</p>
                              </div>
                            </div>

                            {turn.evaluation.cLevelRewrite && (
                              <div style={styles.cLevelRewriteBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <strong style={{ fontSize: '11px', color: colors.primary }}>
                                    🏛️ Reescrita Padrão C-Level (Dra. Valéria):
                                  </strong>
                                  <button
                                    style={styles.miniCopyBtn}
                                    onClick={() => handleCopyModel(turn.evaluation!.cLevelRewrite, turn.id)}
                                  >
                                    <CopyIcon style={{ width: '12px', height: '12px', marginRight: '3px' }} />
                                    {copiedId === turn.id ? 'Copiado!' : 'Copiar'}
                                  </button>
                                </div>
                                <p style={styles.cLevelRewriteText}>"{turn.evaluation.cLevelRewrite}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getStyles = (colors: any, theme: string): { [key: string]: React.CSSProperties } => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  masterBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '24px 28px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.04)',
  },
  masterBannerLeft: {
    flex: 1,
    minWidth: '280px',
  },
  masterBannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badgeExecutive: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    letterSpacing: '0.05em',
  },
  masterTitle: {
    margin: '4px 0 6px 0',
    fontSize: '22px',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: '-0.02em',
  },
  masterDesc: {
    margin: 0,
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  btnExportMasterPdf: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
    transition: 'all 0.15s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '14px',
  },
  kpiCard: {
    padding: '18px 20px',
    backgroundColor: colors.surface,
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.04em',
    color: colors.textSecondary,
  },
  kpiValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  kpiBigNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kpiSubNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  kpiBadge: {
    alignSelf: 'flex-start',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    marginTop: '2px',
  },
  kpiHelperText: {
    fontSize: '11px',
    color: colors.textSecondary,
    marginTop: '2px',
  },
  chartCard: {
    padding: '24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  chartTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: colors.textPrimary,
  },
  chartSub: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: colors.textSecondary,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '11px',
    color: colors.textSecondary,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  chartContainer: {
    padding: '16px 0 6px 0',
  },
  chartBarsGrid: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    height: '180px',
    borderBottom: `2px solid ${colors.border}`,
    paddingBottom: '8px',
    overflowX: 'auto',
  },
  barColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    minWidth: '58px',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barPill: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  barTrack: {
    width: '32px',
    height: '110px',
    backgroundColor: colors.background,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },
  barFill: {
    width: '100%',
    borderRadius: '7px 7px 0 0',
    transition: 'height 0.3s ease',
  },
  barMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    marginTop: '4px',
  },
  barDate: {
    fontSize: '10px',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  barRole: {
    fontSize: '11px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  starBreakdownCard: {
    padding: '22px 24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    margin: '4px 0 16px 0',
    fontSize: '12px',
    color: colors.textSecondary,
  },
  starMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  starPillarBox: {
    padding: '14px',
    backgroundColor: colors.background,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  starPillarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  starPillarLetter: {
    fontSize: '18px',
    fontWeight: '900',
    color: colors.primary,
    backgroundColor: colors.surface,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  starPillarName: {
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textPrimary,
    display: 'block',
  },
  starPillarDesc: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  starPillarProgress: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: '6px',
  },
  starPillarBar: {
    height: '100%',
    borderRadius: '3px',
  },
  starPillarScore: {
    fontSize: '11px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyListSection: {
    padding: '22px 24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  },
  historyListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  btnSecondaryMini: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  btnClearMini: {
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sessionCard: {
    backgroundColor: colors.background,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  sessionCardHeader: {
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    cursor: 'pointer',
  },
  sessionLeftMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
  },
  sessionScoreBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    flexShrink: 0,
  },
  sessionScoreNum: {
    fontSize: '16px',
    fontWeight: '800',
    lineHeight: 1,
  },
  sessionScoreLabel: {
    fontSize: '9px',
    fontWeight: '700',
    opacity: 0.85,
  },
  sessionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionDateBadge: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  sessionSubText: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: colors.textSecondary,
  },
  sessionRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnDownloadPdfRound: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: colors.textOnPrimary || '#ffffff',
    backgroundColor: colors.primary,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  btnToggleExpand: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  expandedTurnsContainer: {
    padding: '16px 18px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sessionVerdictNotice: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    fontSize: '12px',
    color: colors.textPrimary,
  },
  expandedTurnItem: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
  },
  turnTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '6px',
  },
  turnBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: colors.textPrimary,
  },
  turnCompBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.primary,
  },
  turnScorePill: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#ffffff',
    padding: '2px 7px',
    borderRadius: '5px',
  },
  turnQuestionText: {
    margin: '4px 0 8px 0',
    fontSize: '13px',
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  turnAnswerBox: {
    padding: '8px 10px',
    backgroundColor: colors.surface,
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    marginBottom: '10px',
  },
  turnAnswerText: {
    margin: 0,
    fontSize: '12px',
    color: colors.textSecondary,
  },
  turnEvalDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  starMiniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    fontSize: '11px',
  },
  starMiniLabel: {
    fontWeight: '700',
    color: colors.primary,
    display: 'block',
  },
  starMiniText: {
    margin: '2px 0 0 0',
    color: colors.textSecondary,
    fontSize: '11px',
  },
  cLevelRewriteBox: {
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
  },
  cLevelRewriteText: {
    margin: 0,
    fontSize: '12px',
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  miniCopyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 24px',
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  },
  emptyIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: colors.textSecondary,
    maxWidth: '560px',
    lineHeight: 1.6,
  },
  emptyActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 22px',
    fontSize: '14px',
    fontWeight: '700',
    color: colors.textOnPrimary || '#ffffff',
    backgroundColor: colors.primary,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
});
