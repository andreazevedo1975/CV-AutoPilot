// CV Backup & Data Safety Configuration Modal
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cloud, 
  HardDrive, 
  Layers, 
  Clock, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Database,
  ArrowDownToLine,
  FileCheck2,
  Sliders,
  X
} from 'lucide-react';
import { CV } from '../types';
import { 
  cvBackupService, 
  BackupConfig, 
  BackupSnapshot, 
  BackupDestination 
} from '../services/cvBackupService';

interface CVBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvs: CV[];
  analysisResults: Record<string, string>;
  onRestore: (restoredCvs: CV[], restoredAnalysis: Record<string, string>) => void;
  colors: any;
  onShowToast: (msg: string) => void;
}

export const CVBackupModal: React.FC<CVBackupModalProps> = ({
  isOpen,
  onClose,
  cvs,
  analysisResults,
  onRestore,
  colors,
  onShowToast,
}) => {
  const [config, setConfig] = useState<BackupConfig>(cvBackupService.getConfig());
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isBackingUpNow, setIsBackingUpNow] = useState(false);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [storageEstimate, setStorageEstimate] = useState<{ quotaMB: number; usageMB: number; percent: number }>({ quotaMB: 0, usageMB: 0, percent: 0 });
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load snapshots and storage status on modal open
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingSnapshots(true);
    try {
      const currentConfig = cvBackupService.getConfig();
      setConfig(currentConfig);

      const items = await cvBackupService.getAllSnapshots();
      setSnapshots(items);

      const persisted = await cvBackupService.checkPersistence();
      setIsPersisted(persisted);

      const estimate = await cvBackupService.getStorageEstimate();
      setStorageEstimate(estimate);
    } catch (err) {
      console.error('Erro ao carregar dados de backup:', err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleUpdateConfig = (updates: Partial<BackupConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    cvBackupService.saveConfig(updated);
    setFeedbackMessage({ type: 'success', text: 'Preferências de backup salvas com sucesso!' });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleRequestPersistence = async () => {
    const success = await cvBackupService.requestPersistentStorage();
    setIsPersisted(success);
    if (success) {
      setFeedbackMessage({ type: 'success', text: '✓ Persistência de dados ativada no navegador! Seus dados não serão removidos em limpeza de cache.' });
    } else {
      setFeedbackMessage({ type: 'info', text: 'O navegador já gerencia o armazenamento ou não requer permissão adicional.' });
    }
  };

  const handleManualBackupNow = async () => {
    setIsBackingUpNow(true);
    try {
      const snapshot = await cvBackupService.performBackup(cvs, analysisResults, 'manual', config);
      if (snapshot) {
        const items = await cvBackupService.getAllSnapshots();
        setSnapshots(items);
        setConfig(cvBackupService.getConfig());
        setFeedbackMessage({ type: 'success', text: `✓ Backup realizado com sucesso! ${cvs.length} currículo(s) seguro(s).` });
        onShowToast(`Backup de ${cvs.length} currículo(s) salvo com sucesso!`);
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha ao realizar backup: ' + (err.message || 'Erro desconhecido') });
    } finally {
      setIsBackingUpNow(false);
    }
  };

  const handleRestoreSnapshot = (snapshot: BackupSnapshot) => {
    try {
      onRestore(snapshot.cvs, snapshot.analysisResults);
      setConfirmRestoreId(null);
      setFeedbackMessage({ 
        type: 'success', 
        text: `✓ ${snapshot.cvCount} currículo(s) restaurado(s) com sucesso a partir do backup de ${new Date(snapshot.timestamp).toLocaleString('pt-BR')}!` 
      });
      onShowToast(`Restauração concluída: ${snapshot.cvCount} currículo(s) recuperado(s).`);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Erro ao restaurar backup: ' + err.message });
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await cvBackupService.deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      setFeedbackMessage({ type: 'info', text: 'Snapshot de backup removido.' });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Erro ao excluir snapshot: ' + err.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = cvBackupService.parseBackupFile(content);
        onRestore(parsed.cvs, parsed.analysisResults);
        setFeedbackMessage({ 
          type: 'success', 
          text: `✓ Arquivo de backup restaurado com sucesso! ${parsed.cvs.length} currículo(s) importados.` 
        });
        onShowToast(`Backup restaurado do arquivo com sucesso! (${parsed.cvs.length} CVs)`);
        loadData();
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: 'Erro ao processar arquivo: ' + err.message });
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  if (!isOpen) return null;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Nenhum backup realizado ainda';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDestinationLabel = (dest: BackupDestination) => {
    switch (dest) {
      case 'indexeddb': return 'Armazenamento Local (IndexedDB)';
      case 'cloud_storage': return 'Nuvem do Navegador (Web Cloud)';
      case 'both': return 'Ambos (Local + Nuvem do Navegador)';
      default: return dest;
    }
  };

  return (
    <div 
      className="responsive-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100,
        padding: '12px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div 
        className="responsive-modal-container"
        style={{
          backgroundColor: colors.surface || '#ffffff',
          color: colors.textPrimary || '#1f2937',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
          border: `1px solid ${colors.border || '#e5e7eb'}`,
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border || '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.background || '#f9fafb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary || '#881337',
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.01em', color: colors.textPrimary }}>
                Configuração de Backup Automático & Segurança dos Dados
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary || '#6b7280' }}>
                Proteção contínua dos seus currículos processados no armazenamento local ou nuvem do navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary || '#6b7280',
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
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}>
          {/* Feedback Banner */}
          {feedbackMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: feedbackMessage.type === 'success' 
                ? 'rgba(16, 185, 129, 0.12)' 
                : feedbackMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(59, 130, 246, 0.12)',
              color: feedbackMessage.type === 'success' 
                ? (colors.success || '#059669') 
                : feedbackMessage.type === 'error' 
                ? (colors.notification || '#dc2626') 
                : '#2563eb',
              border: `1px solid ${
                feedbackMessage.type === 'success' 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : feedbackMessage.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(59, 130, 246, 0.3)'
              }`,
            }}>
              {feedbackMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Quick Status Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}>
            {/* Status Card */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: colors.background || '#f9fafb',
              border: `1px solid ${colors.border || '#e5e7eb'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
                Status do Backup
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: config.enabled ? '#10b981' : '#ef4444',
                  boxShadow: config.enabled ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                }} />
                <strong style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {config.enabled ? 'Ativo e Protegendo' : 'Desativado'}
                </strong>
              </div>
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                {config.enabled ? `${cvs.length} currículo(s) monitorados` : 'Backup automático pausado'}
              </span>
            </div>

            {/* Last Backup Card */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: colors.background || '#f9fafb',
              border: `1px solid ${colors.border || '#e5e7eb'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
                Último Ponto de Restauração
              </span>
              <strong style={{ fontSize: '14px', color: colors.textPrimary }}>
                {config.lastBackupTimestamp ? new Date(config.lastBackupTimestamp).toLocaleDateString('pt-BR') : 'Nenhum'}
              </strong>
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                {config.lastBackupTimestamp ? 'às ' + new Date(config.lastBackupTimestamp).toLocaleTimeString('pt-BR') : 'Execute o primeiro backup'}
              </span>
            </div>

            {/* Security & Persistence Card */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: colors.background || '#f9fafb',
              border: `1px solid ${colors.border || '#e5e7eb'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
                Persistência do Navegador
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} color={isPersisted ? '#10b981' : colors.primary} />
                <strong style={{ fontSize: '14px', color: isPersisted ? '#10b981' : colors.textPrimary }}>
                  {isPersisted ? 'Blindado (Persistente)' : 'Padrão do Navegador'}
                </strong>
              </div>
              {!isPersisted && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.primary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    textDecoration: 'underline',
                  }}
                >
                  Blindar armazenamento contra limpeza
                </button>
              )}
              {isPersisted && (
                <span style={{ fontSize: '11px', color: '#10b981' }}>
                  Protegido contra limpeza de cache do disco
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Configuration Options */}
          <div style={{
            padding: '18px 20px',
            borderRadius: '14px',
            backgroundColor: colors.background || '#f9fafb',
            border: `1px solid ${colors.border || '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Parâmetros de Backup Automático
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                  Configure quando e onde as cópias de segurança serão salvas
                </p>
              </div>

              {/* Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: config.enabled ? colors.primary : colors.textSecondary }}>
                  {config.enabled ? 'Backup Ativado' : 'Backup Desativado'}
                </span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '46px',
                  height: '24px',
                  backgroundColor: config.enabled ? colors.primary : '#d1d5db',
                  borderRadius: '14px',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '3px',
                    left: config.enabled ? '25px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  }} />
                </div>
              </label>
            </div>

            {/* Destination Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: colors.textPrimary }}>
                Destino do Armazenamento de Segurança:
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '10px',
              }}>
                {/* Option 1: IndexedDB */}
                <div
                  onClick={() => handleUpdateConfig({ destination: 'indexeddb' })}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: config.destination === 'indexeddb' 
                      ? `2px solid ${colors.primary}` 
                      : `1px solid ${colors.border || '#e5e7eb'}`,
                    backgroundColor: config.destination === 'indexeddb'
                      ? (colors.primaryLight || 'rgba(136, 19, 55, 0.06)')
                      : colors.surface,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <HardDrive size={18} color={config.destination === 'indexeddb' ? colors.primary : colors.textSecondary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: colors.textPrimary }}>
                      Armazenamento Local (IndexedDB)
                    </strong>
                    <span style={{ fontSize: '11px', color: colors.textSecondary, lineHeight: 1.3, display: 'block' }}>
                      Banco de dados nativo no navegador com cota expandida e resistência a quedas.
                    </span>
                  </div>
                </div>

                {/* Option 2: Browser Cloud */}
                <div
                  onClick={() => handleUpdateConfig({ destination: 'cloud_storage' })}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: config.destination === 'cloud_storage' 
                      ? `2px solid ${colors.primary}` 
                      : `1px solid ${colors.border || '#e5e7eb'}`,
                    backgroundColor: config.destination === 'cloud_storage'
                      ? (colors.primaryLight || 'rgba(136, 19, 55, 0.06)')
                      : colors.surface,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Cloud size={18} color={config.destination === 'cloud_storage' ? colors.primary : colors.textSecondary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: colors.textPrimary }}>
                      Nuvem do Navegador (Web Cloud)
                    </strong>
                    <span style={{ fontSize: '11px', color: colors.textSecondary, lineHeight: 1.3, display: 'block' }}>
                      Partição isolada no armazenamento web com checksum de verificação de integridade.
                    </span>
                  </div>
                </div>

                {/* Option 3: Both */}
                <div
                  onClick={() => handleUpdateConfig({ destination: 'both' })}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: config.destination === 'both' 
                      ? `2px solid ${colors.primary}` 
                      : `1px solid ${colors.border || '#e5e7eb'}`,
                    backgroundColor: config.destination === 'both'
                      ? (colors.primaryLight || 'rgba(136, 19, 55, 0.06)')
                      : colors.surface,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Layers size={18} color={config.destination === 'both' ? colors.primary : colors.textSecondary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: colors.textPrimary }}>
                      Ambos (Local + Nuvem) <span style={{ color: colors.primary, fontSize: '11px' }}>★ Recomendado</span>
                    </strong>
                    <span style={{ fontSize: '11px', color: colors.textSecondary, lineHeight: 1.3, display: 'block' }}>
                      Máxima redundância com espelhamento simultâneo nos dois destinos do navegador.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger Frequency & Retention */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}>
              {/* Trigger Frequency */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: colors.textPrimary }}>
                  Frequência / Gatilho de Execução:
                </label>
                <select
                  value={config.intervalMinutes}
                  onChange={(e) => handleUpdateConfig({ intervalMinutes: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border || '#e5e7eb'}`,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value={0}>Imediato (ao processar, salvar ou auditar currículo)</option>
                  <option value={5}>A cada 5 minutos</option>
                  <option value={15}>A cada 15 minutos</option>
                  <option value={60}>A cada 1 hora</option>
                </select>
                <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px', display: 'block' }}>
                  {config.intervalMinutes === 0 
                    ? '✓ Salva um snapshot instantâneo sempre que a lista de currículos for atualizada.' 
                    : `Gera backup em segundo plano a cada ${config.intervalMinutes} minutos.`}
                </span>
              </div>

              {/* Retention Limit */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: colors.textPrimary }}>
                  Retenção de Versões Históricas:
                </label>
                <select
                  value={config.retentionLimit}
                  onChange={(e) => handleUpdateConfig({ retentionLimit: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border || '#e5e7eb'}`,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value={5}>Manter os últimos 5 backups</option>
                  <option value={10}>Manter os últimos 10 backups (Recomendado)</option>
                  <option value={20}>Manter os últimos 20 backups</option>
                </select>
                <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px', display: 'block' }}>
                  Backups excedentes mais antigos são podados automaticamente para economizar espaço.
                </span>
              </div>
            </div>

            {/* Additional Safety Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textPrimary, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.backupOnBeforeUnload}
                  onChange={(e) => handleUpdateConfig({ backupOnBeforeUnload: e.target.checked })}
                  style={{ accentColor: colors.primary }}
                />
                <span>Executar salvaguarda automática antes de fechar ou recarregar a aba do navegador</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textPrimary, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.autoDownloadJson}
                  onChange={(e) => handleUpdateConfig({ autoDownloadJson: e.target.checked })}
                  style={{ accentColor: colors.primary }}
                />
                <span>Baixar arquivo .JSON de backup adicional no computador ao disparar backup manual</span>
              </label>
            </div>
          </div>

          {/* Section 2: Immediate Actions (Execute Now, Export JSON, Import File) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.05)',
            border: `1px solid ${colors.primary || '#881337'}`,
          }}>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: colors.textPrimary }}>
                Ações Imediatas de Proteção
              </strong>
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                Dispare um backup agora ou faça portabilidade através de arquivos .JSON
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Trigger Backup Now */}
              <button
                type="button"
                onClick={handleManualBackupNow}
                disabled={isBackingUpNow}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: colors.primary,
                  color: colors.textOnPrimary || '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isBackingUpNow ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(136, 19, 55, 0.25)',
                }}
              >
                <RefreshCw size={14} className={isBackingUpNow ? 'animate-spin' : ''} />
                <span>{isBackingUpNow ? 'Criando Backup...' : 'Executar Backup Agora'}</span>
              </button>

              {/* Upload JSON Backup */}
              <label
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border || '#e5e7eb'}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Restaurar de arquivo .JSON salvo anteriormente"
              >
                <Upload size={14} />
                <span>Restaurar de Arquivo (.JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Download Latest Snapshot */}
              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => cvBackupService.downloadSnapshotJson(snapshots[0])}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border || '#e5e7eb'}`,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Baixar cópia do snapshot mais recente em arquivo .JSON"
                >
                  <Download size={14} />
                  <span>Baixar Arquivo (.JSON)</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: History of Snapshots & Restore */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Histórico de Pontos de Restauração Salvos ({snapshots.length})
                </h3>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Restaurar um ponto sobrescreverá a lista ativa com os dados daquela data
                </span>
              </div>

              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Deseja realmente limpar todo o histórico de backups salvos no navegador?')) {
                      await cvBackupService.clearAllSnapshots();
                      setSnapshots([]);
                      setFeedbackMessage({ type: 'info', text: 'Histórico de backups limpo.' });
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.notification || '#dc2626',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={13} /> Limpar Histórico
                </button>
              )}
            </div>

            {isLoadingSnapshots ? (
              <div style={{ textAlign: 'center', padding: '30px', color: colors.textSecondary }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Carregando histórico do armazenamento...</p>
              </div>
            ) : snapshots.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 20px',
                borderRadius: '12px',
                border: `1px dashed ${colors.border || '#e5e7eb'}`,
                color: colors.textSecondary,
              }}>
                <Database size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                  Nenhum ponto de restauração gravado ainda
                </p>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Clique no botão "Executar Backup Agora" acima para gerar o primeiro snapshot de segurança.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '280px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}>
                {snapshots.map((snap, idx) => {
                  const isConfirming = confirmRestoreId === snap.id;
                  const isLatest = idx === 0;

                  return (
                    <div
                      key={snap.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: isLatest ? (colors.primaryLight || 'rgba(136, 19, 55, 0.04)') : colors.surface,
                        border: isLatest ? `1px solid ${colors.primary}` : `1px solid ${colors.border || '#e5e7eb'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: colors.background || '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.primary,
                        }}>
                          <FileCheck2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                              {formatDate(snap.timestamp)}
                            </strong>
                            {isLatest && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                backgroundColor: colors.primary,
                                color: colors.textOnPrimary || '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}>
                                Mais Recente
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {snap.cvCount} currículo(s) • {formatBytes(snap.totalBytes)} • {getDestinationLabel(snap.destination)} • Gatilho: {snap.trigger === 'auto_change' ? 'Alteração' : snap.trigger === 'auto_interval' ? 'Intervalo' : snap.trigger === 'before_unload' ? 'Saída' : 'Manual'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.notification || '#dc2626' }}>
                              Confirmar?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRestoreSnapshot(snap)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: colors.success || '#059669',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Sim, Restaurar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(null)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: colors.background,
                                color: colors.textSecondary,
                                border: `1px solid ${colors.border || '#e5e7eb'}`,
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(snap.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: colors.surface,
                                color: colors.primary,
                                border: `1px solid ${colors.primary}`,
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Restaurar este ponto de backup"
                            >
                              <ArrowDownToLine size={13} />
                              <span>Restaurar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => cvBackupService.downloadSnapshotJson(snap)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: colors.surface,
                                color: colors.textSecondary,
                                border: `1px solid ${colors.border || '#e5e7eb'}`,
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                              title="Baixar snapshot como arquivo .JSON"
                            >
                              <Download size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshot(snap.id)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: colors.surface,
                                color: colors.notification || '#dc2626',
                                border: `1px solid ${colors.border || '#e5e7eb'}`,
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                              title="Excluir este ponto de restauração"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy & LGPD Guarantee Footer */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: colors.background || '#f9fafb',
            border: `1px solid ${colors.border || '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: colors.textSecondary,
          }}>
            <Lock size={16} color={colors.primary} style={{ flexShrink: 0 }} />
            <span>
              <strong>Garantia de Privacidade e Segurança dos Dados (LGPD):</strong> Seus currículos e análises são armazenados localmente e na nuvem segura do seu navegador com integridade verificada. Nenhum dado é transferido a servidores externos sem o seu comando explícito.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border || '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: colors.background || '#f9fafb',
          gap: '10px',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              backgroundColor: colors.primary,
              color: colors.textOnPrimary || '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(136, 19, 55, 0.25)',
            }}
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
