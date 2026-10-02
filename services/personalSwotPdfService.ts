// services/personalSwotPdfService.ts
// Gerador de PDF executivo para a Análise SWOT Pessoal de Carreira
import { jsPDF } from 'jspdf';
import { PersonalSWOTAnalysisResult } from '../types';

export interface PersonalSwotPdfOptions {
  swot: PersonalSWOTAnalysisResult;
  candidateName?: string;
  targetRole?: string;
  themeColorHex?: string;
}

export const buildPersonalSWOTPdfDoc = (options: PersonalSwotPdfOptions): jsPDF => {
  const {
    swot,
    candidateName = swot.candidateName || 'Profissional Executivo',
    targetRole = swot.targetRole || 'Posição de Liderança / Especialista',
    themeColorHex = '#881337',
  } = options;

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

  const primaryRgb = hexToRgb(themeColorHex);

  const checkPageOverflow = (neededSpaceMm: number) => {
    if (y + neededSpaceMm > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      drawSubsequentHeader();
    }
  };

  const drawSubsequentHeader = () => {
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CV-AUTOPILOT ENTERPRISE • ANÁLISE SWOT PESSOAL & PLANO ESTRATÉGICO', margin + 3, y + 5.5);
    doc.text(`${candidateName} • ${targetRole}`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
    y += 12;
  };

  // --- CABEÇALHO EXECUTIVO ---
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ANÁLISE SWOT PESSOAL & PLANO DE AÇÃO ESTRATÉGICO', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(254, 205, 211);
  doc.text(`Candidato: ${candidateName} | Cargo Alvo: ${targetRole}`, margin + 6, y + 16);
  doc.text(`Data de Emissão: ${new Date(swot.generatedAt).toLocaleDateString('pt-BR')} às ${new Date(swot.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, margin + 6, y + 21);

  y += 28;

  // --- RESUMO EXECUTIVO ---
  if (swot.executiveSummary) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    const summaryLines = doc.splitTextToSize(swot.executiveSummary, contentWidth - 10);
    const boxHeight = summaryLines.length * 4 + 8;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('DIAGNÓSTICO ESTRATÉGICO 360° DO CANDIDATO', margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, margin + 5, y + 11);

    y += boxHeight + 5;
  }

  // --- CARTÕES DE MÉTRICAS KPI ---
  checkPageOverflow(26);
  const cardW = (contentWidth - 9) / 4;
  const metrics = [
    { label: 'Saúde Geral', val: `${swot.metrics.overallHealthScore}/100`, sub: 'Score Integrado', color: [16, 185, 129] },
    { label: 'Competitividade', val: `${swot.metrics.competitivenessIndex}%`, sub: 'Maturidade de Mercado', color: [59, 130, 246] },
    { label: 'Conversão RH', val: `${swot.metrics.conversionRate}%`, sub: `${swot.metrics.totalApplicationsAnalyzed} candidaturas`, color: [136, 19, 55] },
    { label: 'Vulnerab. ATS', val: `${swot.metrics.atsVulnerabilityScore}%`, sub: `${swot.metrics.ghostingRate}% ghosting`, color: [239, 68, 68] },
  ];

  metrics.forEach((m, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, 18, 1.5, 1.5, 'FD');

    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.rect(cx, y, cardW, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cx + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, cx + 3, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(m.sub, cx + 3, y + 16);
  });

  y += 24;

  // --- MATRIZ SWOT (4 QUADRANTES) ---
  const sections = [
    {
      title: 'FORÇAS (STRENGTHS) • COMPETÊNCIAS & CONVERSÕES',
      items: swot.strengths,
      primaryColor: [5, 150, 105],      // Verde Esmeralda
      bgColor: [236, 253, 245],
      badgeText: 'Diferencial Competitivo'
    },
    {
      title: 'FRAQUEZAS (WEAKNESSES) • GARGALOS & DESCARTE ATS',
      items: swot.weaknesses,
      primaryColor: [225, 29, 72],       // Rosa/Vinho
      bgColor: [255, 241, 242],
      badgeText: 'Ponto de Correção Crítica'
    },
    {
      title: 'OPORTUNIDADES (OPPORTUNITIES) • MERCADO & ARBITRAGEM',
      items: swot.opportunities,
      primaryColor: [37, 99, 235],       // Azul
      bgColor: [239, 246, 255],
      badgeText: 'Alavanca de Expansão'
    },
    {
      title: 'AMEAÇAS (THREATS) • RISCOS EXTERNOS & SATURAÇÃO',
      items: swot.threats,
      primaryColor: [147, 51, 234],      // Roxo
      bgColor: [250, 245, 255],
      badgeText: 'Mitigação & Blindagem'
    },
  ];

  sections.forEach((sec) => {
    checkPageOverflow(30);

    // Header da Seção
    doc.setFillColor(sec.bgColor[0], sec.bgColor[1], sec.bgColor[2]);
    doc.setDrawColor(sec.primaryColor[0], sec.primaryColor[1], sec.primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(sec.primaryColor[0], sec.primaryColor[1], sec.primaryColor[2]);
    doc.text(sec.title, margin + 4, y + 5.2);

    y += 10.5;

    sec.items.forEach((item, itemIdx) => {
      checkPageOverflow(22);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);

      const titleText = `${itemIdx + 1}. ${item.title}`;
      const descLines = doc.splitTextToSize(item.description, contentWidth - 12);
      const actionLines = doc.splitTextToSize(`Ação Recomendada: ${item.strategicAction}`, contentWidth - 12);

      const itemHeight = descLines.length * 3.6 + actionLines.length * 3.6 + 14;

      doc.roundedRect(margin, y, contentWidth, itemHeight, 1.2, 1.2, 'FD');

      // Tarja lateral colorida
      doc.setFillColor(sec.primaryColor[0], sec.primaryColor[1], sec.primaryColor[2]);
      doc.rect(margin, y, 2.5, itemHeight, 'F');

      // Título do Item
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(titleText, margin + 5, y + 5);

      // Impacto e evidência
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Evidência: ${item.evidenceSource} | Impacto: ${item.impactLevel.toUpperCase()}`, margin + 5, y + 9);

      // Descrição
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(descLines, margin + 5, y + 13);

      // Ação Recomendada
      const actionY = y + 13 + descLines.length * 3.6 + 1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(sec.primaryColor[0], sec.primaryColor[1], sec.primaryColor[2]);
      doc.text(actionLines, margin + 5, actionY);

      y += itemHeight + 3.5;
    });

    y += 2;
  });

  // --- ESTRATÉGIAS CRUZADAS (MATRIZ SO, WO, ST, WT) ---
  if (swot.crossStrategies && swot.crossStrategies.length > 0) {
    checkPageOverflow(40);

    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MATRIZ CRUZADA ESTRATÉGICA (SO • WO • ST • WT)', margin + 4, y + 5.2);

    y += 11;

    swot.crossStrategies.forEach((strat) => {
      checkPageOverflow(30);

      const stratLines = doc.splitTextToSize(strat.description, contentWidth - 12);
      const stepsLines = strat.tacticalSteps.map(step => `• ${step}`);
      const stepsHeight = stepsLines.length * 3.5;
      const stratBoxHeight = stratLines.length * 3.5 + stepsHeight + 16;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, stratBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text(`[${strat.quadrant}] ${strat.title}`, margin + 5, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Prioridade: ${strat.priority} | ROI Esperado: ${strat.expectedROI}`, margin + 5, y + 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(stratLines, margin + 5, y + 14);

      let stepY = y + 14 + stratLines.length * 3.5 + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      stepsLines.forEach((s) => {
        doc.text(s, margin + 5, stepY);
        stepY += 3.5;
      });

      y += stratBoxHeight + 4;
    });
  }

  // --- PLANO DE AÇÃO PRIORIZADO (7, 30, 90 DIAS) ---
  if (swot.actionPlan && swot.actionPlan.length > 0) {
    checkPageOverflow(35);

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PLANO DE AÇÃO EXECUTIVO PRIORIZADO (CRONOGRAMA DE 90 DIAS)', margin + 4, y + 5.2);

    y += 11;

    swot.actionPlan.forEach((phase) => {
      checkPageOverflow(25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(phase.timeframe, margin + 2, y + 4);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(phase.focus, margin + 2, y + 8);

      y += 11;

      phase.tasks.forEach((task) => {
        checkPageOverflow(14);

        const taskLines = doc.splitTextToSize(task.text, contentWidth - 14);
        const taskH = taskLines.length * 3.6 + 5;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, taskH, 1, 1, 'FD');

        // Checkbox visual
        doc.setDrawColor(148, 163, 184);
        doc.rect(margin + 4, y + 3, 3, 3);
        if (task.completed) {
          doc.setFillColor(16, 185, 129);
          doc.rect(margin + 4.5, y + 3.5, 2, 2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(taskLines, margin + 10, y + 5.5);

        y += taskH + 2.5;
      });

      y += 3;
    });
  }

  // --- RECOMENDAÇÕES PARA VENCER O ATS ---
  if (swot.atsRecommendations && swot.atsRecommendations.length > 0) {
    checkPageOverflow(30);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    const atsBoxHeight = swot.atsRecommendations.length * 4.5 + 12;
    doc.roundedRect(margin, y, contentWidth, atsBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('RECOMENDAÇÕES CRÍTICAS PARA BLINDAGEM CONTRA FILTROS ATS', margin + 5, y + 6);

    let atsY = y + 11;
    swot.atsRecommendations.forEach((rec, rIdx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const recLines = doc.splitTextToSize(`${rIdx + 1}. ${rec}`, contentWidth - 12);
      doc.text(recLines, margin + 5, atsY);
      atsY += recLines.length * 4;
    });

    y += atsBoxHeight + 5;
  }

  // --- RODAPÉ EM TODAS AS PÁGINAS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CV-AutoPilot Enterprise • Inteligência Artificial em Carreira & Seleção Executiva', margin, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPages} • Documento Estritamente Pessoal & Confidencial`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
};

export const exportPersonalSWOTPdf = (options: PersonalSwotPdfOptions): void => {
  const doc = buildPersonalSWOTPdfDoc(options);
  const cleanName = (options.candidateName || 'Candidato').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Analise_SWOT_Carreira_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
