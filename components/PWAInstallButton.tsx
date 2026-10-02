import React, { useState } from 'react';
import { DownloadCloud, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  colors: any;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ colors, compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Se já estiver em modo standalone / PWA instalado, não precisa exibir
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow com evento nativo interceptado
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '5px 10px' : '7px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: compact ? '11px' : '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
        }}
        title="Instalar CV-AutoPilot no dispositivo (PWA com acesso offline total)"
      >
        <DownloadCloud size={compact ? 13 : 15} />
        <span>{compact ? 'Instalar App' : 'Instalar Aplicativo (PWA)'}</span>
      </button>
    );
  }

  // iOS Safari flow (instrução guiada com Add to Home Screen)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: compact ? '5px 10px' : '7px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: compact ? '11px' : '12px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="Como instalar no iPhone ou iPad"
        >
          <Smartphone size={compact ? 13 : 15} />
          <span>{compact ? 'Instalar no iOS' : 'Instalar no iPhone / iPad'}</span>
        </button>

        {showIOSGuide && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}>
            <div style={{
              backgroundColor: colors.surface,
              borderRadius: '16px',
              maxWidth: '380px',
              width: '100%',
              padding: '22px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Instalar no iOS (Safari)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  Para ter acesso offline direto da tela de início do seu iPhone ou iPad:
                </p>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li style={{ marginBottom: '8px' }}>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com seta para cima) na barra inferior do Safari.</li>
                  <li style={{ marginBottom: '8px' }}>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                style={{
                  marginTop: '18px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
