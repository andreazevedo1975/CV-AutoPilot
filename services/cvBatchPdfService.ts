// services/cvBatchPdfService.ts - Gerador de Dossiê Executivo de Múltiplos Currículos em Arquivo PDF Único
import { jsPDF } from 'jspdf';
import { CV } from '../types';
import { 
  parseCvToStructured, 
  StructuredCv, 
  PdfThemeId 
} from './cvPdfExportService';

export interface ExecutiveBatchPdfOptions {
  theme?: PdfThemeId;
  dossierTitle?: string;
  dossierSubtitle?: string;
  candidateName?: string;
  includeCoverPage?: boolean;
  includeTableOfContents?: boolean;
  includeAtsAudit?: boolean;
  includePortfolioLinks?: boolean;
  spacing?: 'compact' | 'normal' | 'spacious';
  customNotes?: string;
}

interface ThemeConfig {
  primary: [number, number, number];
  primaryDark: [number, number, number];
  accentLight: [number, number, number];
  borderLight: [number, number, number];
  textDark: [number, number, number];
  textMuted: [number, number, number];
  name: string;
}

const THEMES: Record<PdfThemeId, ThemeConfig> = {
  bordeaux: {
    primary: [136, 19, 55],       // #881337 CV-AutoPilot Enterprise Bordeaux
    primaryDark: [88, 12, 35],     // #580c23
    accentLight: [255, 241, 242],  // #fff1f2
    borderLight: [254, 205, 211],  // #fecdd3
    textDark: [30, 41, 59],        // #1e293b
    textMuted: [100, 116, 139],    // #64748b
    name: 'Executivo Bordeaux (Assinatura CV-AutoPilot)'
  },
  navy: {
    primary: [30, 58, 138],       // #1e3a8a Corporate Navy
    primaryDark: [15, 23, 42],     // #0f172a
    accentLight: [239, 246, 255],  // #eff6ff
    borderLight: [191, 219, 254],  // #bfdbfe
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    name: 'Corporate Navy'
  },
  slate: {
    primary: [15, 23, 42],        // #0f172a Midnight Slate
    primaryDark: [2, 6, 23],       // #020617
    accentLight: [248, 250, 252],  // #f8fafc
    borderLight: [226, 232, 240],  // #e2e8f0
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    name: 'Midnight Minimalist'
  },
  emerald: {
    primary: [6, 95, 70],         // #065f46 Leadership Emerald
    primaryDark: [2, 44, 34],      // #022c22
    accentLight: [236, 253, 245],  // #ecfdf5
    borderLight: [167, 243, 208],  // #a7f3d0
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    name: 'Leadership Emerald'
  }
};

/**
 * Engine responsável por consolidar múltiplos currículos em um único arquivo PDF corporativo.
 */
export class ExecutiveBatchCvPdfGenerator {
  private doc: jsPDF;
  private theme: ThemeConfig;
  private options: Required<ExecutiveBatchPdfOptions>;
  private margin = 14;
  private pageWidth = 210;
  private pageHeight = 297;
  private contentWidth: number;
  private currentY = 14;
  private cvStartPages: Map<string, number> = new Map();

  constructor(options: ExecutiveBatchPdfOptions = {}) {
    this.options = {
      theme: options.theme || 'bordeaux',
      dossierTitle: options.dossierTitle || 'Dossiê Consolidado de Perfis Profissionais',
      dossierSubtitle: options.dossierSubtitle || 'Coletânea Executiva de Currículos Processados & Otimizados ATS',
      candidateName: options.candidateName || '',
      includeCoverPage: options.includeCoverPage !== false,
      includeTableOfContents: options.includeTableOfContents !== false,
      includeAtsAudit: options.includeAtsAudit !== false,
      includePortfolioLinks: options.includePortfolioLinks !== false,
      spacing: options.spacing || 'normal',
      customNotes: options.customNotes || ''
    };

    this.theme = THEMES[this.options.theme] || THEMES.bordeaux;
    this.contentWidth = this.pageWidth - this.margin * 2;

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
  }

  private checkPageBreak(requiredHeight: number): boolean {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin - 10) {
      this.doc.addPage();
      this.currentY = this.margin + 6;
      return true;
    }
    return false;
  }

  private drawTopRibbon(): void {
    const [r, g, b] = this.theme.primary;
    const [dr, dg, db] = this.theme.primaryDark;
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.pageWidth, 4.5, 'F');
    this.doc.setFillColor(dr, dg, db);
    this.doc.rect(0, 4.5, this.pageWidth, 0.8, 'F');
  }

  /**
   * Renderiza a Capa Executiva do Dossiê na Página 1
   */
  private drawCoverPage(cvs: CV[], structuredList: StructuredCv[]): void {
    this.doc.setPage(1);
    this.drawTopRibbon();

    const [pr, pg, pb] = this.theme.primary;
    const [dr, dg, db] = this.theme.primaryDark;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const [alr, alg, alb] = this.theme.accentLight;
    const [blr, blg, blb] = this.theme.borderLight;

    let y = 24;

    // Badge de topo
    this.doc.setFillColor(alr, alg, alb);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(this.margin, y, 76, 7, 2, 2, 'FD');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text('CV-AUTOPILOT ENTERPRISE • LOTE UNIFICADO', this.margin + 3, y + 4.8);

    y += 14;

    // Título Principal do Dossiê
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(tdr, tdg, tdb);
    const titleLines = this.doc.splitTextToSize(this.options.dossierTitle, this.contentWidth);
    this.doc.text(titleLines, this.margin, y);
    y += titleLines.length * 8.5;

    // Subtítulo
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(tmr, tmg, tmb);
    const subLines = this.doc.splitTextToSize(this.options.dossierSubtitle, this.contentWidth);
    this.doc.text(subLines, this.margin, y);
    y += subLines.length * 5.5 + 4;

    // Linha divisória de acento
    this.doc.setDrawColor(pr, pg, pb);
    this.doc.setLineWidth(1.2);
    this.doc.line(this.margin, y, this.margin + 36, y);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin + 38, y, this.pageWidth - this.margin, y);
    y += 10;

    // Card de Metadados Executivos
    const candidateDisplayName = this.options.candidateName || structuredList[0]?.candidateName || 'Profissional Executivo';
    const totalSkills = Array.from(new Set(structuredList.flatMap(s => s.skills))).length;

    this.doc.setFillColor(250, 250, 252);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, y, this.contentWidth, 22, 3, 3, 'FD');

    // Coluna 1: Profissional / Titular
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('TITULAR DO DOSSIÊ', this.margin + 6, y + 6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(tdr, tdg, tdb);
    this.doc.text(candidateDisplayName.substring(0, 35), this.margin + 6, y + 13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text(`${cvs.length} versões de currículo compiladas`, this.margin + 6, y + 18);

    // Coluna 2: Data de Geração
    const col2X = this.margin + 75;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('DATA DE EMISSÃO', col2X, y + 6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), col2X, y + 13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('Padrão Internacional ATS 99%', col2X, y + 18);

    // Coluna 3: Indicadores
    const col3X = this.margin + 135;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('COMPETÊNCIAS ÚNICAS', col3X, y + 6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(`${totalSkills} Tecnologias & Skills`, col3X, y + 13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('Hard & Soft Skills auditadas', col3X, y + 18);

    y += 28;

    // Seção Sumário / Índice dos Currículos Inclusos
    if (this.options.includeTableOfContents) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text('SUMÁRIO EXECUTIVO DOS CURRÍCULOS INCLUSOS', this.margin, y);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(tmr, tmg, tmb);
      this.doc.text('Página', this.pageWidth - this.margin - 12, y);

      y += 4;
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, y, this.pageWidth - this.margin, y);
      y += 6;

      cvs.forEach((cv, idx) => {
        const structured = structuredList[idx];
        const startPage = this.cvStartPages.get(cv.id) || (idx + 2);
        const indexStr = String(idx + 1).padStart(2, '0');

        // Box de linha do sumário
        this.doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        this.doc.setDrawColor(226, 232, 240);
        this.doc.roundedRect(this.margin, y, this.contentWidth, 16, 2, 2, 'FD');

        // Número do índice em destaque
        this.doc.setFillColor(alr, alg, alb);
        this.doc.setDrawColor(blr, blg, blb);
        this.doc.roundedRect(this.margin + 2.5, y + 2.5, 9, 11, 1.5, 1.5, 'FD');
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(indexStr, this.margin + 7, y + 9.5, { align: 'center' });

        // Título do CV e Cargo pretendido
        const cvTitle = cv.name;
        const cvHeadline = structured.headline || 'Perfil Profissional';
        const skillsSnippet = structured.skills.slice(0, 4).join(' • ');

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(tdr, tdg, tdb);
        this.doc.text(cvTitle.substring(0, 60), this.margin + 15, y + 6.5);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(tmr, tmg, tmb);
        const descText = cvHeadline + (skillsSnippet ? ` | ${skillsSnippet}` : '');
        this.doc.text(descText.substring(0, 85), this.margin + 15, y + 12);

        // Página Inicial
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(`Pág. ${startPage}`, this.pageWidth - this.margin - 5, y + 9.5, { align: 'right' });

        y += 18;
      });
    }

    // Nota executiva customizada se fornecida
    if (this.options.customNotes && y < this.pageHeight - 40) {
      y += 4;
      this.doc.setFillColor(alr, alg, alb);
      this.doc.setDrawColor(blr, blg, blb);
      this.doc.roundedRect(this.margin, y, this.contentWidth, 16, 2, 2, 'FD');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text('NOTA DO CANDIDATO / OBJETIVO DO DOSSIÊ:', this.margin + 4, y + 5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(tdr, tdg, tdb);
      const noteLines = this.doc.splitTextToSize(this.options.customNotes, this.contentWidth - 8);
      this.doc.text(noteLines.slice(0, 2), this.margin + 4, y + 10);
    }

    // Rodapé especial da capa
    const coverFooterY = this.pageHeight - 12;
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, coverFooterY - 3, this.pageWidth - this.margin, coverFooterY - 3);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('CV-AutoPilot Enterprise • Plataforma de Engenharia de Currículos & Automação ATS', this.margin, coverFooterY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text('Arquivo Consolidado Único', this.pageWidth - this.margin, coverFooterY, { align: 'right' });
  }

  /**
   * Renderiza a faixa de cabeçalho específica de cada currículo
   */
  private drawCvProfileBanner(cv: CV, structured: StructuredCv, cvIndex: number, totalCvs: number): void {
    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const [alr, alg, alb] = this.theme.accentLight;
    const [blr, blg, blb] = this.theme.borderLight;

    this.currentY = 12;

    // Faixa de identificação do perfil no dossiê
    this.doc.setFillColor(alr, alg, alb);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 7, 2, 2, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(`PERFIL ${cvIndex + 1} DE ${totalCvs} • ${cv.name.toUpperCase()}`, this.margin + 4, this.currentY + 4.8);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(tmr, tmg, tmb);
    this.doc.text('COMPILADO EM ARQUIVO ÚNICO', this.pageWidth - this.margin - 4, this.currentY + 4.8, { align: 'right' });

    this.currentY += 10;

    // Monograma e Dados do Candidato
    const initials = structured.candidateName
      .split(' ')
      .filter(p => p.length > 2)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'CV';

    const monogramSize = 14;
    this.doc.setFillColor(pr, pg, pb);
    this.doc.roundedRect(this.margin, this.currentY, monogramSize, monogramSize, 2.5, 2.5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(initials, this.margin + monogramSize / 2, this.currentY + 9.5, { align: 'center' });

    const textStartX = this.margin + monogramSize + 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.setTextColor(tdr, tdg, tdb);
    this.doc.text(structured.candidateName, textStartX, this.currentY + 5.5);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(pr, pg, pb);
    const cleanHeadline = (structured.headline || cv.name).toUpperCase().substring(0, 75);
    this.doc.text(cleanHeadline, textStartX, this.currentY + 11.5);

    this.currentY += monogramSize + 3;

    // Linha de contatos / badges
    const contacts: string[] = [];
    if (structured.contact.email) contacts.push(structured.contact.email);
    if (structured.contact.phone) contacts.push(structured.contact.phone);
    if (structured.contact.location) contacts.push(structured.contact.location);
    if (this.options.includePortfolioLinks && structured.contact.linkedin) {
      contacts.push(structured.contact.linkedin.replace(/^https?:\/\//, ''));
    }

    if (contacts.length > 0) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(tmr, tmg, tmb);
      this.doc.text(contacts.join('  •  '), this.margin, this.currentY);
      this.currentY += 4;
    }

    // Linha divisória
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  private drawSectionTitle(title: string): void {
    this.checkPageBreak(12);

    const [pr, pg, pb] = this.theme.primary;
    const [blr, blg, blb] = this.theme.borderLight;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(title.toUpperCase(), this.margin, this.currentY);

    this.doc.setDrawColor(pr, pg, pb);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.currentY + 1.5, this.margin + 20, this.currentY + 1.5);

    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin + 21, this.currentY + 1.5, this.pageWidth - this.margin, this.currentY + 1.5);

    this.currentY += 6;
  }

  private drawSummarySection(summary: string[]): void {
    if (summary.length === 0) return;
    this.drawSectionTitle('Resumo Profissional Executivo');

    const [tdr, tdg, tdb] = this.theme.textDark;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(tdr, tdg, tdb);

    const text = summary.join(' ');
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.checkPageBreak(lines.length * 4.2 + 4);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 4.2 + 4;
  }

  private drawExperiencesSection(experiences: StructuredCv['experiences']): void {
    if (experiences.length === 0) return;
    this.drawSectionTitle('Trajetória & Experiências Profissionais');

    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;

    experiences.forEach(exp => {
      this.checkPageBreak(14);

      // Cargo
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(tdr, tdg, tdb);
      this.doc.text(exp.role, this.margin, this.currentY);

      // Período
      if (exp.period) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(exp.period, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      }

      this.currentY += 4;

      // Empresa
      if (exp.company) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(tmr, tmg, tmb);
        this.doc.text(exp.company + (exp.location ? ` • ${exp.location}` : ''), this.margin, this.currentY);
        this.currentY += 4;
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(tdr, tdg, tdb);

        exp.bullets.forEach(bullet => {
          const clean = bullet.replace(/^[-•*]\s*/, '').trim();
          if (!clean) return;
          const bulletLines = this.doc.splitTextToSize(clean, this.contentWidth - 6);
          this.checkPageBreak(bulletLines.length * 3.8 + 1);

          this.doc.setTextColor(pr, pg, pb);
          this.doc.text('•', this.margin + 1, this.currentY);
          this.doc.setTextColor(tdr, tdg, tdb);
          this.doc.text(bulletLines, this.margin + 5, this.currentY);
          this.currentY += bulletLines.length * 3.8 + 1;
        });
      }

      this.currentY += 3;
    });
  }

  private drawSkillsSection(skills: string[], cv: CV): void {
    const hardSkills = cv.technicalSkills && cv.technicalSkills.length > 0 ? cv.technicalSkills : skills;
    const softSkills = cv.softSkills || [];

    if (hardSkills.length === 0 && softSkills.length === 0) return;
    this.drawSectionTitle('Competências & Hard / Soft Skills');

    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [alr, alg, alb] = this.theme.accentLight;
    const [blr, blg, blb] = this.theme.borderLight;

    // Hard skills em badges compactas
    if (hardSkills.length > 0) {
      this.checkPageBreak(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text('COMPETÊNCIAS TÉCNICAS (HARD SKILLS):', this.margin, this.currentY);
      this.currentY += 3.5;

      let pillX = this.margin;
      const pillHeight = 5;

      hardSkills.slice(0, 24).forEach(skill => {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7);
        const strWidth = this.doc.getTextWidth(skill) + 5;

        if (pillX + strWidth > this.pageWidth - this.margin) {
          pillX = this.margin;
          this.currentY += pillHeight + 1.8;
          this.checkPageBreak(8);
        }

        this.doc.setFillColor(alr, alg, alb);
        this.doc.setDrawColor(blr, blg, blb);
        this.doc.setLineWidth(0.2);
        this.doc.roundedRect(pillX, this.currentY, strWidth, pillHeight, 1.2, 1.2, 'FD');

        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(skill, pillX + strWidth / 2, this.currentY + 3.6, { align: 'center' });

        pillX += strWidth + 2;
      });

      this.currentY += pillHeight + 4;
    }

    // Soft skills
    if (softSkills.length > 0) {
      this.checkPageBreak(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(tdr, tdg, tdb);
      this.doc.text('COMPETÊNCIAS COMPORTAMENTAIS (SOFT SKILLS):', this.margin, this.currentY);
      this.currentY += 3.5;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(tdr, tdg, tdb);
      const softText = softSkills.join('  •  ');
      const lines = this.doc.splitTextToSize(softText, this.contentWidth);
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 3.8 + 4;
    }
  }

  private drawEducationAndCertifications(
    education: StructuredCv['education'], 
    certifications: string[]
  ): void {
    if (education.length === 0 && certifications.length === 0) return;
    this.drawSectionTitle('Formação Acadêmica & Certificações');

    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const [pr, pg, pb] = this.theme.primary;

    education.forEach(edu => {
      this.checkPageBreak(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(tdr, tdg, tdb);
      this.doc.text(edu.degree, this.margin, this.currentY);

      if (edu.period) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(edu.period, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      }

      this.currentY += 3.8;

      if (edu.institution) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(tmr, tmg, tmb);
        this.doc.text(edu.institution, this.margin, this.currentY);
        this.currentY += 3.8;
      }
      this.currentY += 1.5;
    });

    if (certifications.length > 0) {
      this.checkPageBreak(6);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text('Certificações & Licenças:', this.margin, this.currentY);
      this.currentY += 3.5;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(tdr, tdg, tdb);
      certifications.forEach(cert => {
        this.checkPageBreak(5);
        this.doc.text(`• ${cert}`, this.margin + 3, this.currentY);
        this.currentY += 3.5;
      });
      this.currentY += 2;
    }
  }

  private drawAtsAuditSection(analysis: string): void {
    if (!analysis) return;
    this.drawSectionTitle('Parecer Técnico ATS & Diagnóstico de IA');

    const [alr, alg, alb] = this.theme.accentLight;
    const [blr, blg, blb] = this.theme.borderLight;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [pr, pg, pb] = this.theme.primary;

    const cleanLines = analysis
      .replace(/[*_#]/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .slice(0, 15);

    const textSnippet = cleanLines.join(' ');
    const splitLines = this.doc.splitTextToSize(textSnippet, this.contentWidth - 8);

    const boxHeight = Math.min(splitLines.length * 3.8 + 10, 45);
    this.checkPageBreak(boxHeight + 4);

    this.doc.setFillColor(alr, alg, alb);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 2.5, 2.5, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text('AUDITORIA DE ALGORITMOS & COMPATIBILIDADE SEMÂNTICA:', this.margin + 4, this.currentY + 5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(tdr, tdg, tdb);
    this.doc.text(splitLines.slice(0, 8), this.margin + 4, this.currentY + 10);

    this.currentY += boxHeight + 4;
  }

  /**
   * Aplica cabeçalhos e rodapés oficiais contínuos em todas as páginas
   */
  private applyGlobalHeadersAndFooters(totalPageCount: number, cvCount: number): void {
    const [pr, pg, pb] = this.theme.primary;
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const startPage = this.options.includeCoverPage ? 2 : 1;

    for (let p = 1; p <= totalPageCount; p++) {
      this.doc.setPage(p);

      // Pula cabeçalho na capa
      if (p === 1 && this.options.includeCoverPage) {
        continue;
      }

      // Top Header
      this.drawTopRibbon();
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(tmr, tmg, tmb);
      this.doc.text(
        `CV-AutoPilot Enterprise • Dossiê Consolidado de ${cvCount} Currículos`,
        this.margin,
        8.5
      );

      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text(
        'Arquivo Único Oficial',
        this.pageWidth - this.margin,
        8.5,
        { align: 'right' }
      );

      // Bottom Footer
      const footerY = this.pageHeight - 8;
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(tmr, tmg, tmb);
      this.doc.text(
        `Documento Executivo Compilado • Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        this.margin,
        footerY
      );

      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text(
        `Página ${p} de ${totalPageCount}`,
        this.pageWidth - this.margin,
        footerY,
        { align: 'right' }
      );
    }
  }

  /**
   * Método principal que constrói o documento consolidado completo
   */
  public generate(cvs: CV[], analysisResults: Record<string, string> = {}): jsPDF {
    if (cvs.length === 0) {
      throw new Error('Nenhum currículo selecionado para consolidar.');
    }

    const structuredList = cvs.map(cv => parseCvToStructured(cv));

    // Se tiver capa, a página 1 fica reservada para ela
    if (this.options.includeCoverPage) {
      this.doc.setPage(1);
    }

    // Renderiza cada currículo
    cvs.forEach((cv, idx) => {
      const structured = structuredList[idx];

      // Cada currículo inicia em uma nova página
      if (this.options.includeCoverPage || idx > 0) {
        this.doc.addPage();
      }

      const currentPage = this.doc.getNumberOfPages();
      this.cvStartPages.set(cv.id, currentPage);

      // Renderiza o currículo
      this.drawCvProfileBanner(cv, structured, idx, cvs.length);
      this.drawSummarySection(structured.summary);
      this.drawExperiencesSection(structured.experiences);
      this.drawSkillsSection(structured.skills, cv);
      this.drawEducationAndCertifications(structured.education, structured.certifications);

      if (this.options.includeAtsAudit && analysisResults[cv.id]) {
        this.drawAtsAuditSection(analysisResults[cv.id]);
      }
    });

    // Se tiver capa, agora que conhecemos exatamente o número da página inicial de cada CV, desenhamos a Capa com o Sumário
    if (this.options.includeCoverPage) {
      this.drawCoverPage(cvs, structuredList);
    }

    // Aplica cabeçalhos e numeração contínua "Página X de Y"
    const totalPages = this.doc.getNumberOfPages();
    this.applyGlobalHeadersAndFooters(totalPages, cvs.length);

    return this.doc;
  }
}

/**
 * Gera Blob diretamente do PDF consolidado
 */
export function generateBatchExecutiveCvPdfBlob(
  cvs: CV[], 
  analysisResults?: Record<string, string>, 
  options?: ExecutiveBatchPdfOptions
): Blob {
  const generator = new ExecutiveBatchCvPdfGenerator(options);
  const doc = generator.generate(cvs, analysisResults);
  return doc.output('blob');
}

/**
 * Dispara o download direto do PDF consolidado
 */
export function downloadBatchExecutiveCvPdf(
  cvs: CV[], 
  analysisResults?: Record<string, string>, 
  options?: ExecutiveBatchPdfOptions,
  customFilename?: string
): void {
  const blob = generateBatchExecutiveCvPdfBlob(cvs, analysisResults, options);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilename = customFilename || `Dossie_Curriculos_Consolidado_${cvs.length}_Perfis_${dateStr}.pdf`;
  const finalName = safeFilename.toLowerCase().endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
