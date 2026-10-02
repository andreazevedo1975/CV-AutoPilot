// contactPdfService.ts - Executive PDF Dossier for Extracted CV Contacts
import { jsPDF } from 'jspdf';
import { ExtractedCVContact } from '../types';

export const exportContactDossierPdf = (contact: ExtractedCVContact): string => {
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

  // Header Minimal Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(136, 19, 55); // Bordeaux #881337
  doc.text('CV-AUTOPILOT ENTERPRISE • DOSSIÊ DE CONTATO & IDENTIFICAÇÃO', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 101, 111);
  doc.text(`Extraído em: ${new Date(contact.extractedAt).toLocaleDateString('pt-BR')} às ${new Date(contact.extractedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 12, { align: 'right' });
  
  doc.setDrawColor(230, 220, 224);
  doc.setLineWidth(0.4);
  doc.line(margin, 15, pageWidth - margin, 15);
  y = 22;

  // Top Executive Badge & Title
  doc.setFillColor(136, 19, 55);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(contact.fullName.toUpperCase(), margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`VAGA ALVO: ${contact.targetRole.toUpperCase()}`, margin + 6, y + 16);

  // Render candidate photo inside PDF if available
  if (contact.photoUrl && contact.photoUrl.startsWith('data:image')) {
    try {
      const format = contact.photoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(contact.photoUrl, format, pageWidth - margin - 22, y + 2, 20, 20);
    } catch (err) {
      console.warn('Could not embed photo in PDF:', err);
    }
  }

  if (contact.extractionConfidence) {
    doc.setFontSize(8);
    const confX = contact.photoUrl ? pageWidth - margin - 26 : pageWidth - margin - 6;
    doc.text(`CONFIANÇA ATS: ${contact.extractionConfidence}%`, confX, y + 9, { align: 'right' });
  }
  if (contact.seniority) {
    doc.setFontSize(8);
    const senX = contact.photoUrl ? pageWidth - margin - 26 : pageWidth - margin - 6;
    doc.text(`SENIORIDADE: ${contact.seniority.toUpperCase()}`, senX, y + 16, { align: 'right' });
  }

  y += 30;

  // Section 1: Contatos Principais & Endereço
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(136, 19, 55);
  doc.text('1. DADOS DE CONTATO & LOCALIZAÇÃO GEOGRÁFICA', margin, y);
  y += 4;

  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  // Contact Table Box
  doc.setFillColor(250, 246, 248);
  doc.setDrawColor(230, 220, 224);
  doc.roundedRect(margin, y, contentWidth, 48, 2, 2, 'FD');

  const col1X = margin + 5;
  const col2X = margin + (contentWidth / 2) + 5;
  let rowY = y + 7;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 57, 65);
  doc.text('Nome Completo:', col1X, rowY);
  doc.text('E-mail Principal:', col2X, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(14, 9, 12);
  doc.text(contact.fullName, col1X, rowY);
  doc.text(contact.email, col2X, rowY);

  // Row 2
  rowY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 57, 65);
  doc.text('Telefone / WhatsApp:', col1X, rowY);
  doc.text('Vaga / Cargo Pretendido:', col2X, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(14, 9, 12);
  doc.text(contact.phone, col1X, rowY);
  doc.text(contact.targetRole, col2X, rowY);

  // Row 3: Endereço Completo
  rowY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 57, 65);
  doc.text('Endereço Completo:', col1X, rowY);
  doc.text('Cidade / Estado (UF) / CEP:', col2X, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(14, 9, 12);
  const fullAddressLines = doc.splitTextToSize(contact.address.fullAddress || `${contact.address.city} - ${contact.address.state}`, (contentWidth / 2) - 8);
  doc.text(fullAddressLines, col1X, rowY);

  const locString = `${contact.address.city} - ${contact.address.state}${contact.address.postalCode ? ' | CEP: ' + contact.address.postalCode : ''}`;
  doc.text(locString, col2X, rowY);

  y += 56;

  // Section 2: Redes & Canais Digitais
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(136, 19, 55);
  doc.text('2. PRESENÇA DIGITAL & LINKS PROFISSIONAIS', margin, y);
  y += 4;

  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(230, 220, 224);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  let netY = y + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 57, 65);
  doc.text('LinkedIn:', margin + 5, netY);
  doc.text('Portfólio / GitHub:', margin + (contentWidth / 2) + 5, netY);

  netY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 80, 160);
  doc.text(contact.linkedinUrl || 'Não informado no currículo', margin + 5, netY);
  doc.text(contact.portfolioUrl || contact.githubUrl || 'Não informado no currículo', margin + (contentWidth / 2) + 5, netY);

  y += 28;

  // Section 3: Resumo Profissional & Diretrizes
  if (contact.professionalSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(136, 19, 55);
    doc.text('3. SÍNTESE DO PERFIL & OBJETIVO PROFISSIONAL', margin, y);
    y += 4;

    doc.setDrawColor(136, 19, 55);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 40, y);
    y += 6;

    doc.setFillColor(250, 246, 248);
    doc.setDrawColor(230, 220, 224);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20, 15, 18);
    const summaryLines = doc.splitTextToSize(contact.professionalSummary, contentWidth - 10);
    const boxHeight = Math.max(18, summaryLines.length * 5 + 8);
    
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    doc.text(summaryLines, margin + 5, y + 7);
    y += boxHeight + 8;
  }

  // Section 4: Competências & Stacks Principais
  if (contact.keySkills && contact.keySkills.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(136, 19, 55);
    doc.text('4. COMPETÊNCIAS-CHAVE & HARD SKILLS MAPEADAS', margin, y);
    y += 4;

    doc.setDrawColor(136, 19, 55);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 40, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 30, 35);
    const skillsText = contact.keySkills.join('  •  ');
    const skillLines = doc.splitTextToSize(skillsText, contentWidth - 10);
    const skillsBoxHeight = Math.max(14, skillLines.length * 5 + 6);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 220, 224);
    doc.roundedRect(margin, y, contentWidth, skillsBoxHeight, 2, 2, 'FD');
    doc.text(skillLines, margin + 5, y + 6);
    y += skillsBoxHeight + 8;
  }

  // Section 5: Dados de Enquadramento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(136, 19, 55);
  doc.text('5. ENQUADRAMENTO & ORIGEM DA EXTRAÇÃO', margin, y);
  y += 4;

  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  doc.setFillColor(250, 246, 248);
  doc.setDrawColor(230, 220, 224);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  let metaY = y + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 57, 65);
  doc.text('Modelo de Trabalho:', margin + 5, metaY);
  doc.text('Pretensão Salarial:', margin + 60, metaY);
  doc.text('Origem / Fonte:', margin + 120, metaY);

  metaY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(14, 9, 12);
  doc.text(contact.workModel || 'Híbrido', margin + 5, metaY);
  doc.text(contact.salaryExpectation || 'A combinar / Mercado', margin + 60, metaY);
  doc.text(contact.sourceName || 'Arquivo Importado', margin + 120, metaY);

  // Footer Signature
  const footerY = pageHeight - 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(130, 115, 124);
  doc.text('Relatório emitido pela plataforma corporativa CV-AutoPilot Enterprise • Inteligência Artificial Gemini 3.8 Flash', margin, footerY);
  doc.text('Página 1 de 1', pageWidth - margin, footerY, { align: 'right' });

  // Save PDF
  const sanitizedName = contact.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `Dossie_Contato_${sanitizedName}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Generates and triggers download of a standardized vCard (.vcf) contact file.
 */
export const downloadVCard = (contact: ExtractedCVContact): string => {
  const nameParts = contact.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Candidato';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${contact.fullName}`,
    `TITLE:${contact.targetRole}`,
    contact.recentCompany ? `ORG:${contact.recentCompany}` : 'ORG:Profissional / Candidato',
    `EMAIL;TYPE=INTERNET,WORK:${contact.email}`,
    `TEL;TYPE=CELL,VOICE,PREF:${cleanPhone || contact.phone}`,
    `ADR;TYPE=HOME:;;${contact.address.street || ''};${contact.address.city};${contact.address.state};${contact.address.postalCode || ''};${contact.address.country || 'Brasil'}`,
    contact.linkedinUrl ? `URL;TYPE=LinkedIn:${contact.linkedinUrl}` : '',
    contact.portfolioUrl ? `URL;TYPE=Portfolio:${contact.portfolioUrl}` : '',
    `NOTE:Vaga Alvo: ${contact.targetRole}\\nExtraído com IA pelo CV-AutoPilot Enterprise`,
    'END:VCARD'
  ].filter(Boolean);

  const vcardContent = vcardLines.join('\r\n');
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedName = contact.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `Contato_${sanitizedName}.vcf`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
};
