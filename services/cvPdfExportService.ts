// services/cvPdfExportService.ts - Exportador de Currículo em PDF Executivo Profissional
import { jsPDF } from 'jspdf';
import { CV } from '../types';

export type PdfThemeId = 'bordeaux' | 'navy' | 'slate' | 'emerald';

export interface ExecutivePdfOptions {
  theme?: PdfThemeId;
  includeAtsAudit?: boolean;
  includePortfolioLinks?: boolean;
  spacing?: 'compact' | 'normal' | 'spacious';
  customTitle?: string;
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

export interface StructuredCv {
  candidateName: string;
  headline: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string[];
  experiences: Array<{
    role: string;
    company: string;
    period?: string;
    location?: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period?: string;
    details?: string;
  }>;
  skills: string[];
  languages: string[];
  certifications: string[];
  otherSections: Array<{
    title: string;
    content: string[];
  }>;
}

/**
 * Intelligent parser to transform any unstructured or markdown CV content
 * into an executive structured object with sections, contacts, experiences and skills.
 */
export function parseCvToStructured(cv: CV): StructuredCv {
  const content = cv.content || '';
  const lines = content.split('\n').map(l => l.trim());

  let candidateName = '';
  let headline = '';
  const contact: StructuredCv['contact'] = {};
  const summary: string[] = [];
  const experiences: StructuredCv['experiences'] = [];
  const education: StructuredCv['education'] = [];
  let skills: string[] = [];
  const languages: string[] = [];
  const certifications: string[] = [];
  const otherSections: StructuredCv['otherSections'] = [];

  // 1. Candidate Name resolution
  // Check if cv.name contains the person's name or a title like "Currículo Tech Lead"
  const cleanTitleName = cv.name
    .replace(/^curr[íi]culo\s*(de)?\s*/i, '')
    .trim();

  // Search in first 10 lines for personal details
  let currentSection = 'header';
  let currentExpItem: { role: string; company: string; period?: string; location?: string; bullets: string[] } | null = null;
  let currentEduItem: { degree: string; institution: string; period?: string; details?: string } | null = null;
  let currentOtherSection: { title: string; content: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    // Detect section headers
    const norm = rawLine
      .replace(/^#+\s*/, '')
      .replace(/^[*_~`]+|[*_~`]+$/g, '')
      .trim()
      .toUpperCase();

    const isHeaderLine = (
      rawLine.startsWith('#') ||
      rawLine.startsWith('**') && rawLine.endsWith('**') ||
      (rawLine === rawLine.toUpperCase() && rawLine.length > 3 && rawLine.length < 50 && !rawLine.includes('•') && !rawLine.includes('-'))
    );

    if (
      isHeaderLine && (
        norm.includes('DADOS PESSOAIS') ||
        norm.includes('INFORMAÇÕES DE CONTATO') ||
        norm.includes('CONTATO')
      )
    ) {
      currentSection = 'contact';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('RESUMO PROFISSIONAL') ||
        norm.includes('RESUMO EXECUTIVO') ||
        norm.includes('PERFIL PROFISSIONAL') ||
        norm.includes('SOBRE') ||
        norm.includes('OBJETIVO') ||
        norm.includes('SUMMARY') ||
        norm.includes('PROFILE')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'summary';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('EXPERIÊNCIA') ||
        norm.includes('HISTÓRICO PROFISSIONAL') ||
        norm.includes('TRAJETÓRIA PROFISSIONAL') ||
        norm.includes('EXPERIENCE') ||
        norm.includes('EXPERIÊNCIAS')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'experience';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('FORMAÇÃO') ||
        norm.includes('EDUCAÇÃO') ||
        norm.includes('ESCOLARIDADE') ||
        norm.includes('EDUCATION') ||
        norm.includes('ACADÊMICO')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'education';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('COMPETÊNCIAS') ||
        norm.includes('HABILIDADES') ||
        norm.includes('SKILLS') ||
        norm.includes('TECNOLOGIAS') ||
        norm.includes('CONHECIMENTOS')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'skills';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('CERTIFICAÇÕES') ||
        norm.includes('CERTIFICADOS') ||
        norm.includes('CERTIFICATIONS')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'certifications';
      continue;
    }

    if (
      isHeaderLine && (
        norm.includes('IDIOMAS') ||
        norm.includes('LANGUAGES')
      )
    ) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); currentOtherSection = null; }
      currentSection = 'languages';
      continue;
    }

    // Check if new generic section
    if (isHeaderLine && rawLine.startsWith('#')) {
      if (currentExpItem) { experiences.push(currentExpItem); currentExpItem = null; }
      if (currentEduItem) { education.push(currentEduItem); currentEduItem = null; }
      if (currentOtherSection) { otherSections.push(currentOtherSection); }
      currentSection = 'other';
      currentOtherSection = {
        title: rawLine.replace(/^#+\s*/, '').replace(/[*_]/g, '').trim(),
        content: []
      };
      continue;
    }

    // Parse email
    const emailMatch = rawLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !contact.email) {
      contact.email = emailMatch[0];
    }

    // Parse phone
    const phoneMatch = rawLine.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
    if (phoneMatch && !contact.phone && !rawLine.includes('http')) {
      contact.phone = phoneMatch[0].trim();
    }

    // Parse LinkedIn
    const linkedinMatch = rawLine.match(/linkedin\.com\/in\/[a-zA-Z0-9-_%]+/i);
    if (linkedinMatch && !contact.linkedin) {
      contact.linkedin = `https://${linkedinMatch[0]}`;
    }

    // Parse GitHub
    const githubMatch = rawLine.match(/github\.com\/[a-zA-Z0-9-_%]+/i);
    if (githubMatch && !contact.github) {
      contact.github = `https://${githubMatch[0]}`;
    }

    // Parse Location (e.g. "São Paulo - SP", "Rio de Janeiro, RJ")
    const locMatch = rawLine.match(/([A-ZÀ-ÿ\s]+)\s*[-/|•,]\s*([A-Z]{2})(?:\s*[-/|•,]\s*Brasil)?/);
    if (locMatch && !contact.location && !rawLine.includes('@') && !rawLine.includes('http')) {
      contact.location = `${locMatch[1].trim()} - ${locMatch[2].trim()}`;
    }

    // If still in header section (first few lines)
    if (currentSection === 'header' || currentSection === 'contact') {
      // First prominent non-header non-contact line might be candidate name or title
      if (!candidateName && !rawLine.includes('@') && !rawLine.includes('http') && rawLine.length < 50) {
        // If line is like "André Silva | andre@... | ..."
        if (rawLine.includes('|')) {
          const parts = rawLine.split('|').map(p => p.trim());
          if (parts[0] && parts[0].length < 40 && !parts[0].includes(':')) {
            candidateName = parts[0].replace(/[*_]/g, '');
          }
        } else if (!rawLine.toLowerCase().includes('dados') && !rawLine.toLowerCase().includes('currículo')) {
          candidateName = rawLine.replace(/[*_#]/g, '').trim();
          continue;
        }
      } else if (!headline && candidateName && !rawLine.includes('@') && !rawLine.includes('http') && rawLine.length < 90) {
        headline = rawLine.replace(/[*_#]/g, '').trim();
        continue;
      }
    }

    // Section specific collecting
    if (currentSection === 'summary') {
      summary.push(rawLine.replace(/^[*_~`]+|[*_~`]+$/g, ''));
    } else if (currentSection === 'skills') {
      const cleanSkillsLine = rawLine.replace(/^[-•*]\s*/, '').replace(/[*_]/g, '');
      const splitted = cleanSkillsLine.split(/[,;|•]/).map(s => s.trim()).filter(s => s.length > 1);
      skills.push(...splitted);
    } else if (currentSection === 'certifications') {
      certifications.push(rawLine.replace(/^[-•*]\s*/, '').replace(/[*_]/g, ''));
    } else if (currentSection === 'languages') {
      languages.push(rawLine.replace(/^[-•*]\s*/, '').replace(/[*_]/g, ''));
    } else if (currentSection === 'experience') {
      // Check if this line is an experience item title
      // Examples: "• Tech Lead & Arquiteto | Fintech Inova (2022 - Atual)" or "Tech Lead | Fintech Inova"
      const isBullet = rawLine.startsWith('•') || rawLine.startsWith('-') || rawLine.startsWith('*');
      const isSubRole = (
        rawLine.includes('|') ||
        rawLine.includes(' - ') && (rawLine.includes('20') || rawLine.includes('Atual') || rawLine.includes('momento')) ||
        (isBullet && rawLine.includes('|'))
      );

      if (isSubRole) {
        if (currentExpItem) {
          experiences.push(currentExpItem);
        }
        const cleaned = rawLine.replace(/^[-•*]\s*/, '').replace(/[*_]/g, '').trim();
        const parts = cleaned.split('|').map(p => p.trim());
        const role = parts[0] || 'Profissional';
        const rest = parts[1] || '';
        
        let company = rest;
        let period = '';
        const dateMatch = rest.match(/\((.*?)\)|(\b\d{4}\b\s*[-–—a]\s*(?:\b\d{4}\b|Atual|o momento))/i);
        if (dateMatch) {
          period = (dateMatch[1] || dateMatch[2] || '').trim();
          company = rest.replace(dateMatch[0], '').trim();
        }

        currentExpItem = {
          role,
          company: company || 'Empresa',
          period,
          bullets: []
        };
      } else if (currentExpItem) {
        currentExpItem.bullets.push(rawLine.replace(/^[-•*]\s*/, '').trim());
      } else {
        // Fallback start an exp item
        currentExpItem = {
          role: rawLine.replace(/[*_#]/g, ''),
          company: '',
          bullets: []
        };
      }
    } else if (currentSection === 'education') {
      const isBullet = rawLine.startsWith('•') || rawLine.startsWith('-');
      if (!currentEduItem) {
        currentEduItem = {
          degree: rawLine.replace(/^[-•*#]\s*/, '').replace(/[*_]/g, '').trim(),
          institution: '',
          details: ''
        };
      } else if (!currentEduItem.institution) {
        currentEduItem.institution = rawLine.replace(/^[-•*#]\s*/, '').replace(/[*_]/g, '').trim();
      } else {
        if (isBullet || rawLine.match(/\d{4}/)) {
          currentEduItem.period = rawLine.replace(/^[-•*]\s*/, '').trim();
          education.push(currentEduItem);
          currentEduItem = null;
        } else {
          currentEduItem.details = (currentEduItem.details ? currentEduItem.details + ' ' : '') + rawLine;
        }
      }
    } else if (currentSection === 'other' && currentOtherSection) {
      currentOtherSection.content.push(rawLine);
    }
  }

  // Push remaining items
  if (currentExpItem) experiences.push(currentExpItem);
  if (currentEduItem) education.push(currentEduItem);
  if (currentOtherSection) otherSections.push(currentOtherSection);

  // Fallbacks
  if (!candidateName) {
    candidateName = cleanTitleName || 'Candidato Profissional';
  }
  if (!headline) {
    headline = cleanTitleName !== candidateName ? cleanTitleName : 'Currículo Profissional Executivo';
  }

  // Add portfolio links from cv.portfolioLinks if not already present
  if (cv.portfolioLinks && cv.portfolioLinks.length > 0) {
    for (const link of cv.portfolioLinks) {
      if (link.includes('linkedin.com') && !contact.linkedin) {
        contact.linkedin = link;
      } else if (link.includes('github.com') && !contact.github) {
        contact.github = link;
      } else if (!contact.portfolio) {
        contact.portfolio = link;
      }
    }
  }

  // Add skills from cv.technicalSkills and cv.softSkills if present
  if (cv.technicalSkills && cv.technicalSkills.length > 0) {
    skills.push(...cv.technicalSkills);
  }
  if (cv.softSkills && cv.softSkills.length > 0) {
    skills.push(...cv.softSkills);
  }
  if (cv.skills && cv.skills.length > 0) {
    skills.push(...cv.skills);
  }

  // Deduplicate skills
  skills = Array.from(new Set(skills)).filter(s => s.length > 1 && s.length < 40);

  return {
    candidateName,
    headline,
    contact,
    summary,
    experiences,
    education,
    skills,
    languages,
    certifications,
    otherSections
  };
}

/**
 * Executive PDF Generator Engine for CV-AutoPilot Enterprise
 */
export class ExecutiveCvPdfGenerator {
  private doc: jsPDF;
  private theme: ThemeConfig;
  private options: ExecutivePdfOptions;
  private margin = 14;
  private pageWidth = 210;
  private pageHeight = 297;
  private contentWidth: number;
  private currentY = 14;
  private totalPages = 1;

  constructor(options: ExecutivePdfOptions = {}) {
    this.options = {
      theme: 'bordeaux',
      includeAtsAudit: true,
      includePortfolioLinks: true,
      spacing: 'normal',
      ...options
    };
    this.theme = THEMES[this.options.theme || 'bordeaux'] || THEMES.bordeaux;
    this.contentWidth = this.pageWidth - this.margin * 2;

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
  }

  private checkPageBreak(requiredHeight: number): boolean {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin - 8) {
      this.doc.addPage();
      this.totalPages++;
      this.currentY = this.margin + 4;
      return true;
    }
    return false;
  }

  private drawExecutiveTopRibbon(): void {
    const [r, g, b] = this.theme.primary;
    const [dr, dg, db] = this.theme.primaryDark;
    
    // Top colored geometric header ribbon
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.pageWidth, 4.5, 'F');

    // Subtle thin sub-accent line
    this.doc.setFillColor(dr, dg, db);
    this.doc.rect(0, 4.5, this.pageWidth, 0.8, 'F');
  }

  private drawHeader(structured: StructuredCv, cv: CV): void {
    this.drawExecutiveTopRibbon();
    this.currentY = 12;

    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const [alr, alg, alb] = this.theme.accentLight;
    const [blr, blg, blb] = this.theme.borderLight;

    // 1. Monogram Box / Initials
    const initials = structured.candidateName
      .split(' ')
      .filter(p => p.length > 2)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'CV';

    const monogramSize = 16;
    this.doc.setFillColor(alr, alg, alb);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, monogramSize, monogramSize, 3, 3, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(initials, this.margin + monogramSize / 2, this.currentY + 10.5, { align: 'center' });

    // 2. Candidate Name
    const textStartX = this.margin + monogramSize + 4;
    const maxNameWidth = this.contentWidth - monogramSize - 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(17);
    this.doc.setTextColor(tdr, tdg, tdb);
    this.doc.text(structured.candidateName, textStartX, this.currentY + 6);

    // 3. Professional Headline / Role
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(pr, pg, pb);
    const cleanHeadline = (structured.headline || cv.name).toUpperCase().substring(0, 75);
    this.doc.text(cleanHeadline, textStartX, this.currentY + 12);

    this.currentY += monogramSize + 4;

    // 4. Contact Details & Metadata Badges Bar
    const contactPills: Array<{ label: string; text: string; url?: string }> = [];

    if (structured.contact.email) {
      contactPills.push({ label: 'Email', text: structured.contact.email, url: `mailto:${structured.contact.email}` });
    }
    if (structured.contact.phone) {
      contactPills.push({ label: 'Tel', text: structured.contact.phone });
    }
    if (structured.contact.location) {
      contactPills.push({ label: 'Local', text: structured.contact.location });
    }
    if (structured.contact.linkedin && this.options.includePortfolioLinks) {
      const cleanLi = structured.contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'in/');
      contactPills.push({ label: 'LinkedIn', text: cleanLi, url: structured.contact.linkedin });
    }
    if (structured.contact.github && this.options.includePortfolioLinks) {
      const cleanGh = structured.contact.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'gh/');
      contactPills.push({ label: 'GitHub', text: cleanGh, url: structured.contact.github });
    }
    if (cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null) {
      contactPills.push({ label: 'Exp', text: `${cv.yearsOfExperience} anos de experiência` });
    }

    if (contactPills.length > 0) {
      this.doc.setFillColor(248, 250, 252); // #f8fafc
      this.doc.setDrawColor(226, 232, 240); // #e2e8f0
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 8, 2, 2, 'FD');

      let pillX = this.margin + 3;
      const pillY = this.currentY + 5.2;

      for (let i = 0; i < contactPills.length; i++) {
        const item = contactPills[i];
        const displayText = `${item.label}: ${item.text}`;
        
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(item.label + ':', pillX, pillY);

        const labelWidth = this.doc.getTextWidth(item.label + ': ');
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(tdr, tdg, tdb);
        this.doc.text(item.text, pillX + labelWidth, pillY);

        const totalItemWidth = this.doc.getTextWidth(displayText) + 2;

        if (item.url) {
          this.doc.link(pillX, pillY - 4, totalItemWidth, 6, { url: item.url });
        }

        pillX += totalItemWidth + 3;

        // Separator dot if not last and space available
        if (i < contactPills.length - 1 && pillX < this.pageWidth - this.margin - 10) {
          this.doc.setTextColor(tmr, tmg, tmb);
          this.doc.text('•', pillX, pillY);
          pillX += 4;
        } else if (pillX >= this.pageWidth - this.margin - 10) {
          break;
        }
      }

      this.currentY += 12;
    } else {
      this.currentY += 3;
    }

    // Elegant separator line
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  private drawSectionTitle(title: string, badgeText?: string): void {
    this.checkPageBreak(22);

    const [pr, pg, pb] = this.theme.primary;
    const [blr, blg, blb] = this.theme.borderLight;
    const [alr, alg, alb] = this.theme.accentLight;

    // Small decorative block
    this.doc.setFillColor(pr, pg, pb);
    this.doc.roundedRect(this.margin, this.currentY, 3, 7.5, 0.8, 0.8, 'F');

    // Section title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(title.toUpperCase(), this.margin + 5, this.currentY + 5.5);

    const titleWidth = this.doc.getTextWidth(title.toUpperCase());

    // Optional badge (e.g. "ATS 98%")
    if (badgeText) {
      const badgeX = this.margin + 7 + titleWidth;
      const badgeWidth = this.doc.getTextWidth(badgeText) + 6;
      this.doc.setFillColor(alr, alg, alb);
      this.doc.setDrawColor(blr, blg, blb);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(badgeX, this.currentY + 0.5, badgeWidth, 5.5, 1.5, 1.5, 'FD');

      this.doc.setFontSize(7);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text(badgeText, badgeX + badgeWidth / 2, this.currentY + 4.2, { align: 'center' });
    }

    // Underline rule
    this.currentY += 8.5;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    // Primary accent underline
    this.doc.setDrawColor(pr, pg, pb);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.currentY, this.margin + Math.min(titleWidth + 10, 45), this.currentY);

    this.currentY += 4.5;
  }

  private drawSummarySection(summary: string[]): void {
    if (!summary || summary.length === 0) return;
    this.drawSectionTitle('Resumo Executivo');

    const [tdr, tdg, tdb] = this.theme.textDark;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.8);
    this.doc.setTextColor(tdr, tdg, tdb);

    const fullSummary = summary.join(' ');
    const lines = this.doc.splitTextToSize(fullSummary, this.contentWidth);

    for (const line of lines) {
      this.checkPageBreak(5);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 4.3;
    }

    this.currentY += 3;
  }

  private drawExperienceSection(experiences: StructuredCv['experiences']): void {
    if (!experiences || experiences.length === 0) return;
    this.drawSectionTitle('Experiência Profissional');

    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;

    for (const exp of experiences) {
      this.checkPageBreak(18);

      // Role Title
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(tdr, tdg, tdb);
      this.doc.text(exp.role, this.margin, this.currentY);

      // Period & Location (Right-aligned)
      if (exp.period) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(tmr, tmg, tmb);
        this.doc.text(exp.period, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      }

      this.currentY += 4.2;

      // Company name
      if (exp.company) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8.8);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(exp.company, this.margin, this.currentY);
        this.currentY += 4;
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8.4);
        this.doc.setTextColor(tdr, tdg, tdb);

        for (const bullet of exp.bullets) {
          if (!bullet) continue;
          const cleanBullet = bullet.replace(/^[-•*]\s*/, '').trim();
          const lines = this.doc.splitTextToSize(cleanBullet, this.contentWidth - 6);

          this.checkPageBreak(lines.length * 4 + 2);

          // Bullet dot
          this.doc.setFont('helvetica', 'bold');
          this.doc.setTextColor(pr, pg, pb);
          this.doc.text('•', this.margin + 1, this.currentY);

          // Bullet text
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(tdr, tdg, tdb);
          let bulletY = this.currentY;
          for (let lIdx = 0; lIdx < lines.length; lIdx++) {
            this.doc.text(lines[lIdx], this.margin + 5, bulletY);
            bulletY += 3.8;
          }
          this.currentY = bulletY;
        }
      }

      this.currentY += 3;
    }
  }

  private drawSkillsSection(skills: string[]): void {
    if (!skills || skills.length === 0) return;
    this.drawSectionTitle('Competências & Tecnologias Principais');

    const [pr, pg, pb] = this.theme.primary;
    const [blr, blg, blb] = this.theme.borderLight;
    const [alr, alg, alb] = this.theme.accentLight;

    let pillX = this.margin;
    const pillHeight = 5.5;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);

    for (const skill of skills) {
      const textWidth = this.doc.getTextWidth(skill);
      const pillWidth = textWidth + 6;

      if (pillX + pillWidth > this.pageWidth - this.margin) {
        pillX = this.margin;
        this.currentY += pillHeight + 2;
        this.checkPageBreak(12);
      }

      // Pill Background
      this.doc.setFillColor(alr, alg, alb);
      this.doc.setDrawColor(blr, blg, blb);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(pillX, this.currentY, pillWidth, pillHeight, 1.5, 1.5, 'FD');

      // Pill Text
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text(skill, pillX + pillWidth / 2, this.currentY + 3.8, { align: 'center' });

      pillX += pillWidth + 2.5;
    }

    this.currentY += pillHeight + 5;
  }

  private drawEducationAndCertifications(education: StructuredCv['education'], certifications: string[]): void {
    if ((!education || education.length === 0) && (!certifications || certifications.length === 0)) return;
    
    this.drawSectionTitle('Formação Acadêmica & Certificações');

    const [pr, pg, pb] = this.theme.primary;
    const [tdr, tdg, tdb] = this.theme.textDark;
    const [tmr, tmg, tmb] = this.theme.textMuted;

    if (education && education.length > 0) {
      for (const edu of education) {
        this.checkPageBreak(12);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9);
        this.doc.setTextColor(tdr, tdg, tdb);
        this.doc.text(edu.degree, this.margin, this.currentY);

        if (edu.period) {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(8);
          this.doc.setTextColor(tmr, tmg, tmb);
          this.doc.text(edu.period, this.pageWidth - this.margin, this.currentY, { align: 'right' });
        }

        this.currentY += 4;

        if (edu.institution) {
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(8.5);
          this.doc.setTextColor(pr, pg, pb);
          this.doc.text(edu.institution, this.margin, this.currentY);
          this.currentY += 3.8;
        }

        if (edu.details) {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(8);
          this.doc.setTextColor(tdr, tdg, tdb);
          this.doc.text(edu.details, this.margin, this.currentY);
          this.currentY += 3.8;
        }

        this.currentY += 1.5;
      }
    }

    if (certifications && certifications.length > 0) {
      this.currentY += 2;
      this.checkPageBreak(12);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text('Certificações & Licenças:', this.margin, this.currentY);
      this.currentY += 4;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.2);
      this.doc.setTextColor(tdr, tdg, tdb);

      for (const cert of certifications) {
        if (!cert) continue;
        this.checkPageBreak(5);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text('•', this.margin + 1, this.currentY);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(tdr, tdg, tdb);
        this.doc.text(cert, this.margin + 5, this.currentY);
        this.currentY += 3.8;
      }
    }

    this.currentY += 3;
  }

  private drawOtherSections(otherSections: StructuredCv['otherSections']): void {
    if (!otherSections || otherSections.length === 0) return;

    const [tdr, tdg, tdb] = this.theme.textDark;

    for (const sec of otherSections) {
      if (!sec.title || sec.content.length === 0) continue;
      this.drawSectionTitle(sec.title);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(tdr, tdg, tdb);

      for (const line of sec.content) {
        if (!line) continue;
        const lines = this.doc.splitTextToSize(line, this.contentWidth);
        for (const l of lines) {
          this.checkPageBreak(5);
          this.doc.text(l, this.margin, this.currentY);
          this.currentY += 4;
        }
      }
      this.currentY += 3;
    }
  }

  private drawAtsAuditSection(analysis: string): void {
    if (!analysis || !this.options.includeAtsAudit) return;

    this.checkPageBreak(35);
    this.drawSectionTitle('Auditoria Técnica & Parecer de IA ATS', 'OTIMIZADO');

    const [pr, pg, pb] = this.theme.primary;
    const [blr, blg, blb] = this.theme.borderLight;
    const [alr, alg, alb] = this.theme.accentLight;
    const [tdr, tdg, tdb] = this.theme.textDark;

    const boxStartY = this.currentY;
    const cleanAnalysis = analysis
      .replace(/[*#_~`]/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Box Header
    this.doc.setFillColor(alr, alg, alb);
    this.doc.setDrawColor(blr, blg, blb);
    this.doc.setLineWidth(0.4);

    // Measure height needed
    const allLines: string[] = [];
    for (const para of cleanAnalysis) {
      const split = this.doc.splitTextToSize(para, this.contentWidth - 8);
      allLines.push(...split);
    }

    const calculatedHeight = Math.min(allLines.length * 4.2 + 10, 60);
    this.doc.roundedRect(this.margin, boxStartY, this.contentWidth, calculatedHeight, 2, 2, 'FD');

    let textY = boxStartY + 5.5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text('Relatório de Conformidade com Sistemas de Triagem Automática (ATS):', this.margin + 4, textY);
    textY += 4.5;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.8);
    this.doc.setTextColor(tdr, tdg, tdb);

    for (let i = 0; i < Math.min(allLines.length, 12); i++) {
      this.doc.text(allLines[i], this.margin + 4, textY);
      textY += 3.8;
    }

    this.currentY = boxStartY + calculatedHeight + 6;
  }

  private drawPageHeadersAndFooters(structured: StructuredCv): void {
    const pageCount = this.doc.internal.pages.length - 1; // jsPDF 1-based index
    const [tmr, tmg, tmb] = this.theme.textMuted;
    const [pr, pg, pb] = this.theme.primary;

    for (let p = 1; p <= pageCount; p++) {
      this.doc.setPage(p);

      // Running Header on page 2+
      if (p > 1) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(pr, pg, pb);
        this.doc.text(structured.candidateName.toUpperCase(), this.margin, 8);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(tmr, tmg, tmb);
        this.doc.text('•  CURRÍCULO PROFISSIONAL EXECUTIVO  •  CV-AUTOPILOT ENTERPRISE', this.margin + this.doc.getTextWidth(structured.candidateName.toUpperCase()) + 2, 8);

        this.doc.setDrawColor(226, 232, 240);
        this.doc.setLineWidth(0.3);
        this.doc.line(this.margin, 10, this.pageWidth - this.margin, 10);
      }

      // Running Footer on all pages
      const footerY = this.pageHeight - 8;
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(tmr, tmg, tmb);
      this.doc.text(
        `CV-AutoPilot Enterprise • Documento Executivo • Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        this.margin,
        footerY
      );

      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(pr, pg, pb);
      this.doc.text(
        `Página ${p} de ${pageCount}`,
        this.pageWidth - this.margin,
        footerY,
        { align: 'right' }
      );
    }
  }

  public generate(cv: CV, analysis?: string): jsPDF {
    const structured = parseCvToStructured(cv);

    this.drawHeader(structured, cv);
    this.drawSummarySection(structured.summary);
    this.drawExperienceSection(structured.experiences);
    this.drawSkillsSection(structured.skills);
    this.drawEducationAndCertifications(structured.education, structured.certifications);
    this.drawOtherSections(structured.otherSections);
    
    if (analysis) {
      this.drawAtsAuditSection(analysis);
    }

    this.drawPageHeadersAndFooters(structured);

    return this.doc;
  }
}

/**
 * Helper to generate Blob directly
 */
export function generateExecutiveCvPdfBlob(
  cv: CV, 
  analysis?: string, 
  options?: ExecutivePdfOptions
): Blob {
  const generator = new ExecutiveCvPdfGenerator(options);
  const doc = generator.generate(cv, analysis);
  return doc.output('blob');
}

/**
 * Helper to download PDF directly with sanitized executive filename
 */
export function downloadExecutiveCvPdf(
  cv: CV, 
  analysis?: string, 
  options?: ExecutivePdfOptions,
  customFilename?: string
): void {
  const blob = generateExecutiveCvPdfBlob(cv, analysis, options);
  const safeName = customFilename || (
    cv.name
      .replace(/[^a-zA-Z0-9À-ÿ_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'Curriculo_Executivo'
  );
  
  const filename = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}_Executivo.pdf`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Helper to create a preview object URL
 */
export function createExecutiveCvPdfPreviewUrl(
  cv: CV, 
  analysis?: string, 
  options?: ExecutivePdfOptions
): string {
  const blob = generateExecutiveCvPdfBlob(cv, analysis, options);
  return URL.createObjectURL(blob);
}
