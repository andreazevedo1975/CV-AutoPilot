// components/LinkedInImportModal.tsx - Importação de perfil do LinkedIn via texto e processamento por IA
import React, { useState } from 'react';
import { 
  Sparkles, 
  ClipboardPaste, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { parseLinkedInProfileText, ParsedLinkedInProfile } from '../services/geminiService';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileImported: (profile: ParsedLinkedInProfile) => void;
  colors: any;
}

const SAMPLE_LINKEDIN_PROFILE = `André Silva, PMP®
Tech Lead & Arquiteto de Software Cloud | Full Stack (React, Node.js, Python, GCP)
São Paulo, SP, Brasil • Mais de 500 conexões
LinkedIn: https://www.linkedin.com/in/andresilva-techlead
GitHub: https://github.com/andresilva-dev
Contato: andre.silva@emailcorp.com.br • (11) 98765-4321

Sobre:
Engenheiro de Software Sênior e Tech Lead com mais de 8 anos de experiência sólida em arquiteturas distribuídas, microsserviços Node.js/TypeScript, React 19, Google Cloud Platform (GCP) e esteiras CI/CD automatizadas. Histórico comprovado de liderança técnica de equipes multidisciplinares com redução de 40% no tempo de deploy e garantia de 99.98% de SLA em sistemas críticos do mercado financeiro.

Experiência Profissional:
Tech Lead & Arquiteto Cloud | Fintech Inova
Jan de 2022 - o momento • 4 anos 9 meses • São Paulo, Brasil
- Coordenação de squad multidisciplinar de 10 engenheiros em migração de monólito para microsserviços orientados a eventos (Kafka e GCP Cloud Run).
- Redução de custos de infraestrutura em R$ 180.000/ano através de auto-scaling refinado e observabilidade proativa (Datadog/OpenTelemetry).
- Implementação de esteira automatizada de testes e deploy contínuo em GitHub Actions, reduzindo o lead time de entrega de 2 semanas para 1 dia.

Engenheiro de Software Sênior | Global Tech Solutions
Mar de 2018 - Dez de 2021 • 3 anos 10 meses • São Paulo, Brasil
- Desenvolvimento de aplicações web responsivas de alta escala utilizando React, TypeScript, Redux Toolkit e Tailwind CSS para mais de 80.000 usuários ativos diários.
- Otimização de performance de front-end com redução de 45% no tempo de carregamento de páginas críticas (Largest Contentful Paint).

Formação acadêmica:
Universidade de São Paulo (USP)
Bacharelado em Ciência da Computação
2014 - 2018

Competências:
React, TypeScript, Node.js, Google Cloud Platform (GCP), Docker, Kubernetes, Arquitetura de Microsserviços, CI/CD, Metodologias Ágeis (Scrum/Kanban), Observabilidade, Gestão Técnica de Squads.

Idiomas e Certificações:
- Inglês Avançado / Fluente
- Google Cloud Certified Professional Cloud Architect
- Project Management Professional (PMP®)`;

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  onProfileImported,
  colors,
}) => {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
          setErrorMessage(null);
        }
      } else {
        setErrorMessage('Acesso à área de transferência não suportado. Pressione Ctrl+V diretamente na caixa de texto.');
      }
    } catch {
      setErrorMessage('Permissão para colar negada pelo navegador. Pressione Ctrl+V na caixa de texto.');
    }
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_LINKEDIN_PROFILE);
    setErrorMessage(null);
  };

  const handleProcess = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Por favor, cole o texto do perfil do LinkedIn antes de processar.');
      return;
    }

    if (rawText.trim().length < 30) {
      setErrorMessage('O texto colado é muito curto. Cole um perfil com informações de experiência, cargo ou formação.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = await parseLinkedInProfileText(rawText);
      onProfileImported(parsed);
      setRawText('');
      onClose();
    } catch (err: any) {
      console.error('Erro ao processar LinkedIn:', err);
      setErrorMessage(err.message || 'Falha ao processar os dados com IA. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        backgroundColor: colors.surface || '#ffffff',
        borderRadius: '20px',
        border: `1px solid ${colors.border || '#e5e7eb'}`,
        color: colors.textPrimary || '#1f2937',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Header com identidade visual do LinkedIn */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border || '#e5e7eb'}`,
          backgroundColor: colors.background || '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#0a66c2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '22px',
              fontFamily: 'sans-serif',
              boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)',
            }}>
              in
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  Importar Perfil do LinkedIn via IA
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(10, 102, 194, 0.1)',
                  color: '#0a66c2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(10, 102, 194, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Sparkles size={11} /> Gemini 3.8 Flash
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Cole o texto bruto copiado do seu perfil para estruturar e preencher automaticamente todos os campos do currículo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: colors.textSecondary,
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
        }}>
          {/* Instruções de uso rápido */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(10, 102, 194, 0.06)',
            border: '1px solid rgba(10, 102, 194, 0.2)',
            fontSize: '12px',
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5,
          }}>
            <Info size={18} color="#0a66c2" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Como funciona:</strong> Abra seu perfil no LinkedIn (no computador ou celular), selecione e copie (Ctrl+A / Ctrl+C) o texto das seções <em>Sobre</em>, <em>Experiência</em>, <em>Formação</em> e <em>Competências</em>. A IA cuidará da formatação executiva, cálculo de anos de experiência, extração de links e otimização para sistemas ATS.
            </div>
          </div>

          {/* Erro de processamento */}
          {errorMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: colors.notification || '#dc2626',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Barra de Ações Rápidas da Caixa de Texto */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
              Texto Copiado do Perfil do LinkedIn:
            </label>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePasteClipboard}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                }}
                title="Colar texto da área de transferência"
              >
                <ClipboardPaste size={14} />
                <span>Colar da Área de Transferência</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(10, 102, 194, 0.08)',
                  color: '#0a66c2',
                  border: '1px solid rgba(10, 102, 194, 0.25)',
                  cursor: 'pointer',
                }}
                title="Carregar perfil demonstrativo de Tech Lead para teste rápido"
              >
                <Sparkles size={14} />
                <span>Carregar Exemplo de Perfil</span>
              </button>

              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: colors.textSecondary,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Limpar texto"
                >
                  <RotateCcw size={13} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Textarea principal */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isLoading}
              rows={11}
              placeholder="Cole aqui o texto copiado do perfil do LinkedIn...&#10;&#10;Exemplo:&#10;André Silva, PMP®&#10;Tech Lead & Arquiteto de Software Cloud&#10;São Paulo - SP&#10;&#10;Sobre:&#10;Engenheiro de Software com 8 anos de experiência em React, Node.js e Cloud...&#10;&#10;Experiência:&#10;Tech Lead | Fintech Inova (2022 - Atual)..."
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${errorMessage ? (colors.notification || '#ef4444') : colors.border}`,
                backgroundColor: colors.inputBg || colors.background,
                color: colors.inputText || colors.textPrimary,
                fontSize: '13px',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            {rawText && (
              <span style={{
                position: 'absolute',
                bottom: '12px',
                right: '16px',
                fontSize: '11px',
                color: colors.textSecondary,
                backgroundColor: colors.surface,
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
              }}>
                {rawText.length} caracteres
              </span>
            )}
          </div>

          {/* Destaques do que a IA irá preencher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
          }}>
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Título do CV:</strong> Cargo & Nome</span>
            </div>
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Experiência:</strong> Anos calculados</span>
            </div>
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Links:</strong> LinkedIn & Portfólio</span>
            </div>
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span><strong>Conteúdo:</strong> Modelo ATS puro</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border || '#e5e7eb'}`,
          backgroundColor: colors.background || '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.textSecondary }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Processamento com privacidade estrita (LGPD)</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleProcess}
              disabled={isLoading || !rawText.trim()}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: isLoading || !rawText.trim() ? '#94a3b8' : '#0a66c2',
                color: '#ffffff',
                border: 'none',
                cursor: isLoading || !rawText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isLoading || !rawText.trim() ? 'none' : '0 4px 14px rgba(10, 102, 194, 0.35)',
                transition: 'all 0.18s ease',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando Perfil com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Processar com IA & Preencher Currículo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInImportModal;
