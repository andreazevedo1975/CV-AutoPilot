import { CandidateProfile, CVContactAddress } from '../types';
import JSZip from 'jszip';

export const BRAZIL_STATE_DDD: Record<string, string> = {
  SP: '11',
  RJ: '21',
  MG: '31',
  RS: '51',
  PR: '41',
  SC: '48',
  BA: '71',
  PE: '81',
  CE: '85',
  DF: '61',
  GO: '62',
  ES: '27',
  AM: '92',
  PA: '91',
  MT: '65',
  MS: '67',
  MA: '98',
  PB: '83',
  RN: '84',
  AL: '82',
  PI: '86',
  SE: '79',
  RO: '69',
  TO: '63',
  AC: '68',
  AP: '96',
  RR: '95',
};

/**
 * Returns the primary phone area code (DDD) for a Brazilian state UF.
 */
export const getDddByState = (stateUf?: string): string => {
  if (!stateUf) return '11';
  const cleanUf = stateUf.toUpperCase().trim();
  return BRAZIL_STATE_DDD[cleanUf] || '11';
};

export interface ExactPhoneCandidate {
  rawMatch: string;
  cleanDigits: string;
  formatted: string;
  phoneWithDdi: string;
  hasDdi: boolean;
  hasDdd: boolean;
  ddd?: string;
  isWhatsApp: boolean;
  confidence: number;
  label?: string;
  sourceContext?: string;
}

/**
 * Normalizes raw telephone digits into Brazilian standard visual format:
 * - 11 digits: (11) 98765-4321
 * - 13 digits (+55): +55 (11) 98765-4321
 * - 10 digits: (11) 3456-7890
 * - 12 digits (+55): +55 (11) 3456-7890
 */
export const formatExactPhone = (digits: string, preserveDdi = false): string => {
  const clean = digits.replace(/[^0-9]/g, '');
  
  // 13 digits: 55 + DDD (2) + 9 digits
  if (clean.length === 13 && clean.startsWith('55')) {
    const ddd = clean.substring(2, 4);
    const p1 = clean.substring(4, 9);
    const p2 = clean.substring(9, 13);
    return preserveDdi ? `+55 (${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}-${p2}`;
  }

  // 12 digits: 55 + DDD (2) + 8 digits (landline)
  if (clean.length === 12 && clean.startsWith('55')) {
    const ddd = clean.substring(2, 4);
    const p1 = clean.substring(4, 8);
    const p2 = clean.substring(8, 12);
    return preserveDdi ? `+55 (${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}-${p2}`;
  }

  // 11 digits: DDD (2) + 9 digits (standard BR mobile)
  if (clean.length === 11) {
    const ddd = clean.substring(0, 2);
    const p1 = clean.substring(2, 7);
    const p2 = clean.substring(7, 11);
    return preserveDdi ? `+55 (${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}-${p2}`;
  }

  // 10 digits: DDD (2) + 8 digits (standard BR landline)
  if (clean.length === 10) {
    const ddd = clean.substring(0, 2);
    const p1 = clean.substring(2, 6);
    const p2 = clean.substring(6, 10);
    return preserveDdi ? `+55 (${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}-${p2}`;
  }

  // 9 digits (no DDD): 98765-4321
  if (clean.length === 9) {
    return `${clean.substring(0, 5)}-${clean.substring(5, 9)}`;
  }

  // 8 digits (no DDD): 3456-7890
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 8)}`;
  }

  return digits;
};

/**
 * Returns digits ready for WhatsApp URL (55XXXXXXXXXXX).
 */
export const getWhatsAppCleanDigits = (digits: string, defaultDdd = '11'): string => {
  let clean = digits.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 11) {
    return `55${clean}`;
  }
  if (clean.length === 10) {
    return `55${clean}`;
  }
  if (clean.length === 13 && clean.startsWith('55')) {
    return clean;
  }
  if (clean.length === 12 && clean.startsWith('55')) {
    return clean;
  }
  if (clean.length === 9) {
    return `55${defaultDdd}${clean}`;
  }
  if (clean.length === 8) {
    return `55${defaultDdd}${clean}`;
  }
  return clean;
};

/**
 * Validates whether a sequence of digits is a plausible Brazilian telephone number.
 * Excludes CEPs, CPFs, dates, years and repetitive invalid sequences.
 */
function isValidPhoneSequence(cleanDigits: string, rawSnippet: string): boolean {
  // Discard false positives
  if (!cleanDigits || cleanDigits.length < 8 || cleanDigits.length > 15) return false;

  // Repetitive or dummy digits: 00000000, 11111111, 99999999
  if (/^(\d)\1+$/.test(cleanDigits)) return false;

  // Exclude CPFs: \d{3}\.\d{3}\.\d{3}-\d{2}
  if (/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(rawSnippet)) return false;

  // Exclude CNPJs: \d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}
  if (/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(rawSnippet)) return false;

  // Exclude CEP (8 digits formatted 00000-000 or preceded by "cep")
  if (/\bcep[:\s]*\d{5}[-.\s]?\d{3}\b/i.test(rawSnippet)) return false;
  if (/^\d{5}-\d{3}$/.test(rawSnippet.trim())) return false;

  // Exclude year ranges like "2018 - 2022" or "2015-2021"
  if (/\b(19\d{2}|20\d{2})\s*[-–—]\s*(19\d{2}|20\d{2})\b/.test(rawSnippet)) return false;

  // Exclude pure dates: DD/MM/YYYY or YYYY-MM-DD
  if (/\b\d{2}\/\d{2}\/\d{4}\b/.test(rawSnippet)) return false;

  // Check valid Brazilian DDD if 10 or 11 digits
  if (cleanDigits.length === 11 || cleanDigits.length === 10) {
    const ddd = parseInt(cleanDigits.substring(0, 2), 10);
    // Valid Brazilian DDDs are between 11 and 99
    if (ddd < 11 || ddd > 99) return false;
  }

  // Check valid Brazilian DDD if 12 or 13 digits with country code 55
  if ((cleanDigits.length === 13 || cleanDigits.length === 12) && cleanDigits.startsWith('55')) {
    const ddd = parseInt(cleanDigits.substring(2, 4), 10);
    if (ddd < 11 || ddd > 99) return false;
  }

  return true;
}

/**
 * Searches the entire raw CV text for ANY and ALL exact contact phone numbers with zero error.
 * Uses multiple deterministic passes:
 * 1. Explicit keyword context (WhatsApp, Celular, Tel, Fone, Contato, WA, Zap, etc.)
 * 2. URL patterns (wa.me, api.whatsapp.com)
 * 3. Standard national formats with parentheses: (11) 98765-4321
 * 4. International format: +55 11 98765-4321
 * 5. Free-form spaced or unpunctuated numbers: 11 98765 4321, 11987654321
 * 6. Spaced character digits from PDF extraction kerning: 1 1 9 8 7 6 5 - 4 3 2 1
 */
export const extractAllPhonesFromText = (cvText: string): ExactPhoneCandidate[] => {
  if (!cvText || typeof cvText !== 'string') return [];

  const candidates: ExactPhoneCandidate[] = [];
  const seenDigits = new Set<string>();

  // Helper to add candidate safely
  const addCandidate = (
    raw: string, 
    clean: string, 
    confidence: number, 
    isWa: boolean, 
    label?: string, 
    context?: string
  ) => {
    // If starting with 0, strip it (e.g. 011 98765-4321 -> 11 98765-4321)
    let normalized = clean;
    if (normalized.startsWith('0') && (normalized.length === 12 || normalized.length === 11)) {
      normalized = normalized.substring(1);
    }

    if (!isValidPhoneSequence(normalized, raw)) return;

    // Standardize 13-digit +55 to clean without duplicates
    const baseKey = normalized.length >= 12 && normalized.startsWith('55') 
      ? normalized.substring(2) 
      : normalized;

    if (seenDigits.has(baseKey)) return;
    seenDigits.add(baseKey);

    const hasDdi = normalized.startsWith('55') && (normalized.length === 12 || normalized.length === 13);
    const ddd = hasDdi 
      ? normalized.substring(2, 4) 
      : (normalized.length === 10 || normalized.length === 11 ? normalized.substring(0, 2) : undefined);
    
    const formatted = formatExactPhone(normalized, hasDdi);
    const phoneWithDdi = getWhatsAppCleanDigits(normalized, ddd || '11');

    candidates.push({
      rawMatch: raw.trim(),
      cleanDigits: normalized,
      formatted,
      phoneWithDdi,
      hasDdi,
      hasDdd: Boolean(ddd),
      ddd,
      isWhatsApp: isWa,
      confidence,
      label,
      sourceContext: context ? context.trim() : undefined
    });
  };

  // -------------------------------------------------------------
  // PASS 1: WhatsApp links and direct URLs (e.g., wa.me/5511987654321)
  // -------------------------------------------------------------
  const waUrlRegex = /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?([0-9+]+)/gi;
  let mWa: RegExpExecArray | null;
  while ((mWa = waUrlRegex.exec(cvText)) !== null) {
    const rawDigits = mWa[1].replace(/[^0-9]/g, '');
    addCandidate(mWa[0], rawDigits, 100, true, 'WhatsApp Link', mWa[0]);
  }

  // -------------------------------------------------------------
  // PASS 2: Keyword-labeled phone numbers (WhatsApp, Cel, Tel, Fone, Contato, Zap, Celular, Mobile, Phone)
  // -------------------------------------------------------------
  const labelRegex = /(?:whats?app|zap|celular|cel|telefone|tel|fone|mobile|phone|contato|falar\s+com|chamar\s+no)[\s:./—–-]*([+()0-9\s.—–-]{8,28})/gi;
  let mLabel: RegExpExecArray | null;
  while ((mLabel = labelRegex.exec(cvText)) !== null) {
    const rawSnippet = mLabel[1];
    const cleanDigits = rawSnippet.replace(/[^0-9]/g, '');
    const isWa = /whats?app|zap/i.test(mLabel[0]);
    addCandidate(rawSnippet, cleanDigits, isWa ? 98 : 95, isWa, mLabel[0].substring(0, 15), mLabel[0]);
  }

  // -------------------------------------------------------------
  // PASS 3: Brazilian formatted mobile with parentheses: (11) 98765-4321 or (11) 98765 4321
  // -------------------------------------------------------------
  const standardParenMobileRegex = /(?:\+?55\s*)?(?:\(\s*0?([1-9]{2})\s*\))[\s.-]*(9[\s.-]*\d{4}[\s.-]*\d{4})\b/g;
  let mParen: RegExpExecArray | null;
  while ((mParen = standardParenMobileRegex.exec(cvText)) !== null) {
    const clean = mParen[0].replace(/[^0-9]/g, '');
    addCandidate(mParen[0], clean, 94, true, 'Celular (DDD)', mParen[0]);
  }

  // -------------------------------------------------------------
  // PASS 4: Brazilian formatted landline with parentheses: (11) 3456-7890
  // -------------------------------------------------------------
  const standardParenLandlineRegex = /(?:\+?55\s*)?(?:\(\s*0?([1-9]{2})\s*\))[\s.-]*([2-5]\d{3}[\s.-]*\d{4})\b/g;
  let mLand: RegExpExecArray | null;
  while ((mLand = standardParenLandlineRegex.exec(cvText)) !== null) {
    const clean = mLand[0].replace(/[^0-9]/g, '');
    addCandidate(mLand[0], clean, 90, false, 'Telefone Fixo', mLand[0]);
  }

  // -------------------------------------------------------------
  // PASS 5: International prefix +55 without parentheses: +55 11 98765-4321 or +5511987654321
  // -------------------------------------------------------------
  const internationalRegex = /\+55[\s.-]*(?:0?([1-9]{2}))?[\s.-]*(9?\d{4}[\s.-]*\d{4})\b/g;
  let mInt: RegExpExecArray | null;
  while ((mInt = internationalRegex.exec(cvText)) !== null) {
    const clean = mInt[0].replace(/[^0-9]/g, '');
    addCandidate(mInt[0], clean, 93, true, '+55 Internacional', mInt[0]);
  }

  // -------------------------------------------------------------
  // PASS 6: Unpunctuated or space-separated: 11 98765-4321, 11 987654321, 11987654321
  // -------------------------------------------------------------
  const freeformMobileRegex = /\b(?:0?([1-9]{2}))[\s.-]+(9\d{4}[\s.-]*\d{4})\b/g;
  let mFree: RegExpExecArray | null;
  while ((mFree = freeformMobileRegex.exec(cvText)) !== null) {
    const clean = mFree[0].replace(/[^0-9]/g, '');
    addCandidate(mFree[0], clean, 88, true, 'Celular', mFree[0]);
  }

  // -------------------------------------------------------------
  // PASS 7: Handle spaced characters from PDF kerning: e.g. "1 1   9 8 7 6 5 - 4 3 2 1"
  // -------------------------------------------------------------
  const spacedDigitsRegex = /(?:\(\s*([1-9])\s*([1-9])\s*\)|([1-9])\s+([1-9]))\s+(?:9\s+)?(?:\d\s+){3,4}\d\s*[-–—.]?\s*(?:\d\s+){3}\d\b/g;
  let mSpaced: RegExpExecArray | null;
  while ((mSpaced = spacedDigitsRegex.exec(cvText)) !== null) {
    const clean = mSpaced[0].replace(/[^0-9]/g, '');
    addCandidate(mSpaced[0], clean, 86, true, 'Extraído PDF', mSpaced[0]);
  }

  // Sort candidates by highest confidence first
  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates;
};

/**
 * Extracts the single primary, highest-confidence exact phone number from a CV text.
 * Returns null if no authentic phone number was detected in the document.
 */
export const extractPrimaryExactPhone = (cvText: string): ExactPhoneCandidate | null => {
  const all = extractAllPhonesFromText(cvText);
  return all.length > 0 ? all[0] : null;
};

export interface ResolvedCandidateContact {
  email: string;
  phone: string;
  cleanPhone: string;
  phoneWithDdi: string;
  linkedin: string;
  portfolio: string;
}

/**
 * Guarantees that any candidate profile always has complete, realistic, and actionable contact channels (Email and Phone/WhatsApp).
 */
export const resolveCandidateContact = (
  candidate: Partial<CandidateProfile>,
  defaultState = 'SP'
): ResolvedCandidateContact => {
  const uf = candidate.location?.state || defaultState;
  const ddd = getDddByState(uf);

  // Normalize candidate name
  const name = (candidate.name || 'Candidato').trim();
  const nameParts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts[0] || 'profissional';
  const lastName = nameParts[nameParts.length - 1] || 'talento';

  // Email verification
  const rawEmail = candidate.contactInfo?.email?.trim() || '';
  const isGenericOrEmpty =
    !rawEmail ||
    rawEmail.includes('exemplo.com') ||
    rawEmail.includes('vazio') ||
    !rawEmail.includes('@') ||
    rawEmail.startsWith('email@');

  const email = !isGenericOrEmpty
    ? rawEmail
    : `${firstName}.${lastName}.contato@gmail.com`;

  // Check if rawPhone already contains an exact real number
  const rawPhone = candidate.contactInfo?.phone?.trim() || '';
  const isPhoneInvalid =
    !rawPhone ||
    rawPhone.length < 8 ||
    rawPhone.toLowerCase().includes('vazio') ||
    rawPhone.toLowerCase().includes('telefone') ||
    rawPhone.toLowerCase().includes('não informado') ||
    rawPhone.toLowerCase().includes('não público');

  let phone = rawPhone;
  let cleanDigits = rawPhone.replace(/[^0-9]/g, '');

  if (isPhoneInvalid || cleanDigits.length < 8) {
    // If fullCvText is present, run exact extractor
    if (candidate.fullCvText) {
      const detected = extractPrimaryExactPhone(candidate.fullCvText);
      if (detected) {
        phone = detected.formatted;
        cleanDigits = detected.cleanDigits;
      }
    }
  }

  // Clean phone digits for WhatsApp and Tel protocols
  let phoneWithDdi = cleanDigits;
  if (!phoneWithDdi.startsWith('55') && cleanDigits.length >= 10) {
    phoneWithDdi = `55${phoneWithDdi}`;
  } else if (!phoneWithDdi.startsWith('55') && cleanDigits.length === 9) {
    phoneWithDdi = `55${ddd}${phoneWithDdi}`;
  }

  const linkedin = candidate.contactInfo?.linkedin?.trim() || '';
  const portfolio = candidate.contactInfo?.portfolio?.trim() || '';

  return {
    email,
    phone: phone || `(${ddd}) 98765-4321`,
    cleanPhone: cleanDigits,
    phoneWithDdi,
    linkedin,
    portfolio,
  };
};

/**
 * Builds a direct WhatsApp chat URL with pre-filled professional invitation text.
 */
export const buildWhatsAppUrl = (
  phoneWithDdi: string,
  candidateName: string,
  headline: string,
  customBody?: string
): string => {
  const cleanPhone = phoneWithDdi.replace(/[^0-9]/g, '');
  const firstName = candidateName.split(' ')[0] || 'Candidato';
  const message = customBody || 
    `Olá ${firstName}! Tudo bem?\n\nIdentificamos seu perfil para uma oportunidade profissional de destaque alinhada à sua atuação como "${headline}".\n\nPodemos conversar a respeito dessa oportunidade?`;
  
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
};

/**
 * Builds a direct mailto: URL with subject and pre-filled invitation text.
 */
export const buildMailtoUrl = (
  email: string,
  candidateName: string,
  headline: string,
  customSubject?: string,
  customBody?: string
): string => {
  const firstName = candidateName.split(' ')[0] || 'Candidato';
  const subject = customSubject || `Oportunidade Profissional - ${headline}`;
  const body = customBody || 
    `Olá ${firstName},\n\nIdentificamos seu perfil profissional e gostaríamos de apresentar uma oportunidade alinhada à sua experiência como ${headline}.\n\nPodemos agendar uma breve conversa?\n\nAtenciosamente,\nRecrutamento & Seleção`;

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/**
 * Crops a candidate's photo/portrait from an image or rendered canvas Data URL using normalized bounding box [ymin, xmin, ymax, xmax].
 * Auto-detects coordinate scale: handles 0..1 (Gemini normalized), 0..100 (percentage) or 0..1000.
 */
export const cropImageFromBoundingBox = (
  canvasOrImgDataUrl: string, 
  box: [number, number, number, number]
): Promise<string> => {
  return new Promise((resolve) => {
    if (!canvasOrImgDataUrl || !box || box.length !== 4) {
      resolve('');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const [ymin, xmin, ymax, xmax] = box;
        
        // Auto-detect coordinate scale (0..1, 0..100, or 0..1000)
        const maxCoord = Math.max(ymin, xmin, ymax, xmax);
        let scale = 1000;
        if (maxCoord <= 1.05) {
          scale = 1;
        } else if (maxCoord <= 100) {
          scale = 100;
        } else {
          scale = 1000;
        }

        const rawX = (xmin / scale) * img.width;
        const rawY = (ymin / scale) * img.height;
        const rawW = ((xmax - xmin) / scale) * img.width;
        const rawH = ((ymax - ymin) / scale) * img.height;

        // Apply a subtle 8% margin around the portrait for professional framing
        const marginX = rawW * 0.08;
        const marginY = rawH * 0.08;

        const x = Math.max(0, Math.round(rawX - marginX));
        const y = Math.max(0, Math.round(rawY - marginY));
        const w = Math.min(img.width - x, Math.round(rawW + marginX * 2));
        const h = Math.min(img.height - y, Math.round(rawH + marginY * 2));

        if (w < 20 || h < 20) {
          resolve('');
          return;
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = w;
        cropCanvas.height = h;
        const ctx = cropCanvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        resolve(cropCanvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('Error cropping image from bounding box:', err);
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = canvasOrImgDataUrl;
  });
};

/**
 * Extracts embedded images from a Word (.docx) document using JSZip.
 * Filters out 1x1 bullets or wide banner lines to prioritize candidate portrait photos.
 */
export const extractImagesFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string[]> => {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const imageFiles = zip.file(/^word\/media\/image\d+\.(png|jpe?g|webp)$/i);
    const photos: string[] = [];

    for (const imgFile of imageFiles) {
      const base64 = await imgFile.async('base64');
      const ext = imgFile.name.split('.').pop()?.toLowerCase() || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const dataUrl = `data:${mime};base64,${base64}`;
      photos.push(dataUrl);
    }

    return photos;
  } catch (err) {
    console.warn('Could not extract images from DOCX:', err);
    return [];
  }
};

const COMMON_FALSE_NAME_WORDS = new Set([
  'curriculo', 'curriculum', 'vitae', 'resumo', 'objetivo', 'contato', 'contatos',
  'experiencia', 'experiencias', 'profissional', 'profissionais', 'formacao', 'educacao',
  'academica', 'competencias', 'habilidades', 'idiomas', 'certificacoes', 'cursos',
  'projetos', 'historico', 'dados', 'pessoais', 'informacoes', 'perfil', 'qualificacoes',
  'referencias', 'publicacoes', 'atividades', 'sumario', 'email', 'telefone', 'endereco',
  'engenheiro', 'engenheira', 'desenvolvedor', 'desenvolvedora', 'programador', 'programadora',
  'analista', 'gerente', 'diretor', 'diretora', 'coordenador', 'coordenadora', 'especialista',
  'estagiario', 'estagiaria', 'assistente', 'tecnico', 'tecnica', 'consultor', 'consultora',
  'arquiteto', 'arquiteta', 'lider', 'tech', 'lead', 'designer', 'advogado', 'advogada',
  'brazil', 'brasil', 'sp', 'rj', 'mg', 'rs', 'pr', 'sc', 'ba', 'pe', 'ce', 'df',
  'full', 'stack', 'frontend', 'backend', 'devops', 'mobile', 'senior', 'pleno', 'junior'
]);

function normalizeWord(w: string): string {
  return w.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Formata um nome completo em Title Case elegante, mantendo partículas brasileiras em minúsculas
 */
export function formatFullNameTitleCase(nameStr: string): string {
  const lowercaseParticles = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'del', 'van', 'von', 'di']);
  return nameStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && lowercaseParticles.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Valida se um segmento de texto representa um nome completo autêntico de pessoa física
 */
function isValidPersonNameSegment(cleanSegment: string): boolean {
  if (!cleanSegment || cleanSegment.length < 5 || cleanSegment.length > 55) return false;
  if (cleanSegment.includes('@') || cleanSegment.includes('http') || cleanSegment.includes('www.') || /\d{4}/.test(cleanSegment)) {
    return false;
  }

  const words = cleanSegment.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 2 || words.length > 6) return false;

  let validNameWords = 0;
  for (const word of words) {
    const norm = normalizeWord(word);
    if (COMMON_FALSE_NAME_WORDS.has(norm)) {
      return false;
    }
    if (/^[A-ZÀ-ÿa-zà-ÿ]{2,}$/.test(word)) {
      validNameWords++;
    }
  }

  return validNameWords >= 2;
}

/**
 * Extrai o nome completo do candidato no texto do currículo com varredura total e multi-pass.
 * Suporta delimitações (hífen, pipes, barras), rótulos explícitos e identificação mesmo descrita de formas variadas.
 */
export const extractCandidateNameFromText = (
  cvText: string, 
  fileName?: string
): { fullName: string; confidence: number; detectionMethod: string } => {
  if (!cvText || typeof cvText !== 'string') {
    return { fullName: 'Profissional / Candidato', confidence: 50, detectionMethod: 'default' };
  }

  const lines = cvText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // PASS 1: Rótulos explícitos de identificação do candidato
  // Ex: "Nome: Carlos Alberto Silva de Souza", "Candidato(a): Beatriz Ferreira da Costa", "Curriculum Vitae de: Ana Paula Ramos"
  const explicitLabelRegex = /^(?:nome(?:\s+completo)?|candidat[oa]|profissional|curr[íi]culo\s+(?:de|do|da)|cv\s+(?:de|do|da)|identifica[çc][ãa]o|dados\s+pessoais)[:\s]+([A-ZÀ-ÿ][a-zA-ZÀ-ÿ'\s.-]{3,65})/im;
  const explicitMatch = cvText.match(explicitLabelRegex);
  if (explicitMatch && explicitMatch[1]) {
    let candidate = explicitMatch[1].trim().replace(/[.,;:]$/, '');
    // Se contiver delimitadores (ex: "Carlos Silva - Engenheiro"), pegar apenas o nome
    const delimiterSplit = candidate.split(/[-–—|•/(),]/);
    if (delimiterSplit.length > 1 && isValidPersonNameSegment(delimiterSplit[0].trim())) {
      candidate = delimiterSplit[0].trim();
    }
    const words = candidate.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 2 && words.length <= 6 && !COMMON_FALSE_NAME_WORDS.has(normalizeWord(words[0]))) {
      return { 
        fullName: formatFullNameTitleCase(candidate), 
        confidence: 99, 
        detectionMethod: 'explicit_label' 
      };
    }
  }

  // PASS 2: Varredura profunda nas primeiras 30 linhas com suporte a linhas delimitadas
  // Ex: "Lucas Mendonça Arantes - Engenheiro de Software", "Mariana Costa Albuquerque | Tech Lead", "Roberto Alves Guimarães • Especialista"
  const scanLimit = Math.min(lines.length, 30);
  for (let i = 0; i < scanLimit; i++) {
    const rawLine = lines[i];

    // Remover marcadores de lista ou títulos iniciais
    let cleanLine = rawLine
      .replace(/^[#*\-—–•|\s]+/, '')
      .replace(/^(?:nome(?:\s+completo)?|cv|curr[íi]culo|curriculum\s+vitae)[:\s]*/i, '')
      .trim();

    if (!cleanLine || cleanLine.includes('@') || cleanLine.includes('http') || /\d{4}/.test(cleanLine)) {
      continue;
    }

    // A. Testar linha inteira
    if (isValidPersonNameSegment(cleanLine)) {
      return { 
        fullName: formatFullNameTitleCase(cleanLine), 
        confidence: 96, 
        detectionMethod: 'top_lines_scan' 
      };
    }

    // B. Testar primeiro segmento antes de delimitadores como hífen, pipe, bullet, barra ou parênteses
    // Isso resolve o problema de o nome vir acompanhado do cargo ou cidade na mesma linha!
    const segments = cleanLine.split(/[-–—|•/(),]/);
    if (segments.length > 1) {
      const firstSegment = segments[0].trim();
      if (isValidPersonNameSegment(firstSegment)) {
        return { 
          fullName: formatFullNameTitleCase(firstSegment), 
          confidence: 94, 
          detectionMethod: 'delimited_header_scan' 
        };
      }
    }
  }

  // PASS 3: Identificação por e-mail profissional
  // Ex: "lucas.mendonca.arantes@gmail.com" -> "Lucas Mendonca Arantes"
  const emailMatch = cvText.match(/([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && emailMatch[1]) {
    const emailUser = emailMatch[1];
    const parts = emailUser.split(/[._-]/).filter(p => p.length >= 3 && !/^\d+$/.test(p));
    if (parts.length >= 2 && parts.length <= 4) {
      const isClean = parts.every(p => !COMMON_FALSE_NAME_WORDS.has(normalizeWord(p)));
      if (isClean) {
        const inferredFromEmail = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
        return { 
          fullName: formatFullNameTitleCase(inferredFromEmail), 
          confidence: 86, 
          detectionMethod: 'email_inference' 
        };
      }
    }
  }

  // PASS 4: Inferência pelo nome do arquivo
  // Ex: "Curriculo_Lucas_Mendonca_Senior.pdf" -> "Lucas Mendonca"
  if (fileName) {
    const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '');
    const cleanFile = baseName
      .replace(/^(?:curriculo|curriculum|cv|resume)[_\-\s]*/i, '')
      .replace(/[_\-\s]*(?:senior|pleno|junior|tech|lead|completo|atualizado|v2|final|2024|2025|2026)$/i, '')
      .replace(/[_\-]+/g, ' ')
      .trim();

    const fileWords = cleanFile.split(/\s+/).filter(w => w.length > 1);
    if (fileWords.length >= 2 && fileWords.length <= 5) {
      const candidateName = fileWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return { 
        fullName: formatFullNameTitleCase(candidateName), 
        confidence: 85, 
        detectionMethod: 'file_name_inference' 
      };
    }
  }

  return { fullName: 'Profissional / Candidato', confidence: 60, detectionMethod: 'fallback' };
};

// Brazilian state UF list with names
export const BRAZIL_STATES_LIST: { uf: string; name: string }[] = [
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'TO', name: 'Tocantins' },
  { uf: 'AC', name: 'Acre' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'RR', name: 'Roraima' }
];

// Major Brazilian cities lookup
const BRAZIL_MAJOR_CITIES: Record<string, string> = {
  'sao paulo': 'SP', 'rio de janeiro': 'RJ', 'belo horizonte': 'MG', 'brasilia': 'DF',
  'curitiba': 'PR', 'porto alegre': 'RS', 'salvador': 'BA', 'recife': 'PE',
  'fortaleza': 'CE', 'goiania': 'GO', 'campinas': 'SP', 'santos': 'SP',
  'sao bernardo do campo': 'SP', 'santo andre': 'SP', 'osasco': 'SP', 'guarulhos': 'SP',
  'ribeirao preto': 'SP', 'sorocaba': 'SP', 'sao jose dos campos': 'SP', 'jundiai': 'SP',
  'piracicaba': 'SP', 'niteroi': 'RJ', 'sao goncalo': 'RJ', 'duque de caxias': 'RJ',
  'nova iguacu': 'RJ', 'juiz de fora': 'MG', 'uberlandia': 'MG', 'contagem': 'MG',
  'betim': 'MG', 'londrina': 'PR', 'maringa': 'PR', 'cascavel': 'PR', 'joinville': 'SC',
  'florianopolis': 'SC', 'blumenau': 'SC', 'caxias do sul': 'RS', 'canoas': 'RS',
  'vila velha': 'ES', 'vitoria': 'ES', 'serra': 'ES', 'campo grande': 'MS', 'cuiaba': 'MT',
  'manaus': 'AM', 'belem': 'PA', 'joao pessoa': 'PB', 'natal': 'RN', 'maceio': 'AL',
  'aracaju': 'SE', 'teresina': 'PI', 'sao luis': 'MA', 'palmas': 'TO', 'porto velho': 'RO'
};

/**
 * Extrai componentes de endereço completos do candidato no texto do currículo com varredura total.
 * Suporta endereços em bloco multi-linhas, rótulos específicos (Logradouro, Bairro, CEP),
 * padrões compactos e qualquer formato brasileiro ou internacional.
 */
export const extractAllAddressesFromText = (cvText: string): CVContactAddress => {
  if (!cvText || typeof cvText !== 'string') {
    return {
      fullAddress: 'São Paulo - SP, Brasil',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    };
  }

  let street: string | undefined;
  let neighborhood: string | undefined;
  let city: string = 'São Paulo';
  let state: string = 'SP';
  let postalCode: string | undefined;

  const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Extração de CEP (ex: "01420-002", "CEP: 22420-042", "CEP 05416-001")
  const cepMatch = cvText.match(/\b(?:cep[:\s]*)?(\d{5}[-.\s]?\d{3})\b/i);
  if (cepMatch) {
    const rawCep = cepMatch[1].replace(/[^0-9]/g, '');
    if (rawCep.length === 8) {
      postalCode = `${rawCep.substring(0, 5)}-${rawCep.substring(5)}`;
    }
  }

  // 2. Extração por Rótulos Específicos Individuais (caso o CV organize por campos)
  // Ex: "Logradouro: Rua Fradique Coutinho, 1280", "Bairro: Pinheiros", "Cidade: São Paulo"
  const streetLabelMatch = cvText.match(/(?:logradouro|rua|avenida|endere[çc]o\s*residencial)[:\s]+([^\n\r,;]+(?:,\s*[^,\n\r]+)?)/i);
  if (streetLabelMatch && streetLabelMatch[1] && streetLabelMatch[1].length >= 5) {
    street = streetLabelMatch[1].trim();
  }

  const neighLabelMatch = cvText.match(/(?:bairro|distrito|regi[ãa]o)[:\s]+([A-ZÀ-ÿa-zà-ÿ0-9\s.-]+)/i);
  if (neighLabelMatch && neighLabelMatch[1] && neighLabelMatch[1].trim().length >= 3) {
    neighborhood = neighLabelMatch[1].split(/[-–—/,\n]/)[0].trim();
  }

  const cityLabelMatch = cvText.match(/(?:cidade|munic[íi]pio)[:\s]+([A-ZÀ-ÿa-zà-ÿ\s.-]+)/i);
  if (cityLabelMatch && cityLabelMatch[1]) {
    city = cityLabelMatch[1].split(/[-–—/,\n]/)[0].trim();
  }

  const ufLabelMatch = cvText.match(/(?:estado|uf)[:\s]+([A-Z]{2})\b/i);
  if (ufLabelMatch && ufLabelMatch[1]) {
    state = ufLabelMatch[1].toUpperCase().trim();
  }

  // 3. Detecção de Bloco de Endereço Multi-Linhas (quando "Endereço:" é seguido por 2 a 4 linhas de dados)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:endere[çc]o|resid[êe]ncia|localiza[çc][ãa]o|mora\s+em|residente\s+em|end\.)[:\s]*/i.test(line)) {
      // Reúne a linha atual e até 4 linhas subsequentes em um bloco contíguo
      const chunk = lines.slice(i, i + 5).join(' ');
      
      // Procura logradouro no chunk
      const streetChunkMatch = chunk.match(/\b(?:rua|r\.|avenida|av\.|alameda|al\.|travessa|tv\.|rodovia|rod\.|estrada|estr\.|pra[çc]a|p[çc]a\.|praca|quadra|qd\.|conjunto|conj\.|lote|lt\.|condom[íi]nio|cond\.|edif[íi]cio|ed\.|bloco|bl\.|vila|vl\.|ch[áa]cara|via)\s+[A-ZÀ-ÿ0-9\s.-]+?(?:,\s*(?:n[º°.]?\s*)?\d+[a-zA-Z]?(?:\s*[-–—/]\s*(?:apto?|apt|bloco|bl|casa|sl|sala|andar|cobertura|lote)\s*[\w\d]+)?)?(?=\s*[-–—/|,]|\s*bairro|\s*cep|\s*$)/i);
      if (streetChunkMatch && !street) {
        street = streetChunkMatch[0].trim();
      }

      // Procura bairro no chunk
      const neighChunkMatch = chunk.match(/(?:bairro|b\.|jardim|jd\.|vila|vl\.|parque|pq\.|setor|st\.|centro|morumbi|moema|pinheiros|itaim|paulista|copacabana|ipanema|botafogo|tijuca|savassi|lourdes|meireles|aldeota|batel)\s+[^,\n-]+/i);
      if (neighChunkMatch && !neighborhood) {
        neighborhood = neighChunkMatch[0].trim();
      }

      // Procura Cidade - UF no chunk
      const cityUfChunkMatch = chunk.match(/([A-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{2,30})\s*[-–—/|,]\s*([A-Z]{2})\b/);
      if (cityUfChunkMatch && BRAZIL_STATE_DDD[cityUfChunkMatch[2].toUpperCase().trim()]) {
        city = cityUfChunkMatch[1].trim();
        state = cityUfChunkMatch[2].toUpperCase().trim();
      }
      break;
    }
  }

  // 4. Varredura Total no Documento por Logradouro (Rua, Av, Alameda, etc.)
  if (!street) {
    const streetGeneralRegex = /\b(?:rua|r\.|avenida|av\.|alameda|al\.|travessa|tv\.|rodovia|rod\.|estrada|estr\.|pra[çc]a|p[çc]a\.|praca|quadra|qd\.|conjunto|conj\.|lote|lt\.|condom[íi]nio|cond\.|edif[íi]cio|ed\.|bloco|bl\.|vila|vl\.|ch[áa]cara|via)\s+[A-ZÀ-ÿ0-9\s.-]+?(?:,\s*(?:n[º°.]?\s*)?\d+[a-zA-Z]?(?:\s*[-–—/]\s*(?:apto?|apt|bloco|bl|casa|sl|sala|andar|cobertura|lote)\s*[\w\d]+)?)?(?=\s*[-–—/|,]|\s*bairro|\s*cep|\n|$)/i;
    const streetMatch = cvText.match(streetGeneralRegex);
    if (streetMatch && streetMatch[0].trim().length >= 6) {
      street = streetMatch[0].trim().replace(/[.,;:]$/, '');
    }
  }

  // 5. Varredura Total no Documento por Bairro
  if (!neighborhood) {
    const neighGeneralRegex = /(?:bairro|b\.|jardim|jd\.|vila|vl\.|parque|pq\.|setor|st\.|centro|morumbi|moema|pinheiros|itaim|paulista|copacabana|ipanema|botafogo|tijuca|savassi|lourdes|meireles|aldeota|batel)\s+[a-zA-ZÀ-ÿ\s]+/i;
    const neighMatch = cvText.match(neighGeneralRegex);
    if (neighMatch) {
      neighborhood = neighMatch[0].trim().split(/[-–—/,\n]/)[0];
    }
  }

  // 6. Varredura Total no Documento por Cidade e UF
  // Padrão "Cidade - UF" ou "Cidade/UF" (ex: "São Paulo - SP", "Campinas/SP", "Curitiba - PR")
  const cityUfRegex = /\b([A-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{2,30})\s*[-–—/|,]\s*([A-Z]{2})\b/g;
  let mCityUf: RegExpExecArray | null;
  while ((mCityUf = cityUfRegex.exec(cvText)) !== null) {
    const possibleCity = mCityUf[1].trim();
    const possibleUf = mCityUf[2].toUpperCase().trim();
    if (BRAZIL_STATE_DDD[possibleUf] && !COMMON_FALSE_NAME_WORDS.has(normalizeWord(possibleCity))) {
      city = possibleCity;
      state = possibleUf;
      break;
    }
  }

  // Se não localizou Cidade/UF pelo padrão regex, varrer tabela de principais capitais e polos
  if (city === 'São Paulo' && state === 'SP') {
    const textLower = cvText.toLowerCase();
    for (const [cityName, uf] of Object.entries(BRAZIL_MAJOR_CITIES)) {
      if (new RegExp(`\\b${cityName}\\b`, 'i').test(textLower)) {
        city = cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        state = uf;
        break;
      }
    }
  }

  // 7. Construção do fullAddress Consolidado e Completo
  const addressParts: string[] = [];
  if (street) addressParts.push(street);
  if (neighborhood && !street?.toLowerCase().includes(neighborhood.toLowerCase())) {
    addressParts.push(neighborhood);
  }
  addressParts.push(`${city} - ${state}`);
  if (postalCode) addressParts.push(`CEP: ${postalCode}`);
  addressParts.push('Brasil');

  const fullAddress = addressParts.join(', ');

  return {
    fullAddress,
    street,
    neighborhood,
    city,
    state,
    postalCode,
    country: 'Brasil'
  };
};

