// careerDossierPdfService.ts - Generates consolidated Career Executive Dossier in PDF
import { jsPDF } from 'jspdf';
import { CV, Application, ApplicationStatus } from '../types';

export interface CareerDossierOptions {
  cv?: CV | null;
  coverLetterText?: string;
  coverLetterTitle?: string;
  targetCompany?: string;
  targetRole?: string;
  applications?: Application[];
  theme?: 'bordeaux' | 'navy' | 'graphite' | 'emerald';
  candidateName?: string;
  candidateTitle?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  includeKpis?: boolean;
  includeApplicationsTable?: boolean;
  includeCoverLetter?: boolean;
  includeCv?: boolean;
  customNotes?: string;
}

interface ThemePalette {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  light: [number, number, number];
  dark: [number, number, number];
  hex: string;
}

const THEMES: Record<string, ThemePalette> = {
  bordeaux: {
    primary: [136, 19, 55],       // #881337
    secondary: [190, 18, 60],     // #be123c
    accent: [244, 63, 94],       // #f43f5e
    light: [255, 241, 242],      // #fff1f2
    dark: [76, 5, 25],           // #4c0519
    hex: '#881337',
  },
  navy: {
    primary: [30, 58, 138],       // #1e3a8a
    secondary: [37, 99, 235],     // #2563eb
    accent: [96, 165, 250],      // #60a5fa
    light: [239, 246, 255],      // #eff6ff
    dark: [15, 23, 42],          // #0f172a
    hex: '#1e3a8a',
  },
  graphite: {
    primary: [30, 41, 59],        // #1e293b
    secondary: [71, 85, 105],     // #475569
    accent: [148, 163, 184],     // #94a3b8
    light: [248, 250, 252],      // #f8fafc
    dark: [15, 23, 42],          // #0f172a
    hex: '#1e293b',
  },
  emerald: {
    primary: [6, 95, 70],         // #065f46
    secondary: [5, 150, 105],     // #059669
    accent: [52, 211, 153],      // #34d399
    light: [236, 253, 245],      // #ecfdf5
    dark: [4, 47, 46],           // #042f2e
    hex: '#065f46',
  },
};

/**
 * Builds and returns a jsPDF document for the Executive Career Dossier.
 */
export const buildCareerDossierDoc = (options: CareerDossierOptions): jsPDF => {
  const {
    cv,
    coverLetterText = '',
    coverLetterTitle = 'Carta de Apresentação Executiva',
    targetCompany = '',
    targetRole = '',
    applications = [],
    theme = 'bordeaux',
    candidateName: explicitName,
    candidateTitle: explicitTitle,
    candidateEmail: explicitEmail,
    candidatePhone: explicitPhone,
    candidateLocation: explicitLocation,
    includeKpis = true,
    includeApplicationsTable = true,
    includeCoverLetter = true,
    includeCv = true,
    customNotes = '',
  } = options;

  const palette = THEMES[theme] || THEMES.bordeaux;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Infer contact details from CV content if not explicitly provided
  let candidateName = explicitName || (cv?.name?.replace(/^(Currículo\s*(?:de|-)?\s*)/i, '').trim()) || 'Profissional Executivo';
  let candidateTitle = explicitTitle || cv?.name || 'Liderança & Especialista Técnico';
  let candidateEmail = explicitEmail || '';
  let candidatePhone = explicitPhone || '';
  let candidateLocation = explicitLocation || '';

  if (cv?.content) {
    const emailMatch = cv.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !candidateEmail) candidateEmail = emailMatch[0];

    const phoneMatch = cv.content.match(/(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
    if (phoneMatch && !candidatePhone) candidatePhone = phoneMatch[0];

    const locMatch = cv.content.match(/(?:São Paulo|Rio de Janeiro|Belo Horizonte|Curitiba|Porto Alegre|Brasília|Campinas|Florianópolis|Remoto|Híbrido)[^|\n,]*/i);
    if (locMatch && !candidateLocation) candidateLocation = locMatch[0].trim();
  }

  // Calculate Application KPIs
  const totalApps = applications.length;
  const interviewingCount = applications.filter(a => a.status === ApplicationStatus.Entrevistando).length;
  const offerCount = applications.filter(a => a.status === ApplicationStatus.Oferta).length;
  const rejectedCount = applications.filter(a => a.status === ApplicationStatus.Rejeitado).length;
  const viewedCount = applications.filter(a => a.status === ApplicationStatus.Visualizado).length;
  const responseRate = totalApps > 0 
    ? Math.round(((interviewingCount + offerCount + viewedCount) / totalApps) * 100) 
    : 0;

  // Page break checker with consistent header and footer
  const checkPageBreak = (neededHeight: number, newSectionTitle?: string) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawPageHeader(newSectionTitle);
    }
  };

  const drawPageHeader = (subtitleText?: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.text('CV-AUTOPILOT ENTERPRISE • DOSSIÊ EXECUTIVO DE CARREIRA', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      subtitleText || `${candidateName.toUpperCase()} • DOCUMENTO CONSOLIDADO`,
      pageWidth - margin,
      10,
      { align: 'right' }
    );

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12.5, pageWidth - margin, 12.5);
    y = 18;
  };

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE DASHBOARD
  // ==========================================

  // Top Accent Bar
  doc.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  doc.rect(margin, y, contentWidth, 4, 'F');
  y += 6;

  // Hero Cover Banner
  doc.setFillColor(palette.dark[0], palette.dark[1], palette.dark[2]);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');

  // Badge
  doc.setFillColor(palette.secondary[0], palette.secondary[1], palette.secondary[2]);
  doc.roundedRect(margin + 6, y + 5, 68, 5.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONSOLIDAÇÃO ESTRATÉGICA DE CARREIRA', margin + 8, y + 8.8);

  // Main Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DOSSIÊ EXECUTIVO DE CARREIRA', margin + 6, y + 19);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Currículo Otimizado • Carta de Apresentação Estratégica • Pipeline de Candidaturas',
    margin + 6,
    y + 26
  );

  // Date and Meta
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const nowStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Gerado em: ${nowStr}`, pageWidth - margin - 6, y + 33, { align: 'right' });
  y += 44;

  // Candidate Profile Summary Box
  doc.setFillColor(palette.light[0], palette.light[1], palette.light[2]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  doc.text(candidateName, margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(candidateTitle, margin + 6, y + 13.5);

  // Contacts Row
  const contactParts: string[] = [];
  if (candidateEmail) contactParts.push(`E-mail: ${candidateEmail}`);
  if (candidatePhone) contactParts.push(`Tel: ${candidatePhone}`);
  if (candidateLocation) contactParts.push(`Local: ${candidateLocation}`);
  if (cv?.yearsOfExperience) contactParts.push(`Experiência: ${cv.yearsOfExperience} anos`);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(contactParts.join('  •  ') || 'Contato disponível para posições estratégicas', margin + 6, y + 20);

  if (targetCompany || targetRole) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(palette.secondary[0], palette.secondary[1], palette.secondary[2]);
    const targetText = [
      targetRole ? `Posição Alvo: ${targetRole}` : '',
      targetCompany ? `Empresa: ${targetCompany}` : '',
    ].filter(Boolean).join('  |  ');
    doc.text(targetText, margin + 6, y + 25);
  }
  y += 33;

  // Executive KPI Cards (Pipeline & Tração)
  if (includeKpis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.text('PANORAMA ESTRATÉGICO DE MERCADO & PIPELINE', margin, y);
    y += 4;

    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 18;

    const kpiData = [
      { label: 'CANDIDATURAS', value: totalApps.toString(), color: palette.primary, sub: 'Posições no radar' },
      { label: 'EM ENTREVISTA', value: interviewingCount.toString(), color: [37, 99, 235], sub: 'Fase ativa de avaliação' },
      { label: 'OFERTAS / PROPOSTAS', value: offerCount.toString(), color: [5, 150, 105], sub: 'Propostas recebidas' },
      { label: 'TAXA DE RESPOSTA', value: `${responseRate}%`, color: [124, 58, 237], sub: 'Tração com recrutadores' },
    ];

    kpiData.forEach((kpi, i) => {
      const cardX = margin + i * (cardWidth + 3);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top colored bar
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(cardX, y, cardWidth, 1.5, 'F');

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, cardX + cardWidth / 2, y + 8, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(kpi.label, cardX + cardWidth / 2, y + 12, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.sub, cardX + cardWidth / 2, y + 15.5, { align: 'center' });
    });

    y += cardHeight + 6;
  }

  // Dossier Index / Table of Contents Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  doc.text('SUMÁRIO EXECUTIVO DO DOSSIÊ', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const indexItems = [
    { title: '• PARTE I: CURRÍCULO EXECUTIVO & COMPETÊNCIAS', desc: 'Trajetória, conquistas com métricas quantificáveis (Fórmula XYZ) e hard/soft skills.' },
    { title: '• PARTE II: CARTA DE APRESENTAÇÃO ESTRATÉGICA', desc: 'Narrativa persuasiva de proposta de valor, fit cultural e alinhamento com a vaga.' },
    { title: '• PARTE III: PIPELINE CONSOLIDADO DE CANDIDATURAS', desc: 'Mapeamento das oportunidades em andamento, empresas, cargos e estágios no funil.' },
  ];

  let itemY = y + 12;
  indexItems.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.title, margin + 6, itemY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`- ${item.desc}`, margin + 78, itemY);
    doc.setTextColor(51, 65, 85);
    itemY += 6.5;
  });

  y += 40;

  // Custom Notes or Executive Pitch if provided
  if (customNotes && customNotes.trim().length > 0) {
    doc.setFillColor(palette.light[0], palette.light[1], palette.light[2]);
    doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.text('NOTA DO CANDIDATO / OBJETIVO PROFISSIONAL:', margin + 5, y + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(customNotes.trim(), contentWidth - 10);
    doc.text(splitNotes.slice(0, 3), margin + 5, y + 10.5);
    y += 26;
  }

  // ==========================================
  // PAGE 2: PARTE I - CURRÍCULO EXECUTIVO & SKILLS
  // ==========================================
  if (includeCv && cv) {
    doc.addPage();
    y = margin;
    drawPageHeader('PARTE I • CURRÍCULO EXECUTIVO ESTRUTURADO');

    // Section Title Banner
    doc.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PARTE I — PERFIL PROFISSIONAL & EXPERIÊNCIA COMPROVADA', margin + 5, y + 6.8);
    y += 14;

    // Hard Skills & Soft Skills Section
    const techSkills = cv.technicalSkills || [];
    const softSkills = cv.softSkills || [];
    const allSkills = cv.skills || [];

    if (techSkills.length > 0 || softSkills.length > 0 || allSkills.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);

      const skillsBoxHeight = (techSkills.length > 0 && softSkills.length > 0) ? 28 : 20;
      doc.roundedRect(margin, y, contentWidth, skillsBoxHeight, 1.5, 1.5, 'FD');

      let skillY = y + 5;
      if (techSkills.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 64, 175); // Blue
        doc.text('HARD SKILLS (COMPETÊNCIAS TÉCNICAS):', margin + 5, skillY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const techStr = doc.splitTextToSize(techSkills.slice(0, 18).join('  •  '), contentWidth - 10);
        doc.text(techStr.slice(0, 2), margin + 5, skillY + 4.5);
        skillY += 12;
      }

      if (softSkills.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(4, 120, 87); // Emerald
        doc.text('SOFT SKILLS (HABILIDADES COMPORTAMENTAIS & LIDERANÇA):', margin + 5, skillY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const softStr = doc.splitTextToSize(softSkills.slice(0, 14).join('  •  '), contentWidth - 10);
        doc.text(softStr.slice(0, 2), margin + 5, skillY + 4.5);
      } else if (techSkills.length === 0 && allSkills.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        doc.text('COMPETÊNCIAS PRINCIPAIS:', margin + 5, skillY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const allStr = doc.splitTextToSize(allSkills.slice(0, 20).join('  •  '), contentWidth - 10);
        doc.text(allStr.slice(0, 2), margin + 5, skillY + 4.5);
      }

      y += skillsBoxHeight + 6;
    }

    // Parse and render CV body content cleanly
    const cvLines = cv.content.split('\n');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    for (let i = 0; i < cvLines.length; i++) {
      const line = cvLines[i].trim();
      if (!line) {
        y += 2.5;
        continue;
      }

      // Detect Section Header (Uppercase or starting with words like RESUMO, EXPERIÊNCIA, FORMAÇÃO)
      const isHeader = (
        (line.toUpperCase() === line && line.length > 3 && line.length < 45 && !line.includes('@')) ||
        line.startsWith('##') ||
        line.startsWith('#') ||
        /^(RESUMO|EXPERIÊNCIA|FORMAÇÃO|HISTÓRICO|EDUCAÇÃO|CERTIFICAÇÕES|COMPETÊNCIAS|PROJETOS)/i.test(line)
      );

      if (isHeader) {
        checkPageBreak(16, 'PARTE I • CURRÍCULO EXECUTIVO ESTRUTURADO (CONT.)');
        y += 3;
        const cleanHeader = line.replace(/^[#*-]+\s*/, '').replace(/[*_]/g, '').trim();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        doc.text(cleanHeader, margin, y);

        doc.setDrawColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 1.5, margin + 45, y + 1.5);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        continue;
      }

      // Check if Bullet point or subhead
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
      const isSubRole = (line.includes('|') && (line.includes('20') || line.includes('Atual')));

      if (isSubRole) {
        checkPageBreak(8, 'PARTE I • CURRÍCULO EXECUTIVO ESTRUTURADO (CONT.)');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(line.replace(/^[•*-]\s*/, ''), margin, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        continue;
      }

      const bulletIndent = isBullet ? 4 : 0;
      const textToPrint = isBullet ? `• ${line.replace(/^[•*-]\s*/, '')}` : line;
      const wrapped = doc.splitTextToSize(textToPrint, contentWidth - bulletIndent);

      checkPageBreak(wrapped.length * 3.8 + 2, 'PARTE I • CURRÍCULO EXECUTIVO ESTRUTURADO (CONT.)');
      doc.text(wrapped, margin + bulletIndent, y);
      y += wrapped.length * 3.8 + 1.2;
    }
  }

  // ==========================================
  // PAGE 3: PARTE II - CARTA DE APRESENTAÇÃO
  // ==========================================
  if (includeCoverLetter && coverLetterText && coverLetterText.trim().length > 0) {
    doc.addPage();
    y = margin;
    drawPageHeader('PARTE II • CARTA DE APRESENTAÇÃO ESTRATÉGICA');

    // Section Title Banner
    doc.setFillColor(palette.secondary[0], palette.secondary[1], palette.secondary[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PARTE II — CARTA DE APRESENTAÇÃO EXECUTIVA', margin + 5, y + 6.8);
    y += 14;

    // Cover Letter Header Box
    doc.setFillColor(palette.light[0], palette.light[1], palette.light[2]);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.text(`DOCUMENTO: ${coverLetterTitle.toUpperCase()}`, margin + 5, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const letterMeta = [
      targetRole ? `Vaga Alvo: ${targetRole}` : '',
      targetCompany ? `Empresa Destinatária: ${targetCompany}` : '',
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    ].filter(Boolean).join('   •   ');
    doc.text(letterMeta, margin + 5, y + 11.5);
    y += 24;

    // Body of the Cover Letter
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const paragraphs = coverLetterText.split('\n\n').filter(p => p.trim().length > 0);
    for (const para of paragraphs) {
      const wrapped = doc.splitTextToSize(para.trim(), contentWidth);
      checkPageBreak(wrapped.length * 4.4 + 4, 'PARTE II • CARTA DE APRESENTAÇÃO ESTRATÉGICA (CONT.)');
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4.4 + 3.5;
    }

    // Signature Area
    checkPageBreak(24, 'PARTE II • CARTA DE APRESENTAÇÃO ESTRATÉGICA (CONT.)');
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.text('Atenciosamente,', margin, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(candidateName, margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${candidateTitle}  •  ${candidateEmail || ''}  ${candidatePhone ? `• ${candidatePhone}` : ''}`, margin, y);
    y += 10;
  }

  // ==========================================
  // PAGE 4: PARTE III - RESUMO DAS CANDIDATURAS
  // ==========================================
  if (includeApplicationsTable && applications.length > 0) {
    doc.addPage();
    y = margin;
    drawPageHeader('PARTE III • RESUMO CONSOLIDADO DE CANDIDATURAS');

    // Section Title Banner
    doc.setFillColor(palette.dark[0], palette.dark[1], palette.dark[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PARTE III — PIPELINE E HISTÓRICO DE CANDIDATURAS ATIVAS', margin + 5, y + 6.8);
    y += 14;

    // Applications Pipeline Summary text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Registro auditado de ${applications.length} candidatura(s) ativas no mercado, indicando estágio no processo seletivo, data de aplicação e observações estratégicas.`,
      margin,
      y
    );
    y += 6;

    // Table Header
    doc.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    const colX = {
      company: margin + 3,
      role: margin + 46,
      date: margin + 104,
      status: margin + 128,
      notes: margin + 158,
    };

    doc.text('EMPRESA', colX.company, y + 4.8);
    doc.text('CARGO / POSIÇÃO', colX.role, y + 4.8);
    doc.text('DATA', colX.date, y + 4.8);
    doc.text('STATUS', colX.status, y + 4.8);
    doc.text('NOTAS / OBSERVAÇÕES', colX.notes, y + 4.8);
    y += 7;

    // Table Rows
    applications.forEach((app, idx) => {
      checkPageBreak(11, 'PARTE III • RESUMO CONSOLIDADO DE CANDIDATURAS (CONT.)');

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 9.5, 'F');

      // Thin bottom border
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 9.5, pageWidth - margin, y + 9.5);

      // Company
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const companyTrim = app.companyName.length > 22 ? `${app.companyName.slice(0, 20)}...` : app.companyName;
      doc.text(companyTrim, colX.company, y + 6);

      // Role
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const roleTrim = app.jobTitle.length > 28 ? `${app.jobTitle.slice(0, 26)}...` : app.jobTitle;
      doc.text(roleTrim, colX.role, y + 6);

      // Date
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const formattedDate = app.dateApplied 
        ? new Date(app.dateApplied).toLocaleDateString('pt-BR') 
        : '-';
      doc.text(formattedDate, colX.date, y + 6);

      // Status Badge
      let statusColor: [number, number, number] = [100, 116, 139];
      if (app.status === ApplicationStatus.Oferta) statusColor = [5, 150, 105]; // Green
      else if (app.status === ApplicationStatus.Entrevistando) statusColor = [37, 99, 235]; // Blue
      else if (app.status === ApplicationStatus.Visualizado) statusColor = [217, 119, 6]; // Amber
      else if (app.status === ApplicationStatus.Rejeitado) statusColor = [225, 29, 72]; // Rose

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      const statusText = app.status ? app.status.slice(0, 16) : 'Ativa';
      doc.text(statusText, colX.status, y + 6);

      // Notes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const notesTrim = app.notes 
        ? (app.notes.length > 24 ? `${app.notes.slice(0, 22)}...` : app.notes) 
        : '-';
      doc.text(notesTrim, colX.notes, y + 6);

      y += 9.5;
    });

    y += 6;
  }

  // Final Footers & Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.text(
      `CV-AutoPilot Enterprise  •  Dossiê Executivo de Carreira  •  ${candidateName}`,
      margin,
      pageHeight - 6.5
    );
    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  return doc;
};

/**
 * Direct download helper for the Career Executive Dossier PDF.
 */
export const downloadCareerDossierPdf = (options: CareerDossierOptions): void => {
  const doc = buildCareerDossierDoc(options);
  const safeName = (options.candidateName || options.cv?.name || 'Candidato')
    .replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_')
    .slice(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Dossie_Executivo_Carreira_${safeName}_${dateStr}.pdf`);
};

/**
 * Returns a Blob of the Career Executive Dossier PDF (for preview in iframe or blob URL).
 */
export const generateCareerDossierPdfBlob = (options: CareerDossierOptions): Blob => {
  const doc = buildCareerDossierDoc(options);
  return doc.output('blob');
};
