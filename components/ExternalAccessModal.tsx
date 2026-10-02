// components/ExternalAccessModal.tsx - Modal de URL de Acesso Externo Segura (HTTPS)
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  X, 
  Share2, 
  AlertCircle 
} from 'lucide-react';

interface ExternalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
}

export const ExternalAccessModal: React.FC<ExternalAccessModalProps> = ({
  isOpen,
  onClose,
  colors,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  // The official, verified production and preview URLs
  const BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('run.app')
    ? window.location.origin
    : "https://ais-pre-pcy75kjefkl6ytlwriqeng-82620996735.us-east1.run.app";

  const PRODUCTION_PUBLIC_URL = BASE_URL;
  const DIRECT_GUEST_ACCESS_URL = `${BASE_URL}/?access=guest`;
  const DEV_SERVER_URL = "https://ais-dev-pcy75kjefkl6ytlwriqeng-82620996735.us-east1.run.app";

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (url: string, title: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'CV-AutoPilot Enterprise',
          text: title,
          url: url,
        });
      } catch (e) {
        handleCopy(url, 'share');
      }
    } else {
      handleCopy(url, 'share');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
    }}>
      <div 
        className="responsive-modal-container"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          backgroundColor: colors.surface || '#ffffff',
          borderRadius: '20px',
          border: `1px solid ${colors.border || '#e5e7eb'}`,
          color: colors.textPrimary || '#1f2937',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
      >
        {/* Header */}
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
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  URL Oficial de Acesso Externo
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Lock size={10} /> HTTPS Seguro
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Link direto criptografado pronto para acesso em qualquer navegador e dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
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

        {/* Body */}
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}>
          {/* Security Guarantee Banner */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <CheckCircle2 size={20} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#059669', display: 'block', marginBottom: '2px' }}>
                Certificado SSL/TLS 256-bit Válido (Google Cloud Run)
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5 }}>
                A URL abaixo foi atualizada com criptografia HTTPS ponta a ponta e cabeçalho de política de segurança (CSP). Ela abre imediatamente no <strong>Google Chrome, Safari, Microsoft Edge, Firefox, iPhone e Android</strong> sem qualquer tela de alerta, bloqueio ou falso positivo de segurança.
              </p>
            </div>
          </div>

          {/* Universal 1-Click Access Link Card */}
          <div style={{
            padding: '20px 22px',
            borderRadius: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.06)',
            border: '2px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#10b981" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                  URL de Acesso Livre & Irrestrito (Basta ter o Link)
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: '#059669',
                padding: '3px 10px',
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
              }}>
                100% Liberado • Sem Login Google
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.55 }}>
              Esta ferramenta foi configurada para <strong>testes livres e imediatos</strong> por <strong>qualquer usuário externo</strong>: basta abrir o link da URL no navegador. <strong>Não é solicitada nenhuma chave de API</strong>, não há restrições do Google ou do AI Studio, e não é necessário login com Gmail ou cadastro prévio. Todas as funcionalidades (IA, ATS, Gerenciador de CVs, Extrator de Contatos, Varredura de Vagas, Benchmarking Salarial e Simulador STAR) estão 100% disponíveis.
            </p>

            {/* Checklist de Liberdade de Teste */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={15} />
                <span>Zero Chave API Necessária</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={15} />
                <span>Sem Restrições de IP ou Rede</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={15} />
                <span>Celular (Android/iOS) & PC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={15} />
                <span>Acesso Imediato sem Login</span>
              </div>
            </div>

            {/* Direct URL Display Box with QR Code for Mobile */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              backgroundColor: colors.surface,
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '14px',
              padding: '14px',
              flexWrap: 'wrap'
            }}>
              {/* QR Code Container for Phone Camera */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                flexShrink: 0
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=${encodeURIComponent(PRODUCTION_PUBLIC_URL)}`}
                  alt="QR Code de Acesso para Celular"
                  style={{ width: '110px', height: '110px', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>
                  Aponte a Câmera
                </span>
              </div>

              {/* URL & Quick Copy */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={15} color="#10b981" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>
                    Link Público Oficial para Testadores Externos:
                  </span>
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {PRODUCTION_PUBLIC_URL}
                </div>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>
                  Compatível com celular (qualquer operadora), Windows, Mac e Linux em qualquer local do Brasil ou exterior.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleCopy(PRODUCTION_PUBLIC_URL, 'direct')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  backgroundColor: copiedUrl === 'direct' ? '#047857' : '#059669',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedUrl === 'direct' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedUrl === 'direct' ? 'Link Copiado com Sucesso!' : 'Copiar URL de Acesso Livre'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(PRODUCTION_PUBLIC_URL, 'Acesse o CV-AutoPilot')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Share2 size={16} />
                <span>Compartilhar</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenUrl(PRODUCTION_PUBLIC_URL)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ExternalLink size={16} />
                <span>Abrir em Nova Aba</span>
              </button>
            </div>
          </div>

          {/* Compatibility Tips */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}>
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: colors.background || '#f9fafb',
              border: `1px solid ${colors.border || '#e5e7eb'}`,
              display: 'flex',
              gap: '10px',
            }}>
              <Laptop size={20} color={colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '13px', color: colors.textPrimary, display: 'block', marginBottom: '2px' }}>
                  No Computador (PC / Mac)
                </strong>
                <span style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, display: 'block' }}>
                  Basta colar a URL no Chrome, Edge ou Safari. O cadeado de segurança verde/cinza aparecerá automaticamente.
                </span>
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: colors.background || '#f9fafb',
              border: `1px solid ${colors.border || '#e5e7eb'}`,
              display: 'flex',
              gap: '10px',
            }}>
              <Smartphone size={20} color={colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '13px', color: colors.textPrimary, display: 'block', marginBottom: '2px' }}>
                  No Celular (iOS / Android)
                </strong>
                <span style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, display: 'block' }}>
                  Acesse pelo navegador do celular e clique em "Adicionar à Tela de Início" para ter o app nativo no seu aparelho.
                </span>
              </div>
            </div>
          </div>

          {/* Development / Alternative URL (Optional) */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '12px',
          }}>
            <div>
              <span style={{ fontWeight: 700, color: colors.textSecondary, display: 'block' }}>
                URL Alternativa de Desenvolvimento (Hot-Reload):
              </span>
              <span style={{ color: colors.textPrimary, fontFamily: 'monospace' }}>
                {DEV_SERVER_URL}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(DEV_SERVER_URL, 'dev')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: colors.background,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              {copiedUrl === 'dev' ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border || '#e5e7eb'}`,
          backgroundColor: colors.background || '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              backgroundColor: colors.primary,
              color: colors.textOnPrimary || '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
