// services/monthlyPerformancePdfService.ts
// Gerador de PDF executivo para o Resumo Mensal de Desempenho de Candidaturas (Entrevistas vs Negativas)
import { jsPDF } from 'jspdf';
import { Application, ApplicationStatus } from '../types';
import { MonthlyCareerMetric } from '../components/CareerInsights';

export interface MonthlyPerformancePdfOptions {
  monthlyData: MonthlyCareerMetric[];
  kpiMetrics: {
    totalInterviews: number;
    totalNegatives: number;
    totalResponses: number;
    overallRatio: number;
    totalNetTraction: number;
    momInterviewsChange: number;
    momNegativesChange: number;
    bestMonth: MonthlyCareerMetric | null;
    ratioText: string;
  };
  diagnosis: {
    headline: string;
    badge: string;
    tone: string;
    analysis: string;
    recommendation: string;
  };
  timeframeMonths: number;
  isBenchmarkData: boolean;
  applications?: Application[];
  candidateName?: string;
  themeColorHex?: string;
}

/**
 * Constrói e retorna a instância de jsPDF formatada para o relatório executivo mensal.
 */
export const buildMonthlyPerformancePdfDoc = (options: MonthlyPerformancePdfOptions): jsPDF => {
  const {
    monthlyData,
    kpiMetrics,
    diagnosis,
    timeframeMonths,
    isBenchmarkData,
    applications = [],
    candidateName = 'Profissional Executivo',
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

  // Paleta de cores executiva
  const primaryRgb: [number, number, number] = [136, 19, 55]; // Vinho Tinto #881337
  const successRgb: [number, number, number] = [5, 150, 105]; // Esmeralda #059669
  const dangerRgb: [number, number, number] = [220, 38, 38];  // Vermelho #dc2626
  const darkRgb: [number, number, number] = [26, 20, 24];     // Grafite escuro
  const grayRgb: [number, number, number] = [100, 116, 139];  // Cinza médio #64748b
  const lightBgRgb: [number, number, number] = [248, 250, 252]; // #f8fafc

  const checkPageBreak = (neededHeight: number): void => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
    }
  };

  const drawHeaderWatermark = (): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grayRgb);
    doc.text('CV-AutoPilot Enterprise • Relatório de Desempenho Mensal de Candidaturas', margin, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  };

  // --------------------------------------------------------------------------
  // 1. CABEÇALHO DO DOCUMENTO
  // --------------------------------------------------------------------------
  // Barra superior decorativa
  doc.setFillColor(...primaryRgb);
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Linha superior com Marca e Data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryRgb);
  doc.text('CV-AUTOPILOT ENTERPRISE', margin, y);

  const nowFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayRgb);
  doc.text(`Emissão: ${nowFormatted}`, margin + contentWidth, y, { align: 'right' });
  y += 7;

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...darkRgb);
  doc.text('Relatório Executivo de Desempenho de Candidaturas', margin, y);
  y += 6;

  // Subtítulo e Período
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...grayRgb);
  const periodLabel = `Período em Análise: Últimos ${timeframeMonths} meses (${monthlyData[0]?.monthLabel || ''} a ${monthlyData[monthlyData.length - 1]?.monthLabel || ''})`;
  doc.text(periodLabel, margin, y);

  const dataSourceTag = isBenchmarkData ? 'Dados de Referência (Benchmark Mercado)' : 'Dados Reais do Usuário';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryRgb);
  doc.text(`[${dataSourceTag}]`, margin + contentWidth, y, { align: 'right' });
  y += 9;

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // --------------------------------------------------------------------------
  // 2. CARDS DE KPIS CONSOLIDADOS (4 CARDS)
  // --------------------------------------------------------------------------
  checkPageBreak(32);
  const cardGap = 4;
  const numCards = 4;
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards;
  const cardHeight = 22;

  const kpis = [
    {
      title: 'ENTREVISTAS',
      val: `${kpiMetrics.totalInterviews}`,
      subtitle: `${kpiMetrics.momInterviewsChange >= 0 ? '+' : ''}${kpiMetrics.momInterviewsChange} vs mês ant.`,
      color: successRgb,
    },
    {
      title: 'NEGATIVAS',
      val: `${kpiMetrics.totalNegatives}`,
      subtitle: `${kpiMetrics.momNegativesChange >= 0 ? '+' : ''}${kpiMetrics.momNegativesChange} vs mês ant.`,
      color: dangerRgb,
    },
    {
      title: 'SALDO LÍQUIDO',
      val: `${kpiMetrics.totalNetTraction > 0 ? '+' : ''}${kpiMetrics.totalNetTraction}`,
      subtitle: 'Entrevistas - Negativas',
      color: kpiMetrics.totalNetTraction >= 0 ? successRgb : dangerRgb,
    },
    {
      title: 'TAXA FAVORÁVEL',
      val: `${kpiMetrics.overallRatio}%`,
      subtitle: `Proporção ${kpiMetrics.ratioText}`,
      color: primaryRgb,
    },
  ];

  kpis.forEach((card, idx) => {
    const cx = margin + idx * (cardWidth + cardGap);
    // Background do card
    doc.setFillColor(...lightBgRgb);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, 'FD');

    // Borda superior colorida do card
    doc.setFillColor(...card.color);
    doc.rect(cx, y, cardWidth, 1.8, 'F');

    // Título do KPI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRgb);
    doc.text(card.title, cx + cardWidth / 2, y + 6, { align: 'center' });

    // Valor Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...card.color);
    doc.text(card.val, cx + cardWidth / 2, y + 14, { align: 'center' });

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...grayRgb);
    doc.text(card.subtitle, cx + cardWidth / 2, y + 19, { align: 'center' });
  });

  y += cardHeight + 8;

  // Destaque adicional se houver melhor mês
  if (kpiMetrics.bestMonth) {
    checkPageBreak(12);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkRgb);
    doc.text('Destaque de Performance:', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayRgb);
    const bestMonthText = `Mês mais produtivo: ${kpiMetrics.bestMonth.fullMonthName} com ${kpiMetrics.bestMonth.interviewsCount} entrevistas agendadas e saldo de ${kpiMetrics.bestMonth.netTraction > 0 ? '+' : ''}${kpiMetrics.bestMonth.netTraction}.`;
    doc.text(bestMonthText, margin + 45, y + 6);
    y += 14;
  }

  // --------------------------------------------------------------------------
  // 3. DIAGNÓSTICO ESTRATÉGICO E RECOMENDAÇÕES DA IA
  // --------------------------------------------------------------------------
  checkPageBreak(38);
  doc.setFillColor(...lightBgRgb);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  // Faixa lateral de destaque
  doc.setFillColor(...primaryRgb);
  doc.rect(margin, y, 2.5, 32, 'F');

  // Cabeçalho da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryRgb);
  doc.text(`DIAGNÓSTICO ESTRATÉGICO: ${diagnosis.headline.toUpperCase()}`, margin + 6, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkRgb);
  doc.text(`Status do Funil: [${diagnosis.badge}]`, margin + contentWidth - 4, y + 6, { align: 'right' });

  // Texto da análise
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkRgb);
  const analysisLines = doc.splitTextToSize(diagnosis.analysis, contentWidth - 12);
  doc.text(analysisLines, margin + 6, y + 12);

  // Linha sutil separadora interna
  const innerSepY = y + 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 6, innerSepY, margin + contentWidth - 6, innerSepY);

  // Recomendação Executiva
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryRgb);
  doc.text('Recomendação Executiva:', margin + 6, innerSepY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayRgb);
  const recLines = doc.splitTextToSize(diagnosis.recommendation, contentWidth - 48);
  doc.text(recLines, margin + 44, innerSepY + 4.5);

  y += 37;

  // --------------------------------------------------------------------------
  // 4. TABELA MENSAL COMPARATIVA: ENTREVISTAS VS NEGATIVAS
  // --------------------------------------------------------------------------
  checkPageBreak(50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkRgb);
  doc.text('Evolução Mês a Mês: Entrevistas Agendadas versus Negativas', margin, y);
  y += 5;

  // Cabeçalho da Tabela
  const tableHeadY = y;
  const colWidths = {
    month: 32,
    interviews: 24,
    negatives: 24,
    net: 24,
    ratio: 24,
    companies: contentWidth - (32 + 24 * 4),
  };

  doc.setFillColor(...primaryRgb);
  doc.rect(margin, tableHeadY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = margin + 3;
  doc.text('Mês', currentX, tableHeadY + 4.8);
  currentX += colWidths.month;

  doc.text('Entrevistas', currentX, tableHeadY + 4.8);
  currentX += colWidths.interviews;

  doc.text('Negativas', currentX, tableHeadY + 4.8);
  currentX += colWidths.negatives;

  doc.text('Saldo Líq.', currentX, tableHeadY + 4.8);
  currentX += colWidths.net;

  doc.text('Taxa Fav.', currentX, tableHeadY + 4.8);
  currentX += colWidths.ratio;

  doc.text('Destaques de Empresas / Processos', currentX, tableHeadY + 4.8);

  y += 7;

  // Linhas dos Meses
  monthlyData.forEach((item, rIdx) => {
    checkPageBreak(8);

    const isEven = rIdx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, 6.8, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6.8, margin + contentWidth, y + 6.8);

    let rowX = margin + 3;

    // Mês
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkRgb);
    doc.text(item.fullMonthName, rowX, y + 4.5);
    rowX += colWidths.month;

    // Entrevistas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...successRgb);
    doc.text(String(item.interviewsCount), rowX + 4, y + 4.5);
    rowX += colWidths.interviews;

    // Negativas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...dangerRgb);
    doc.text(String(item.negativesCount), rowX + 4, y + 4.5);
    rowX += colWidths.negatives;

    // Saldo Líquido
    const netSign = item.netTraction > 0 ? '+' : '';
    const netColor = item.netTraction >= 0 ? successRgb : dangerRgb;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...netColor);
    doc.text(`${netSign}${item.netTraction}`, rowX + 4, y + 4.5);
    rowX += colWidths.net;

    // Taxa Favorável (%)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkRgb);
    doc.text(`${item.interviewRatio}%`, rowX + 4, y + 4.5);
    rowX += colWidths.ratio;

    // Empresas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRgb);
    const companies = item.interviewCompanies && item.interviewCompanies.length > 0
      ? item.interviewCompanies.slice(0, 4).join(', ') + (item.interviewCompanies.length > 4 ? '...' : '')
      : '-';
    doc.text(companies, rowX, y + 4.5);

    y += 6.8;
  });

  // Linha de Totais / Média Consolidada
  checkPageBreak(8);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  doc.line(margin, y + 7, margin + contentWidth, y + 7);

  let totalX = margin + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkRgb);
  doc.text('TOTAL CONSOLIDADO', totalX, y + 4.8);
  totalX += colWidths.month;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...successRgb);
  doc.text(String(kpiMetrics.totalInterviews), totalX + 4, y + 4.8);
  totalX += colWidths.interviews;

  doc.setTextColor(...dangerRgb);
  doc.text(String(kpiMetrics.totalNegatives), totalX + 4, y + 4.8);
  totalX += colWidths.negatives;

  const totalNetSign = kpiMetrics.totalNetTraction > 0 ? '+' : '';
  const totalNetColor = kpiMetrics.totalNetTraction >= 0 ? successRgb : dangerRgb;
  doc.setTextColor(...totalNetColor);
  doc.text(`${totalNetSign}${kpiMetrics.totalNetTraction}`, totalX + 4, y + 4.8);
  totalX += colWidths.net;

  doc.setTextColor(...darkRgb);
  doc.text(`${kpiMetrics.overallRatio}%`, totalX + 4, y + 4.8);
  totalX += colWidths.ratio;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayRgb);
  doc.text(`Média mensal de ${(kpiMetrics.totalInterviews / Math.max(1, monthlyData.length)).toFixed(1)} entrevistas`, totalX, y + 4.8);

  y += 12;

  // --------------------------------------------------------------------------
  // 5. DISTRIBUIÇÃO ATUAL DO PIPELINE (STATUS GERAL)
  // --------------------------------------------------------------------------
  if (applications && applications.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkRgb);
    doc.text('Status das Candidaturas Ativas no Pipeline', margin, y);
    y += 5;

    const statusCounts: Record<string, number> = {};
    applications.forEach(app => {
      const s = app.status || 'Outro';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const statusItems = [
      { label: 'Candidatou-se', count: statusCounts[ApplicationStatus.Aplicou] || 0, color: grayRgb },
      { label: 'Visualizado', count: statusCounts[ApplicationStatus.Visualizado] || 0, color: [37, 99, 235] as [number, number, number] },
      { label: 'Em Entrevista', count: statusCounts[ApplicationStatus.Entrevistando] || 0, color: successRgb },
      { label: 'Oferta Recebida', count: statusCounts[ApplicationStatus.Oferta] || 0, color: [217, 119, 6] as [number, number, number] },
      { label: 'Rejeitado / Negativa', count: statusCounts[ApplicationStatus.Rejeitado] || 0, color: dangerRgb },
      { label: 'Sem Resposta (Ghosting)', count: statusCounts[ApplicationStatus.Ignorado] || 0, color: [148, 163, 184] as [number, number, number] },
    ];

    const boxWidth = (contentWidth - 5 * 3) / 6;
    statusItems.forEach((st, idx) => {
      const bx = margin + idx * (boxWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bx, y, boxWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...st.color);
      doc.text(String(st.count), bx + boxWidth / 2, y + 6.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...darkRgb);
      const splitLabel = doc.splitTextToSize(st.label, boxWidth - 2);
      doc.text(splitLabel, bx + boxWidth / 2, y + 10.5, { align: 'center' });
    });

    y += 18;
  }

  // --------------------------------------------------------------------------
  // 6. DICAS DE CONVERSÃO EXECUTIVA
  // --------------------------------------------------------------------------
  checkPageBreak(25);
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryRgb);
  doc.text('PLANO DE AÇÃO PARA OTIMIZAR CONVERSÃO (PRÓXIMO CICLO):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkRgb);
  const actionTips = [
    '• Auditoria ATS: Certifique-se de compatibilizar ao menos 80% das palavras-chave técnicas do Job Description antes de se aplicar.',
    '• Follow-ups estruturados: Acompanhe candidaturas sem resposta após 7 a 10 dias úteis diretamente com Tech Recruiters no LinkedIn.',
    '• Preparação Comportamental: Pratique no Simulador de Voz com a Dra. Valéria Silveira no método STAR para maximizar taxa de aprovação nas entrevistas.',
  ];
  doc.text(actionTips.join('\n'), margin + 4, y + 8.5);

  y += 24;

  // --------------------------------------------------------------------------
  // 7. RODAPÉ DE TODAS AS PÁGINAS
  // --------------------------------------------------------------------------
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha divisória de rodapé
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, margin + contentWidth, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRgb);
    doc.text(
      'Documento confidencial gerado pelo CV-AutoPilot Enterprise • Inteligência Executiva de Carreira',
      margin,
      pageHeight - 6.5
    );

    doc.text(
      `Página ${i} de ${totalPages}`,
      margin + contentWidth,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  return doc;
};

/**
 * Faz download do arquivo PDF com nome estruturado.
 */
export const downloadMonthlyPerformancePdf = (
  options: MonthlyPerformancePdfOptions,
  fileName?: string
): void => {
  const doc = buildMonthlyPerformancePdfDoc(options);
  const finalName = fileName || `relatorio-desempenho-mensal-candidaturas-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(finalName);
};

/**
 * Abre o diálogo de impressão do navegador com o PDF gerado.
 */
export const printMonthlyPerformancePdf = (
  options: MonthlyPerformancePdfOptions
): void => {
  const doc = buildMonthlyPerformancePdfDoc(options);
  const blobUrl = doc.output('bloburl');
  
  // Cria iframe invisível seguro para disparar print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl as unknown as string;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Fallback print:', e);
      window.open(blobUrl as unknown as string, '_blank');
    } finally {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl as unknown as string);
        } catch {}
      }, 60000);
    }
  };
};
