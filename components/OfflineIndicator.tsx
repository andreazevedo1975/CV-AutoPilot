import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, X, BookOpen, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useBackgroundSync } from '../hooks/useBackgroundSync';

interface OfflineIndicatorProps {
  onOpenOfflineDocs?: () => void;
  onOpenSyncQueue?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenOfflineDocs, onOpenSyncQueue }) => {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing, lastSyncSummary } = useBackgroundSync();
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissed(false);
    } else if (wasOffline) {
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Mensagem de retorno da conexão com sincronização em segundo plano
  if (showRestoredNotice) {
    return (
      <div 
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#065f46',
          color: '#ffffff',
          padding: '11px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.3)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          fontSize: '13px',
          fontWeight: 600,
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        <CheckCircle2 size={18} color="#34d399" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span>Conexão restabelecida • Modo Online Ativo</span>
          {lastSyncSummary && lastSyncSummary.syncedCount > 0 && (
            <span style={{ fontSize: '11px', color: '#a7f3d0' }}>
              ⚡ Background Sync (Workbox): {lastSyncSummary.syncedCount} alteração(ões) sincronizada(s) automaticamente!
            </span>
          )}
        </div>
      </div>
    );
  }

  // Notificação de modo offline com indicador de Background Sync
  if (!isOnline && !isDismissed) {
    return (
      <div 
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(24, 24, 27, 0.96)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '14px',
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          fontSize: '12.5px',
          maxWidth: '94vw',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <WifiOff size={18} color="#f59e0b" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#f59e0b' }}>Modo Offline Ativo (Em Trânsito)</span>
            <span style={{ 
              fontSize: '10px', 
              padding: '1px 5px', 
              borderRadius: '4px', 
              backgroundColor: 'rgba(245, 158, 11, 0.2)', 
              color: '#fbbf24', 
              fontWeight: 700 
            }}>
              Workbox Background Sync
            </span>
            {pendingCount > 0 && (
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span style={{ color: '#d1d5db', fontSize: '11.5px', lineHeight: 1.3 }}>
            {pendingCount > 0 
              ? `${pendingCount} alteração(ões) gravada(s) offline. Serão sincronizadas automaticamente quando a rede voltar.`
              : 'Seus currículos e histórico estão disponíveis para consulta local mesmo sem internet estável.'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {onOpenSyncQueue && pendingCount > 0 && (
            <button
              type="button"
              onClick={onOpenSyncQueue}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Ver alterações aguardando retorno de conexão"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>Ver Fila ({pendingCount})</span>
            </button>
          )}

          {onOpenOfflineDocs && (
            <button
              type="button"
              onClick={onOpenOfflineDocs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#f59e0b',
                color: '#000000',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <BookOpen size={13} />
              <span>Docs Salvos</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px',
            borderRadius: '6px',
          }}
          title="Dispensar aviso"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
};
