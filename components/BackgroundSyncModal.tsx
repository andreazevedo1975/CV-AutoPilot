import React, { useState } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  X, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  Zap,
  Trash2
} from 'lucide-react';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { backgroundSyncService } from '../services/backgroundSyncService';
import { OfflineMutation } from '../types';

interface BackgroundSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
}

export const BackgroundSyncModal: React.FC<BackgroundSyncModalProps> = ({
  isOpen,
  onClose,
  colors
}) => {
  const isOnline = useOnlineStatus();
  const { pendingMutations, isSyncing, syncNow, refreshPending } = useBackgroundSync();
  const [syncHistory, setSyncHistory] = useState<OfflineMutation[]>(() => 
    backgroundSyncService.getSyncHistory()
  );
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      showToast('Dispositivo sem conexão. A sincronização ocorrerá automaticamente assim que a rede voltar.');
      return;
    }
    const result = await syncNow();
    setSyncHistory(backgroundSyncService.getSyncHistory());
    showToast(`Sincronização concluída! ${result.syncedCount} item(s) atualizados.`);
  };

  const handleClearPending = () => {
    if (window.confirm('Deseja limpar a fila de alterações offline pendentes?')) {
      backgroundSyncService.clearPending();
      refreshPending();
      showToast('Fila de sincronização limpa.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 4500,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '18px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0
            }}>
              <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: colors.textPrimary }}>
                  Background Sync (Workbox 7)
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                  color: isOnline ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? 'Conexão Ativa' : 'Modo Offline (Em Trânsito)'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                Sincroniza automaticamente candidaturas e novos currículos assim que a internet retorna.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
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

        {/* Toast Feedback */}
        {toastMsg && (
          <div style={{
            backgroundColor: '#065f46',
            color: '#ffffff',
            padding: '8px 18px',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Explain Card */}
        <div style={{
          padding: '14px 22px',
          backgroundColor: colors.primaryLight,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: colors.textPrimary, flex: 1, minWidth: '280px' }}>
            <Zap size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>
              <strong>Fila Automática Workbox:</strong> Qualquer alteração de status de vaga ou criação de currículo feita sem internet é guardada em segurança e reconciliada automaticamente.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing || (!isOnline && pendingMutations.length === 0)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: isOnline ? '#10b981' : colors.surface,
                color: isOnline ? '#ffffff' : colors.textSecondary,
                border: `1px solid ${isOnline ? '#10b981' : colors.border}`,
                fontSize: '12px',
                fontWeight: 700,
                cursor: (isSyncing || (!isOnline && pendingMutations.length === 0)) ? 'not-allowed' : 'pointer',
                boxShadow: isOnline ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
              }}
              title="Disparar reconciliação imediata com o Service Worker"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </button>

            {pendingMutations.length > 0 && (
              <button
                type="button"
                onClick={handleClearPending}
                style={{
                  background: 'none',
                  border: `1px solid ${colors.border}`,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Limpar itens pendentes"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 22px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'pending' ? colors.primary : 'transparent',
              color: activeTab === 'pending' ? '#ffffff' : colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} />
            <span>Pendentes ({pendingMutations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'history' ? colors.primary : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={13} />
            <span>Sincronizados ({syncHistory.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 22px',
          backgroundColor: colors.background
        }}>
          {activeTab === 'pending' ? (
            pendingMutations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: colors.textSecondary
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  color: '#10b981'
                }}>
                  <ShieldCheck size={26} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: colors.textPrimary }}>
                  Tudo 100% Sincronizado
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '420px', lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
                  Não há alterações offline pendentes. Quando você atualizar o status de uma vaga ou criar currículos sem conexão, eles aparecerão aqui até a rede retornar.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingMutations.map((item) => {
                  const isApp = item.type.startsWith('APPLICATION');
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: isApp ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                          color: isApp ? '#3b82f6' : '#a855f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isApp ? <Briefcase size={17} /> : <FileText size={17} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                            {item.description}
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>● Aguardando rede</span>
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        whiteSpace: 'nowrap'
                      }}>
                        Aguardando Sync
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            syncHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textSecondary }}>
                <p style={{ margin: 0, fontSize: '13px' }}>Nenhum histórico de sincronização offline recente gravado.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {syncHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                          Sincronizado com sucesso em {item.syncedAt ? new Date(item.syncedAt).toLocaleString('pt-BR') : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      whiteSpace: 'nowrap'
                    }}>
                      Sincronizado
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: colors.textSecondary
        }}>
          <span>
            ⚡ Gerenciado por <strong>Workbox 7 BackgroundSync</strong> & Service Worker
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
