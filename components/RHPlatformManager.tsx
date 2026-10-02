import React, { useState, useContext } from 'react';
import { RHPlatformAccount, RHPlatformId } from '../types';
import { DEFAULT_RH_PLATFORMS } from '../constants/rhPlatforms';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ThemeContext } from '../App';
import { 
  CheckCircleIcon, 
  ExternalLinkIcon, 
  Copy, 
  Trash, 
  EyeIcon, 
  BuildingIcon,
  SearchIcon,
  Briefcase
} from './icons';

interface RHPlatformManagerProps {
  onPlatformsUpdated?: (platforms: RHPlatformAccount[]) => void;
  onNavigateToSearch?: (tab: 'candidates' | 'jobs') => void;
}

export const RHPlatformManager: React.FC<RHPlatformManagerProps> = ({
  onPlatformsUpdated,
  onNavigateToSearch,
}) => {
  const { colors, theme } = useContext(ThemeContext);

  const [platforms, setPlatforms] = useLocalStorage<RHPlatformAccount[]>(
    'rh_platform_accounts_v1',
    DEFAULT_RH_PLATFORMS
  );

  // Local state for editing credentials per card
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateField = (
    id: RHPlatformId, 
    field: keyof RHPlatformAccount, 
    value: any
  ) => {
    setPlatforms(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const newObj = { ...p, [field]: value };
        // If updating username or password, check hasCredentials
        if (field === 'usernameOrEmail' || field === 'password') {
          const user = field === 'usernameOrEmail' ? value : newObj.usernameOrEmail;
          const pass = field === 'password' ? value : newObj.password;
          newObj.hasCredentials = Boolean(user && user.trim() && pass && pass.trim());
          if (newObj.hasCredentials) {
            newObj.lastVerified = new Date().toISOString();
          }
        }
        return newObj;
      });
      if (onPlatformsUpdated) onPlatformsUpdated(updated);
      return updated;
    });
  };

  const handleToggleEnabled = (id: RHPlatformId) => {
    setPlatforms(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, enabledForSearch: !p.enabledForSearch } : p);
      if (onPlatformsUpdated) onPlatformsUpdated(updated);
      return updated;
    });
    showToast('Preferência de busca atualizada para o portal.');
  };

  const handleClearCredentials = (id: RHPlatformId, platformName: string) => {
    if (window.confirm(`Deseja remover as credenciais salvas para ${platformName}?`)) {
      setPlatforms(prev => {
        const updated = prev.map(p => {
          if (p.id !== id) return p;
          return {
            ...p,
            usernameOrEmail: '',
            password: '',
            hasCredentials: false,
            lastVerified: undefined,
          };
        });
        if (onPlatformsUpdated) onPlatformsUpdated(updated);
        return updated;
      });
      showToast(`Credenciais de ${platformName} removidas.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) {
      showToast(`Nenhum dado informado para copiar.`);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copiado para a área de transferência!`);
    });
  };

  const handleOpenLogin = (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Página oficial de login do ${name} aberta em nova aba.`);
  };

  const connectedCount = platforms.filter(p => p.hasCredentials).length;
  const activeSearchCount = platforms.filter(p => p.hasCredentials && p.enabledForSearch).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: colors.primary,
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <CheckCircleIcon style={{ width: '18px', height: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Header Card */}
      <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: colors.shadow || '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
                Central de Conexão com Portais de RH (Catho, Empregos, LinkedIn...)
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6', margin: 0 }}>
              Cadastre seu usuário e senha dos principais portais de recrutamento e carreira. O CV-AutoPilot utiliza suas credenciais salvas para <strong>direcionar buscas profundas em áreas restritas</strong>, desbloquear currículos de assinantes na <strong>Catho</strong> e <strong>Empregos.com.br</strong>, acessar candidaturas simplificadas no <strong>LinkedIn</strong> e gerar deep-links autenticados com 1-clique.
            </p>
          </div>

          {/* Metrics summary */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: colors.primary }}>
                {connectedCount} <span style={{ fontSize: '13px', color: colors.textSecondary }}>/ {platforms.length}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: colors.textSecondary }}>Portais com Credenciais</div>
            </div>
            <div style={{ width: '1px', backgroundColor: colors.border }} />
            <div style={{ textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>
                {activeSearchCount}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: colors.textSecondary }}>Ativos na Varredura</div>
            </div>
          </div>
        </div>

        {/* Security / LGPD Notice banner */}
        <div style={{
          marginTop: '20px',
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '13px',
          lineHeight: '1.5',
          color: theme === 'dark' ? '#93c5fd' : '#1e40af'
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>🛡️</span>
          <div>
            <strong>Garantia de Privacidade & Armazenamento Seguro no Navegador (LGPD):</strong>
            <div style={{ marginTop: '2px', opacity: 0.9 }}>
              Seus dados de login e senha ficam gravados estritamente na memória privada deste navegador (LocalStorage do seu dispositivo). O CV-AutoPilot não transfere suas senhas para servidores remotos externos. O sistema usa as contas configuradas para autenticar deep-links diretos e estruturar buscas de candidatos e vagas com filtros de assinante.
            </div>
          </div>
        </div>
      </div>

      {/* Platforms Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {platforms.map(platform => {
          const isShowPassword = Boolean(showPasswordMap[platform.id]);

          return (
            <div
              key={platform.id}
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${platform.hasCredentials ? platform.badgeColor : colors.border}`,
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: platform.hasCredentials 
                  ? `0 4px 16px ${platform.accentBg}` 
                  : (colors.shadow || '0 2px 6px rgba(0,0,0,0.03)'),
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: platform.accentBg,
                    border: `1.5px solid ${platform.badgeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '18px',
                    color: platform.badgeColor,
                  }}>
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
                        {platform.name}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: platform.hasCredentials 
                          ? (platform.enabledForSearch ? '#10b981' : '#f59e0b') 
                          : colors.border,
                        color: platform.hasCredentials ? '#ffffff' : colors.textSecondary
                      }}>
                        {platform.hasCredentials 
                          ? (platform.enabledForSearch ? 'Conectado & Ativo' : 'Pausado na Busca') 
                          : 'Sem Credencial'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>{platform.domain}</span>
                  </div>
                </div>

                {/* Open Official Login Button */}
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: 'transparent',
                    color: colors.textPrimary,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  title="Abrir página oficial de login do portal em nova aba"
                  onClick={() => handleOpenLogin(platform.loginUrl, platform.name)}
                >
                  <span>Entrar no Site</span>
                  <ExternalLinkIcon style={{ width: '12px', height: '12px' }} />
                </button>
              </div>

              {/* Description / Auth Notes */}
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary,
                lineHeight: '1.4',
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}>
                {platform.authNotes}
              </div>

              {/* Form Fields for Credentials */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Account Type Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: colors.textSecondary, marginBottom: '4px' }}>
                    Tipo de Conta / Perfil no Portal
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                    value={platform.accountType}
                    onChange={e => handleUpdateField(platform.id, 'accountType', e.target.value)}
                  >
                    <option value="Assinante VIP / Premium">Assinante VIP / Premium (Acesso Completo a CVs e Vagas)</option>
                    <option value="Recrutador / Empresa">Recrutador / Headhunter / Painel Empresarial</option>
                    <option value="Candidato">Candidato (Perfil Pessoal)</option>
                  </select>
                </div>

                {/* Username / Email */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: colors.textSecondary }}>
                      E-mail, Usuário ou CPF Cadastrado
                    </label>
                    {platform.usernameOrEmail && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.primary,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: '600'
                        }}
                        onClick={() => handleCopy(platform.usernameOrEmail, `E-mail de ${platform.name}`)}
                      >
                        <Copy style={{ width: '10px', height: '10px' }} />
                        Copiar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder={`Seu login na ${platform.name} (ex: usuario@email.com)`}
                    value={platform.usernameOrEmail}
                    onChange={e => handleUpdateField(platform.id, 'usernameOrEmail', e.target.value)}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: colors.textSecondary }}>
                      Senha de Acesso ao Portal
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.textSecondary,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: '600'
                        }}
                        onClick={() => toggleShowPassword(platform.id)}
                      >
                        <EyeIcon style={{ width: '11px', height: '11px' }} />
                        {isShowPassword ? 'Ocultar' : 'Exibir'}
                      </button>
                      {platform.password && (
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: colors.primary,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: '600'
                          }}
                          onClick={() => handleCopy(platform.password, `Senha de ${platform.name}`)}
                        >
                          <Copy style={{ width: '10px', height: '10px' }} />
                          Copiar
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type={isShowPassword ? 'text' : 'password'}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder={`Senha cadastrada no portal ${platform.name}`}
                    value={platform.password}
                    onChange={e => handleUpdateField(platform.id, 'password', e.target.value)}
                  />
                </div>
              </div>

              {/* Toggle Enable for Automated Search */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: `1px solid ${colors.border}`
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={platform.enabledForSearch}
                    onChange={() => handleToggleEnabled(platform.id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>Incluir nas buscas de Vagas e Candidatos</span>
                </label>

                {platform.hasCredentials && (
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => handleClearCredentials(platform.id, platform.name)}
                    title="Remover credencial salva"
                  >
                    <Trash style={{ width: '13px', height: '13px' }} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              {/* Status footer message */}
              {platform.hasCredentials && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
                  <CheckCircleIcon style={{ width: '12px', height: '12px' }} />
                  <span>Pronto para varredura autenticada com conta {platform.accountType}.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: colors.textPrimary }}>
            Tudo configurado para iniciar a prospecção?
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
            Com suas contas configuradas, realize buscas no radar local com prioridade para Catho, Empregos e LinkedIn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToSearch && (
            <>
              <button
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={() => onNavigateToSearch('candidates')}
              >
                <SearchIcon style={{ width: '16px', height: '16px' }} />
                <span>Buscar Candidatos nos Portais</span>
              </button>

              <button
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => onNavigateToSearch('jobs')}
              >
                <Briefcase />
                <span>Buscar Vagas nos Portais</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
