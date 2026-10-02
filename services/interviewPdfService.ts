// interviewPdfService.ts - Generates executive PDF performance dossier from Dra. Valéria Silveira
import { jsPDF } from 'jspdf';
import { InterviewConfig, InterviewTurn, InterviewSessionRecord } from '../types';

interface ExportOptions {
  config: InterviewConfig;
  turns: InterviewTurn[];
  candidateName?: string;
  historicalSessions?: InterviewSessionRecord[];
}

export const exportInterviewSessionToPdf = (options: ExportOptions) => {
  const { config, turns, candidateName, historicalSessions = [] } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add pages and track pagination
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = margin;
      drawPageHeaderMinimal();
    }
  };

  const drawPageHeaderMinimal = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CV-AUTOPILOT • DOSSIÊ EXECUTIVO DE PERFORMANCE EM ENTREVISTAS', margin, 10);
    doc.setFont('helvetica', 'normal');
    doc.text('DRA. VALÉRIA SILVEIRA (CPO & MASTER MENTOR)', pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
    y = 18;
  };

  // 1. Cover / Main Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 38, 'F');

  // Badge inside banner
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(margin + 6, y + 5, 60, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EXECUTIVE TALENT EVALUATION', margin + 9, y + 9.2);

  // Main Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE DESEMPENHO E FEEDBACK DE ENTREVISTA', margin + 6, y + 19);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'Auditoria Metodológica STAR • Parecer da Banca Executiva • Dra. Valéria Silveira',
    margin + 6,
    y + 25
  );

  // Date and Session meta
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Emitido em: ${dateStr} | Avaliadora: Dra. Valéria Silveira`, margin + 6, y + 32);

  y += 44;

  // 2. Candidate & Session Info Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  const colWidth = contentWidth / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CANDIDATO(A):', margin + 5, y + 7);
  doc.text('CARGO / NÍVEL:', margin + 5, y + 15);
  doc.text('EMPRESA / ALVO:', margin + 5, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(candidateName?.trim() || 'Profissional em Transição / Liderança', margin + 35, y + 7);
  doc.text(`${config.targetRole} (${config.seniority})`, margin + 35, y + 15);
  doc.text(config.companyTarget || 'Corporação de Alta Performance / Mercado Geral', margin + 35, y + 23);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FOCO DA BANCA:', margin + colWidth + 5, y + 7);
  doc.text('TOTAL DE PERGUNTAS:', margin + colWidth + 5, y + 15);
  doc.text('STATUS DA SESSÃO:', margin + colWidth + 5, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const focusTrimmed = doc.splitTextToSize(config.focusArea, colWidth - 45);
  doc.text(focusTrimmed[0] || config.focusArea, margin + colWidth + 40, y + 7);
  doc.text(`${turns.length} pergunta(s) respondida(s)`, margin + colWidth + 40, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Auditoria Concluída ✓', margin + colWidth + 40, y + 23);

  y += 38;

  // 3. Consolidated Score & Executive Verdict Block
  const scores = turns.map(t => t.evaluation?.score || 0).filter(s => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  let verdictClassification = 'Necessita Reformulação e Treino';
  let badgeColor: [number, number, number] = [239, 68, 68]; // red
  if (avgScore >= 85) {
    verdictClassification = 'Excepcional • Padrão C-Level / Liderança';
    badgeColor = [16, 185, 129]; // emerald
  } else if (avgScore >= 70) {
    verdictClassification = 'Apto com Boa Estrutura • Em Calibração';
    badgeColor = [37, 99, 235]; // blue
  } else if (avgScore >= 55) {
    verdictClassification = 'Básico • Necessita Maior Protagonismo e Métricas';
    badgeColor = [245, 158, 11]; // amber
  }

  // Score Box
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(margin, y, 52, 28, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('NOTA MÉDIA DA BANCA', margin + 6, y + 7);

  doc.setFontSize(20);
  doc.text(`${avgScore}`, margin + 6, y + 18);
  doc.setFontSize(10);
  doc.text('/ 100', margin + 30, y + 18);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Base: ${turns.length} respostas STAR`, margin + 6, y + 24);

  // Verdict Summary beside score
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 56, y, contentWidth - 56, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VEREDITO DA DIRETORA DE RH:', margin + 61, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(verdictClassification, margin + 61, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const verdictSnippet =
    turns[0]?.evaluation?.executiveVerdict
      ? `Parecer Geral: "${turns[0].evaluation.executiveVerdict}"`
      : 'Avaliação estrutural e comportamental baseada em competências de impacto e ROI.';
  const wrappedVerdict = doc.splitTextToSize(verdictSnippet, contentWidth - 66);
  doc.text(wrappedVerdict.slice(0, 2), margin + 61, y + 20);

  y += 34;

  // 4. Performance Evolution Over Time (if history available)
  if (historicalSessions && historicalSessions.length > 0) {
    checkPageBreak(35);

    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('📈 ACOMPANHAMENTO DA EVOLUÇÃO DE PERFORMANCE AO LONGO DO TEMPO', margin + 6, y + 6);

    const pastScores = historicalSessions.map(s => s.averageScore).filter(s => s > 0);
    const firstScore = pastScores[0] || avgScore;
    const diff = avgScore - firstScore;
    const diffSign = diff >= 0 ? `+${diff}` : `${diff}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Sessões Registradas: ${historicalSessions.length + 1} | 1ª Rodada: ${firstScore} pts | Rodada Atual: ${avgScore} pts (${diffSign} pts de evolução)`,
      margin + 6,
      y + 12
    );

    // Mini evolution track pills
    let pillX = margin + 6;
    const allRecent = [...historicalSessions.slice(-4), { date: 'Atual', averageScore: avgScore }];
    allRecent.forEach((rec, idx) => {
      const isCurrent = idx === allRecent.length - 1;
      doc.setFillColor(isCurrent ? 37 : 226, isCurrent ? 99 : 232, isCurrent ? 235 : 240);
      doc.roundedRect(pillX, y + 16, 36, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(isCurrent ? 255 : 30, isCurrent ? 255 : 41, isCurrent ? 255 : 59);
      doc.text(
        `${rec.date.split('T')[0] || rec.date}: ${rec.averageScore} pts`,
        pillX + 3,
        y + 21.5
      );
      pillX += 40;
    });

    y += 34;
  }

  // Section Title: Feedback Detalhado por Pergunta
  checkPageBreak(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('AUDITORIA DETALHADA E FEEDBACK CIRÚRGICO POR PERGUNTA', margin, y);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  // 5. Turn by Turn Detailed Cards
  turns.forEach((turn, index) => {
    const evalData = turn.evaluation;
    const turnScore = evalData?.score || 0;

    checkPageBreak(70);

    // Turn Container Box Header
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Estimate box height
    const startY = y;

    // Header bar of the question
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`PERGUNTA #${turn.questionNumber || index + 1} • Competência: ${turn.competency}`, margin + 5, y + 6.5);

    // Score badge on right
    doc.setFillColor(turnScore >= 80 ? 16 : turnScore >= 60 ? 245 : 239, turnScore >= 80 ? 185 : turnScore >= 60 ? 158 : 68, turnScore >= 80 ? 129 : turnScore >= 60 ? 11 : 68);
    doc.roundedRect(pageWidth - margin - 26, y + 2, 22, 6, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${turnScore}/100 pts`, pageWidth - margin - 23, y + 6);

    y += 14;

    // Question Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Pergunta da Banca:', margin + 4, y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const wrappedQ = doc.splitTextToSize(`"${turn.question}"`, contentWidth - 8);
    doc.text(wrappedQ, margin + 4, y + 4.5);
    y += 5 + wrappedQ.length * 3.8;

    // Candidate's Answer
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Resposta do Candidato:', margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    const wrappedAns = doc.splitTextToSize(`"${turn.userAnswer}"`, contentWidth - 8);
    // Limit answer length if extremely long to avoid 10-page runaway
    const displayedAns = wrappedAns.length > 8 ? [...wrappedAns.slice(0, 8), '... [texto resumido]'] : wrappedAns;
    doc.text(displayedAns, margin + 4, y + 4.5);
    y += 5 + displayedAns.length * 3.6;

    if (evalData) {
      // STAR Diagnosis Grid
      checkPageBreak(30);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 20, 1.5, 1.5, 'F');

      const col4 = (contentWidth - 4) / 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text('S • Situação', margin + 5, y + 4.5);
      doc.text('T • Tarefa', margin + 5 + col4, y + 4.5);
      doc.text('A • Ação', margin + 5 + col4 * 2, y + 4.5);
      doc.text('R • Resultado', margin + 5 + col4 * 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      const starS = doc.splitTextToSize(evalData.starAnalysis.situation || '-', col4 - 4);
      const starT = doc.splitTextToSize(evalData.starAnalysis.task || '-', col4 - 4);
      const starA = doc.splitTextToSize(evalData.starAnalysis.action || '-', col4 - 4);
      const starR = doc.splitTextToSize(evalData.starAnalysis.result || '-', col4 - 4);

      doc.text(starS.slice(0, 3), margin + 5, y + 8.5);
      doc.text(starT.slice(0, 3), margin + 5 + col4, y + 8.5);
      doc.text(starA.slice(0, 3), margin + 5 + col4 * 2, y + 8.5);
      doc.text(starR.slice(0, 3), margin + 5 + col4 * 3, y + 8.5);

      y += 24;

      // Strengths & Improvements Side-by-Side
      checkPageBreak(25);
      const halfW = (contentWidth - 8) / 2;

      // Strengths
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.roundedRect(margin + 2, y, halfW, 22, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Pontos Fortes Observados:', margin + 5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(6, 95, 70);
      let sY = y + 8.5;
      evalData.strengths.slice(0, 3).forEach(str => {
        const line = doc.splitTextToSize(`• ${str}`, halfW - 6);
        doc.text(line[0], margin + 5, sY);
        sY += 3.8;
      });

      // Improvements
      doc.setFillColor(254, 243, 199); // amber-50
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.roundedRect(margin + 4 + halfW, y, halfW, 22, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(217, 119, 6);
      doc.text('⚠ Oportunidades de Melhoria:', margin + 7 + halfW, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(146, 64, 14);
      let iY = y + 8.5;
      evalData.improvements.slice(0, 3).forEach(imp => {
        const line = doc.splitTextToSize(`• ${imp}`, halfW - 6);
        doc.text(line[0], margin + 7 + halfW, iY);
        iY += 3.8;
      });

      y += 26;

      // C-Level Rewrite Box
      if (evalData.cLevelRewrite) {
        checkPageBreak(28);
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.setDrawColor(199, 210, 254); // indigo-200
        doc.roundedRect(margin + 2, y, contentWidth - 4, 24, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(67, 56, 202);
        doc.text('🏛 Como a Dra. Valéria Responderia (Padrão Executivo C-Level):', margin + 5, y + 5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(49, 46, 129);
        const wrappedRewrite = doc.splitTextToSize(`"${evalData.cLevelRewrite}"`, contentWidth - 12);
        doc.text(wrappedRewrite.slice(0, 4), margin + 5, y + 9.5);

        y += 28;
      }

      // Golden Tip
      if (evalData.overallTip) {
        checkPageBreak(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('💡 Dica de Ouro da Mentora:', margin + 4, y + 1);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const wrappedTip = doc.splitTextToSize(evalData.overallTip, contentWidth - 8);
        doc.text(wrappedTip.slice(0, 2), margin + 4, y + 5);
        y += 6 + wrappedTip.slice(0, 2).length * 3.5;
      }
    }

    y += 8;
  });

  // 6. Action Plan & Signature
  checkPageBreak(35);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RECOMENDAÇÕES PARA AS PRÓXIMAS ETAPAS & ENTREVISTAS:', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Pratique a resposta em voz alta cronometrando entre 60 e 90 segundos para evitar divagações.', margin + 5, y + 12);
  doc.text('2. Garanta sempre o R (Resultado): declare porcentagens, faturamento, tempo poupado ou escala atingida.', margin + 5, y + 17);
  doc.text('3. Troque termos passivos ("fizeram", "ajudei") por verbos de comando ("estruturei", "negociei", "liderei").', margin + 5, y + 22);

  // Mentor Signature stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Dra. Valéria Silveira', pageWidth - margin - 50, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Chief People Officer & Orientadora Master', pageWidth - margin - 50, y + 21);
  doc.text('CV-AutoPilot Assessment Platform', pageWidth - margin - 50, y + 24.5);

  // Add Page numbers to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dossiê Confidencial de Avaliação • Dra. Valéria Silveira • Página ${i} de ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text('CV-AutoPilot AI', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Save the PDF
  const safeRole = config.targetRole.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const fileName = `Dossie_Entrevista_Dra_Valeria_${safeRole}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};

// Export individual turn to PDF
export const exportSingleTurnToPdf = (
  turn: InterviewTurn,
  config: InterviewConfig,
  candidateName?: string
) => {
  return exportInterviewSessionToPdf({
    config,
    turns: [turn],
    candidateName,
  });
};

// Export full historical evolution dossier across multiple sessions
export const exportEvolutionDossierToPdf = (
  sessions: InterviewSessionRecord[],
  candidateName?: string
) => {
  if (!sessions || sessions.length === 0) {
    throw new Error('Nenhuma sessão histórica encontrada para exportar.');
  }

  const allTurns = sessions.flatMap(s => s.turns || []);
  const latestSession = sessions[sessions.length - 1];

  const syntheticConfig: InterviewConfig = {
    targetRole: latestSession.targetRole || 'Evolução de Carreira Multi-Rodada',
    seniority: latestSession.seniority || 'Sênior / Liderança',
    focusArea: 'Auditoria de Evolução de Performance ao Longo do Tempo',
    companyTarget: latestSession.companyTarget || 'Mercado Geral / C-Level',
  };

  return exportInterviewSessionToPdf({
    config: syntheticConfig,
    turns: allTurns,
    candidateName,
    historicalSessions: sessions,
  });
};
