import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  HardDrive, 
  FileText, 
  Mail, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  X, 
  ExternalLink, 
  Search, 
  BookOpen, 
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { OfflineDocument } from '../types';
import { useOfflineDocuments } from '../hooks/useOfflineDocuments';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
  onOpenCv?: (cvId: string) => void;
}

export const OfflineDocumentsModal: React.FC<OfflineDocumentsModalProps> = ({
  isOpen,
  onClose,
  colors,
  onOpenCv
}) => {
  const { offlineDocs, removeDoc, isLoading } = useOfflineDocuments();
  const isOnline = useOnlineStatus();
  
  const [selectedDoc, setSelectedDoc] = useState<OfflineDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'cv' | 'cover_letter'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCopy = (doc: OfflineDocument) => {
    navigator.clipboard.writeText(doc.content);
    setCopiedId(doc.id);
    showToast(`Texto de "${doc.title}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = (doc: OfflineDocument) => {
    const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_offline.txt`;
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Download de "${filename}" iniciado!`);
  };

  const handleRemove = async (doc: OfflineDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Remover "${doc.title}" do armazenamento offline local (IndexedDB)?`)) {
      await removeDoc(doc.id);
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
      }
      showToast(`Documento "${doc.title}" removido do cache offline.`);
    }
  };

  const filteredDocs = offlineDocs.filter(doc => {
    if (activeTab === 'cv' && doc.type !== 'cv') return false;
    if (activeTab === 'cover_letter' && doc.type !== 'cover_letter') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
  });

  const totalBytes = offlineDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const formattedSize = totalBytes > 1024 * 1024 
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalBytes / 1024).toFixed(1)} KB`;

  const cvCount = offlineDocs.filter(d => d.type === 'cv').length;
  const letterCount = offlineDocs.filter(d => d.type === 'cover_letter').length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 4000,
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
        maxWidth: '880px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(136, 19, 55, 0.2)',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
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
              <HardDrive size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: colors.textPrimary }}>
                  Leitura Offline (IndexedDB & Service Worker)
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
                  {isOnline ? 'Online (Pronto para trânsito)' : 'Modo Offline Ativo'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                Seus currículos e cartas salvos no navegador permanecem 100% disponíveis mesmo sem internet.
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
            title="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Toast Banner */}
        {feedbackMsg && (
          <div style={{
            backgroundColor: '#065f46',
            color: '#ffffff',
            padding: '8px 18px',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Detail Reader View OR Master List View */}
        {selectedDoc ? (
          /* Detailed Reader View */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 20px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: `1px solid ${colors.border}`,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                <span>Voltar à lista de documentos</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedDoc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: copiedId === selectedDoc.id ? '#10b981' : colors.surface,
                    color: copiedId === selectedDoc.id ? '#ffffff' : colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Copiar todo o conteúdo do documento para a área de transferência"
                >
                  {copiedId === selectedDoc.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === selectedDoc.id ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadTxt(selectedDoc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Baixar arquivo de texto .txt para o dispositivo"
                >
                  <Download size={14} />
                  <span>Baixar .TXT</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleRemove(selectedDoc, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Excluir este documento do armazenamento local"
                >
                  <Trash2 size={14} />
                  <span>Remover Offline</span>
                </button>
              </div>
            </div>

            {/* Document Reader Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '22px 24px',
              backgroundColor: colors.background,
            }}>
              <div style={{
                maxWidth: '720px',
                margin: '0 auto',
                backgroundColor: colors.surface,
                padding: '26px 30px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: selectedDoc.type === 'cv' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: selectedDoc.type === 'cv' ? '#3b82f6' : '#a855f7'
                  }}>
                    {selectedDoc.type === 'cv' ? '📄 CURRÍCULO' : '✉️ CARTA DE APRESENTAÇÃO'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    Salvo em {new Date(selectedDoc.savedAt).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '11.5px', color: colors.textSecondary }}>
                    • {selectedDoc.content.length} caracteres
                  </span>
                </div>

                <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800, color: colors.textPrimary }}>
                  {selectedDoc.title}
                </h2>

                {/* Additional Metadata if available */}
                {selectedDoc.metadata?.yearsOfExperience !== undefined && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: colors.primaryLight,
                    fontSize: '12px',
                    color: colors.textPrimary,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <span><strong>Experiência:</strong> {selectedDoc.metadata.yearsOfExperience} ano(s)</span>
                    {selectedDoc.metadata.technicalSkills && selectedDoc.metadata.technicalSkills.length > 0 && (
                      <span><strong>Skills:</strong> {selectedDoc.metadata.technicalSkills.slice(0, 5).join(', ')}</span>
                    )}
                  </div>
                )}

                {/* Text Content */}
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: '13.5px',
                  lineHeight: '1.65',
                  color: colors.textPrimary,
                  margin: 0,
                }}>
                  {selectedDoc.content}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* Master List View */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Toolbar: Stats, Tabs and Search */}
            <div style={{
              padding: '14px 22px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.primaryLight,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Storage Stats Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: colors.textSecondary }}>
                  <span>💾 <strong>{offlineDocs.length}</strong> documento{offlineDocs.length !== 1 ? 's' : ''} indexado{offlineDocs.length !== 1 ? 's' : ''}</span>
                  <span>📦 <strong>{formattedSize}</strong> consumidos no IndexedDB</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Pronto para uso sem conexão</span>
                </div>
              </div>

              {/* Tabs & Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: activeTab === 'all' ? colors.primary : colors.surface,
                      color: activeTab === 'all' ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    Todos ({offlineDocs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cv')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: activeTab === 'cv' ? colors.primary : colors.surface,
                      color: activeTab === 'cv' ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    📄 Currículos ({cvCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cover_letter')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: activeTab === 'cover_letter' ? colors.primary : colors.surface,
                      color: activeTab === 'cover_letter' ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    ✉️ Cartas ({letterCount})
                  </button>
                </div>

                <div style={{
                  position: 'relative',
                  width: '260px',
                  maxWidth: '100%'
                }}>
                  <Search size={14} color={colors.textSecondary} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Filtrar offline..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 30px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Document List Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 22px',
              backgroundColor: colors.background
            }}>
              {filteredDocs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: colors.textSecondary
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    backgroundColor: colors.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    border: `1px solid ${colors.border}`
                  }}>
                    <BookOpen size={28} color={colors.textSecondary} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: colors.textPrimary }}>
                    {searchQuery ? 'Nenhum documento encontrado para a busca' : 'Nenhum documento salvo para leitura offline'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '440px', lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
                    {searchQuery 
                      ? 'Tente utilizar outras palavras-chave ou limpe o campo de busca.'
                      : 'Para salvar qualquer currículo ou carta, basta clicar no botão "Salvar para Leitura Offline" presente nos cards do Gerenciador de Currículos e no Histórico.'
                    }
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredDocs.map((doc) => {
                    const isCv = doc.type === 'cv';
                    const docSizeKb = ((doc.sizeBytes || 0) / 1024).toFixed(1);

                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '12px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: isCv ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                            color: isCv ? '#3b82f6' : '#a855f7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isCv ? <FileText size={18} /> : <Mail size={18} />}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong style={{
                                fontSize: '14px',
                                color: colors.textPrimary,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '400px'
                              }}>
                                {doc.title}
                              </strong>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: isCv ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: isCv ? '#3b82f6' : '#a855f7',
                                textTransform: 'uppercase'
                              }}>
                                {isCv ? 'Currículo' : 'Carta'}
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '11.5px',
                              color: colors.textSecondary,
                              marginTop: '3px'
                            }}>
                              <span>Salvo em {new Date(doc.savedAt).toLocaleDateString('pt-BR')}</span>
                              <span>•</span>
                              <span>{docSizeKb} KB</span>
                              <span>•</span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>Disponível Offline</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Item Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(doc);
                            }}
                            style={{
                              background: 'none',
                              border: `1px solid ${colors.border}`,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              color: copiedId === doc.id ? '#10b981' : colors.textSecondary,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600
                            }}
                            title="Copiar texto"
                          >
                            {copiedId === doc.id ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedId === doc.id ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(doc);
                            }}
                            style={{
                              backgroundColor: colors.primary,
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                            title="Ler documento completo"
                          >
                            <BookOpen size={13} />
                            <span>Ler</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleRemove(doc, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.7
                            }}
                            title="Remover do armazenamento offline"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
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
            ⚡ Sincronizado via <strong>Workbox 7 Service Worker</strong> & IndexedDB
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
