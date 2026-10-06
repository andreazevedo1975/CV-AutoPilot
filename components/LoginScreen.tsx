// components/LoginScreen.tsx - Tela Executiva de Login com 10 Contas de Teste, Renovação Inteligente por IP e Gestão Segura de Senha do Administrador (Ciclo 3 Meses)
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { ThemeContext } from '../ThemeContext';
import { 
  AuthService, 
  ADMIN_EMAIL, 
  DEFAULT_TEST_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  TEST_ACCOUNTS,
  NetworkTrialStatus,
  ADMIN_PASSWORD_EXPIRY_DAYS,
  AdminPasswordInfo
} from '../services/authService';
import { AuthUser, ExternalNetworkInfo, TestLoginAccount } from '../types';
import { DevIALogo } from './DevIALogo';
import { ExternalAccessModal } from './ExternalAccessModal';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Globe, 
  Wifi, 
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  RotateCcw,
  Zap,
  Info,
  Server,
  X,
  Calendar,
  ShieldAlert,
  Edit3,
  HelpCircle,
  Copy,
  Check,
  Share2
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  onClose?: () => void;
}

const LOGO_SRC = "/src/assets/images/cv_autopilot_logo_1789832318438.jpg";

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onClose }) => {
  const { colors, theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Identificação da Rede Externa e Simulação para Testes
  const [networkInfo, setNetworkInfo] = useState<ExternalNetworkInfo | null>(null);
  const [activeIp, setActiveIp] = useState<string>(() => AuthService.getDetectedNetworkIpSync());
  const [showLabPanel, setShowLabPanel] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'1-5' | '6-10'>('1-5');

  // Trigger para recarregar status após ações
  const [statusUpdateTick, setStatusUpdateTick] = useState(0);

  // Estado da Senha do Administrador (Ciclo de 3 meses / 90 dias)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);
  const [showCurrentPassToggle, setShowCurrentPassToggle] = useState(false);
  const [showNewPassToggle, setShowNewPassToggle] = useState(false);

  // Estado para Recuperação de Senha do Administrador (Esqueci a Senha)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassToggle, setShowRecoveryPassToggle] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [recoveryErrorMsg, setRecoveryErrorMsg] = useState<string | null>(null);
  const [revealedCurrentPassword, setRevealedCurrentPassword] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Estado do Modal de URL de Acesso Externo
  const [showExternalAccessModal, setShowExternalAccessModal] = useState(false);

  const handleGuestLogin = () => {
    const guestUser = AuthService.createGuestUser();
    setSuccessNotice("Entrando como Visitante Convidado (Acesso Livre via Link)...");
    setTimeout(() => {
      onLoginSuccess(guestUser);
    }, 350);
  };

  useEffect(() => {
    let isMounted = true;
    AuthService.detectExternalNetwork().then((info) => {
      if (isMounted) {
        setNetworkInfo(info);
        setActiveIp(info.ip);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [statusUpdateTick]);

  // Informações de validade da senha do administrador (90 dias)
  const adminPasswordInfo: AdminPasswordInfo = useMemo(() => {
    return AuthService.getAdminPasswordInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusUpdateTick]);

  // Status consolidado de todas as 10 contas de teste
  const accountsWithStatus = useMemo(() => {
    return TEST_ACCOUNTS.map(acc => {
      const status = AuthService.getTestAccountStatus(acc.id, activeIp);
      return {
        ...acc,
        status
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIp, statusUpdateTick]);

  // Status da conta atualmente digitada ou selecionada
  const currentInputStatus = useMemo(() => {
    const found = AuthService.findTestAccount(email);
    if (!found) return null;
    return AuthService.getTestAccountStatus(found.id, activeIp);
  }, [email, activeIp, statusUpdateTick]);

  const isAdminSelected = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validação estrita para o Administrador: Senha NUNCA pode ser vazia e deve ser digitada manualmente
    if (isAdminSelected) {
      if (!password.trim()) {
        setErrorMessage('A senha de Administrador deve ser digitada manualmente. O preenchimento automático está desativado por governança de segurança.');
        passwordInputRef.current?.focus();
        return;
      }

      // Se a senha estiver expirada (mais de 3 meses / 90 dias), bloqueia e abre o modal de troca
      if (adminPasswordInfo.isExpired) {
        setErrorMessage('A sua senha de Administrador expirou porque atingiu o limite de validade de 3 meses (90 dias). Por política de segurança, é obrigatório cadastrar uma nova senha para entrar.');
        setShowChangePasswordModal(true);
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      const result = AuthService.login(email, password, activeIp);
      setLoading(false);

      if (result.success && result.user) {
        if (result.isRenewed) {
          // Exibir breve confirmação antes de redirecionar
          setSuccessNotice(`🎉 Login de teste renovado com sucesso para o novo IP (${activeIp})! Concedido novo ciclo de 7 dias.`);
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 1200);
        } else {
          onLoginSuccess(result.user);
        }
      } else {
        if (result.isPasswordExpired) {
          setShowChangePasswordModal(true);
        }
        setErrorMessage(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    }, 350);
  };

  // Preenchimento de credenciais:
  // REGRA CRÍTICA: Para Administrador (andreazevedo1975@gmail.com), a senha NUNCA é preenchida automaticamente!
  const fillCredentials = (type: 'admin' | number) => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (type === 'admin') {
      setEmail(ADMIN_EMAIL);
      // Senha é mantida em branco para digitação manual obrigatória!
      setPassword('');
      setSuccessNotice('Administrador selecionado. Por governança de segurança, a senha deve ser digitada manualmente no campo abaixo.');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
      setTimeout(() => setSuccessNotice(null), 5000);
    } else {
      const target = TEST_ACCOUNTS.find(a => a.id === type) || TEST_ACCOUNTS[0];
      setEmail(target.email);
      setPassword(target.defaultPassword);
    }
  };

  // Funções de Laboratório para simulação da regra de renovação por IP
  const handleSimulateIpChange = (newIp: string) => {
    AuthService.setSimulatedIp(newIp);
    setActiveIp(newIp);
    setStatusUpdateTick(prev => prev + 1);
    setSuccessNotice(`Rede alterada para: ${newIp}`);
    setErrorMessage(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleRestoreRealIp = () => {
    AuthService.setSimulatedIp(null);
    const real = networkInfo?.ip || '187.32.44.18';
    setActiveIp(real);
    setStatusUpdateTick(prev => prev + 1);
    setSuccessNotice(`IP restaurado para a rede real: ${real}`);
    setErrorMessage(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleForceExpire = (accountId: number) => {
    AuthService.forceExpireTestAccount(accountId, activeIp);
    setStatusUpdateTick(prev => prev + 1);
    setSuccessNotice(`Conta #${accountId} expirada propositalmente no IP ${activeIp}. Tente logar com ela para verificar o bloqueio ou troque de IP para validar a renovação automática!`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleResetAllAccounts = () => {
    if (window.confirm("Deseja redefinir os 10 logins de teste para o estado original virgem (não ativados)?")) {
      AuthService.resetAllTestAccounts();
      setStatusUpdateTick(prev => prev + 1);
      setSuccessNotice("Todos os 10 logins de teste foram reiniciados.");
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  // Manipulação de Troca de Senha do Administrador (Ciclo de 3 meses)
  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    setChangePassSuccess(null);

    if (newPassInput !== confirmPassInput) {
      setChangePassError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassInput.trim().length < 4) {
      setChangePassError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    // Se a senha atual estiver expirada, permite atualizar caso a senha atual confira ou com validação
    const result = AuthService.changeAdminPassword(currentPassInput, newPassInput, adminPasswordInfo.isExpired);

    if (result.success) {
      setStatusUpdateTick(prev => prev + 1);
      setChangePassSuccess('Senha de Administrador alterada com sucesso! O novo ciclo de 3 meses (90 dias) foi iniciado.');
      setPassword('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setChangePassSuccess(null);
        setSuccessNotice('Nova senha configurada com sucesso. Digite-a manualmente para acessar o sistema.');
        setTimeout(() => setSuccessNotice(null), 5000);
      }, 1500);
    } else {
      setChangePassError(result.error || 'Não foi possível alterar a senha. Verifique a senha atual digitada.');
    }
  };

  const handleSimulatePasswordExpiry = () => {
    AuthService.forceExpireAdminPassword();
    setStatusUpdateTick(prev => prev + 1);
    setChangePassError('Simulação ativada: A senha do Administrador agora está com mais de 90 dias (expirada). Defina uma nova senha para renovar o ciclo.');
  };

  const handleResetAdminPasswordToDefault = () => {
    AuthService.resetAdminPasswordToDefault();
    setStatusUpdateTick(prev => prev + 1);
    setChangePassSuccess('Senha do Administrador restaurada para o padrão inicial ("admin") e o ciclo de 3 meses foi reiniciado.');
    setTimeout(() => {
      setChangePassSuccess(null);
    }, 3000);
  };

  // Funções de Recuperação de Acesso para o Administrador (Esqueci a Senha)
  const handleOpenRecoveryModal = () => {
    setRecoveryErrorMsg(null);
    setRecoverySuccessMsg(null);
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRevealedCurrentPassword(null);
    setCopiedPass(false);
    setShowRecoveryModal(true);
  };

  const handleRevealPassword = () => {
    const currentPass = AuthService.getCurrentStoredAdminPassword();
    setRevealedCurrentPassword(currentPass);
  };

  const handleResetToDefaultAdminPasswordFromModal = () => {
    const res = AuthService.recoverAdminPassword(DEFAULT_ADMIN_PASSWORD);
    if (res.success) {
      setStatusUpdateTick(prev => prev + 1);
      setRevealedCurrentPassword(DEFAULT_ADMIN_PASSWORD);
      setRecoverySuccessMsg(`A senha do Administrador foi redefinida para o padrão original: "${DEFAULT_ADMIN_PASSWORD}". O ciclo de 3 meses (90 dias) foi reiniciado.`);
      setEmail(ADMIN_EMAIL);
      setPassword(DEFAULT_ADMIN_PASSWORD);
    } else {
      setRecoveryErrorMsg(res.message);
    }
  };

  const handleApplyNewAdminPasswordFromRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryErrorMsg(null);
    setRecoverySuccessMsg(null);

    if (recoveryNewPassword.trim().length < 4) {
      setRecoveryErrorMsg('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    const res = AuthService.recoverAdminPassword(recoveryNewPassword.trim());
    if (res.success) {
      setStatusUpdateTick(prev => prev + 1);
      setRevealedCurrentPassword(recoveryNewPassword.trim());
      setRecoverySuccessMsg(`Nova senha cadastrada com sucesso! Ela já foi preenchida para login e o ciclo de 3 meses foi renovado.`);
      setEmail(ADMIN_EMAIL);
      setPassword(recoveryNewPassword.trim());
      setTimeout(() => {
        setShowRecoveryModal(false);
        setSuccessNotice('Nova senha configurada com sucesso. Você já pode clicar em Acessar CV-AutoPilot.');
        setTimeout(() => setSuccessNotice(null), 5000);
      }, 1500);
    } else {
      setRecoveryErrorMsg(res.message);
    }
  };

  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const accountsGroup1 = accountsWithStatus.slice(0, 5);
  const accountsGroup2 = accountsWithStatus.slice(5, 10);
  const activeAccountsGroup = selectedTab === '1-5' ? accountsGroup1 : accountsGroup2;

  // Formatação de data em português
  const formatDateBR = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '--';
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-center items-center p-2.5 sm:p-6 py-6 sm:py-10 transition-colors duration-300 relative overflow-y-auto"
      style={{ 
        backgroundColor: colors.background,
        color: colors.textPrimary
      }}
    >
      {/* Background Decorativo C-Level */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: colors.primary }}
      />
      <div 
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: colors.primary }}
      />

      {/* Card Principal de Autenticação */}
      <div 
        className="w-full max-w-xl rounded-3xl border shadow-2xl p-4 sm:p-7 backdrop-blur-md relative z-10 transition-all duration-200"
        style={{ 
          backgroundColor: colors.surface, 
          borderColor: colors.borderFocus || colors.border,
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 40px -15px rgba(136, 19, 55, 0.12)'
        }}
      >
        {/* Barra Superior se aberto em Modal */}
        {onClose && (
          <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                Gerenciar Perfil / Login
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                Livre
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-80 cursor-pointer border"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              <span>Voltar à Ferramenta</span>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Banner de Identificação de Rede Externa */}
        <div 
          className="mb-4 p-2.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2"
          style={{ 
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.3)'
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Globe size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold block opacity-75 text-emerald-500 dark:text-emerald-400">
                Rede Externa Conectada
              </span>
              <span className="font-mono font-bold text-xs break-all" style={{ color: colors.textPrimary }}>
                IP Ativo: {activeIp}
                {AuthService.getSimulatedIp() && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-500 font-bold">
                    Simulado
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExternalAccessModal(true)}
              className="text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
              title="Ver e copiar a URL Externa Oficial para compartilhar com qualquer pessoa"
            >
              <Share2 size={13} />
              <span>Link Público</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLabPanel(!showLabPanel)}
              className="text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: showLabPanel ? colors.primaryLight : 'transparent',
                borderColor: showLabPanel ? colors.primary : 'rgba(16, 185, 129, 0.4)',
                color: showLabPanel ? colors.primary : colors.textPrimary
              }}
              title="Abrir simulador para testar renovação com IPs diferentes"
            >
              <Cpu size={13} />
              <span>Simulador de IP</span>
              {showLabPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Painel Expansível de Simulação de IP para Testar a Renovação */}
        {showLabPanel && (
          <div 
            className="mb-5 p-3.5 rounded-2xl border text-xs space-y-3 animate-fadeIn"
            style={{ 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(136, 19, 55, 0.03)',
              borderColor: colors.primary
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold flex items-center gap-1.5 text-xs" style={{ color: colors.primary }}>
                  <Zap size={14} />
                  Validador da Regra de Renovação por IP Diferente
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                  Regra do sistema: O login de 7 dias expira. Se tentar no <strong>mesmo IP</strong>, é bloqueado. Se tentar com um <strong>IP diferente</strong>, é renovado automaticamente por mais 7 dias!
                </p>
              </div>
              <button 
                type="button"
                onClick={handleRestoreRealIp}
                className="text-[10px] px-2 py-1 rounded-md border font-semibold hover:opacity-80 shrink-0"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
                title="Voltar ao IP real detectado"
              >
                Restaurar IP Real
              </button>
            </div>

            {/* Alternância rápida de IPs para teste */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75" style={{ color: colors.textSecondary }}>
                Alterar IP Ativo em 1 Clique (Simular redes diferentes):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: 'SP (Filial 1)', ip: '189.40.12.5' },
                  { label: 'RJ (Filial 2)', ip: '201.88.90.11' },
                  { label: 'RS (Home 1)', ip: '177.135.22.4' },
                  { label: 'MG (Home 2)', ip: '191.240.18.99' },
                ].map((preset) => {
                  const isCur = activeIp === preset.ip;
                  return (
                    <button
                      key={preset.ip}
                      type="button"
                      onClick={() => handleSimulateIpChange(preset.ip)}
                      className="p-1.5 rounded-lg border text-left font-mono text-[10px] transition-all cursor-pointer"
                      style={{
                        backgroundColor: isCur ? colors.primaryLight : colors.surface,
                        borderColor: isCur ? colors.primary : colors.border,
                        color: isCur ? colors.primary : colors.textPrimary,
                        fontWeight: isCur ? 700 : 500
                      }}
                    >
                      <div className="text-[9px] font-sans font-bold opacity-80">{preset.label}</div>
                      <div className="truncate">{preset.ip}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-2 text-[10px]" style={{ borderColor: colors.border }}>
              <span className="opacity-75" style={{ color: colors.textSecondary }}>
                💡 Dica: expire uma conta de teste abaixo para testar o bloqueio no mesmo IP e a renovação no novo IP.
              </span>
              <button
                type="button"
                onClick={handleResetAllAccounts}
                className="text-rose-500 font-bold hover:underline shrink-0"
              >
                Resetar Todas
              </button>
            </div>
          </div>
        )}

        {/* Header do Logo e Título */}
        <div className="flex flex-col items-center text-center mb-5 space-y-2.5">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg border p-0.5 flex items-center justify-center"
            style={{ borderColor: colors.primary, backgroundColor: colors.surfaceHover }}
          >
            <img 
              src={LOGO_SRC} 
              alt="CV-AutoPilot Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: colors.textPrimary }}>
                CV-AutoPilot
              </h1>
              <span 
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border text-white"
                style={{ backgroundColor: colors.primary, borderColor: colors.primaryHover }}
              >
                Ambiente Aberto
              </span>
            </div>
            <p className="text-xs mt-0.5 font-medium max-w-md mx-auto" style={{ color: colors.textSecondary }}>
              Acesso livre via URL • Sem login do Google nem Gmail • Todas as funcionalidades liberadas
            </p>
          </div>
        </div>

        {/* Notificação de Sucesso / Renovação */}
        {successNotice && (
          <div 
            className="mb-4 p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.12)', 
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#10b981'
            }}
          >
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successNotice}</span>
          </div>
        )}

        {/* Mensagem de Erro / Bloqueio */}
        {errorMessage && (
          <div 
            className="mb-4 p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="leading-relaxed font-semibold block">{errorMessage}</span>
              {errorMessage.includes('expirou para esta rede/IP') && (
                <button
                  type="button"
                  onClick={() => setShowLabPanel(true)}
                  className="mt-1 text-[11px] font-bold text-amber-500 underline flex items-center gap-1 cursor-pointer"
                >
                  <Cpu size={12} />
                  Abrir Simulador de IP para renovar com outro endereço
                </button>
              )}
              {errorMessage.includes('3 meses') && (
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="mt-1 text-[11px] font-bold text-rose-500 underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound size={12} />
                  Abrir janela para cadastrar nova senha de 3 meses
                </button>
              )}
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Campo E-mail */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                E-mail Autorizado
              </label>
              {currentInputStatus && (
                <span 
                  className="text-[10px] px-2 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor: currentInputStatus.isExpired 
                      ? (currentInputStatus.canRenewWithDifferentIp ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                      : currentInputStatus.isActivated 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'rgba(168, 85, 247, 0.15)',
                    color: currentInputStatus.isExpired 
                      ? (currentInputStatus.canRenewWithDifferentIp ? '#3b82f6' : '#ef4444')
                      : currentInputStatus.isActivated 
                        ? '#10b981' 
                        : '#a855f7'
                  }}
                >
                  {currentInputStatus.isExpired 
                    ? (currentInputStatus.canRenewWithDifferentIp ? 'Pronto para Renovar (Novo IP)' : 'Expirado neste IP')
                    : currentInputStatus.isActivated 
                      ? `${currentInputStatus.daysRemaining}d Restantes` 
                      : '7 Dias Disponíveis'}
                </span>
              )}
              {isAdminSelected && (
                <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                  adminPasswordInfo.isExpired 
                    ? 'bg-rose-500/20 text-rose-500' 
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {adminPasswordInfo.isExpired 
                    ? 'Senha Expirada (90d)' 
                    : `Senha Válida (${adminPasswordInfo.daysRemaining}d restam)`}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-60">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: seu.email@empresa.com ou teste1@teste.com.br"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: colors.surfaceHover || colors.background, 
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                Senha de Acesso
              </label>
              {isAdminSelected && (
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <Lock size={10} />
                  Digitação manual obrigatória
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-60">
                <Lock size={16} />
              </div>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isAdminSelected ? "Digite sua senha de Administrador..." : "Insira sua senha"}
                autoComplete={isAdminSelected ? "new-password" : "current-password"}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: colors.surfaceHover || colors.background, 
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Linha de Apoio / Esqueci a Senha */}
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <span className="text-[11px] opacity-70" style={{ color: colors.textSecondary }}>
                {isAdminSelected ? 'Conta Master • André Azevedo' : 'Logins de Teste: Senha 1234'}
              </span>
              <button
                type="button"
                onClick={handleOpenRecoveryModal}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Esqueci a senha do Administrador ou preciso recuperar o acesso"
              >
                <HelpCircle size={12} />
                <span>Esqueci a senha de Administrador</span>
              </button>
            </div>

            {/* Alerta de Governança para o Administrador */}
            {isAdminSelected && (
              <div 
                className="mt-2 p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2"
                style={{ 
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  color: colors.textSecondary
                }}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                  <span>
                    <strong>Segurança Master:</strong> A senha não é preenchida automaticamente. Deve ser digitada e renovada a cada 3 meses.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="font-bold text-amber-500 hover:underline shrink-0 text-[10px]"
                >
                  Alterar Senha
                </button>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: `0 8px 20px ${colors.primaryGlow || 'rgba(136, 19, 55, 0.3)'}`
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Autenticando...
                </span>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  <span>Entrar com Conta</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              style={{ backgroundColor: '#059669' }}
              title="Acessar o ambiente de teste imediatamente sem precisar de login"
            >
              <Zap size={16} />
              <span>Acesso Livre de Teste</span>
            </button>
          </div>
        </form>

        {/* Card de Acesso Livre para Qualquer Pessoa com o Link (1-Clique) */}
        <div 
          className="mt-3.5 p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2.5 transition-all shadow-xs"
          style={{ 
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.35)'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0">
              <Share2 size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  Acesso Livre para Qualquer Pessoa com o Link
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  1-CLIQUE
                </span>
              </div>
              <p className="text-[11px] mt-0.5 opacity-80" style={{ color: colors.textSecondary }}>
                Sem necessidade de senha ou cadastro. Qualquer visitante pode utilizar todas as ferramentas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowExternalAccessModal(true)}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
              style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
              title="Copiar link de acesso para enviar a outras pessoas"
            >
              <Globe size={13} />
              <span>Ver Link</span>
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#059669' }}
            >
              <span>Entrar como Convidado</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Seção de Contas Autorizadas & Acesso */}
        <div className="mt-5 pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
          {/* Administrador Total (Sem Preenchimento Automático de Senha + Gestão de 3 Meses) */}
          <div 
            className="p-3 rounded-2xl border transition-all"
            style={{ 
              backgroundColor: isAdminSelected ? (colors.primaryLight || 'rgba(136, 19, 55, 0.12)') : colors.surfaceHover, 
              borderColor: isAdminSelected ? colors.primary : colors.border
            }}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div 
                onClick={() => fillCredentials('admin')}
                className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap" style={{ color: colors.textPrimary }}>
                    <span>{ADMIN_EMAIL}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      ADMIN MASTER
                    </span>
                  </div>

                  <div className="text-[11px] mt-1 space-y-0.5" style={{ color: colors.textSecondary }}>
                    <div className="flex items-center gap-1.5">
                      <Lock size={11} className="text-amber-500" />
                      <span>Senha manual obrigatória (sem auto-preenchimento)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-blue-400" />
                      <span>
                        Ciclo de 3 Meses: {adminPasswordInfo.isExpired ? (
                          <strong className="text-rose-500">Expirada! Altere agora.</strong>
                        ) : (
                          <strong>{adminPasswordInfo.daysRemaining} dias restantes</strong>
                        )} (Próx: {formatDateBR(adminPasswordInfo.expiresAt)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações do Administrador */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
                  style={{ backgroundColor: colors.primary }}
                  title="Seleciona o e-mail do Administrador e foca no campo de senha para digitação manual"
                >
                  Digitar Senha
                </button>

                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-2 py-0.5 rounded-md border text-[10px] font-bold transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
                  style={{ 
                    borderColor: colors.border,
                    color: adminPasswordInfo.isExpired ? '#ef4444' : colors.primary
                  }}
                  title="Alterar senha do administrador (obrigatório a cada 3 meses)"
                >
                  <Edit3 size={11} />
                  <span>Alterar Senha</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenRecoveryModal}
                  className="px-2 py-0.5 rounded-md border text-[10px] font-bold transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
                  style={{ 
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)'
                  }}
                  title="Esqueci a senha / Recuperar acesso do Administrador"
                >
                  <HelpCircle size={11} />
                  <span>Recuperar Acesso</span>
                </button>
              </div>
            </div>
          </div>

          {/* 10 Logins Teste com Abas e Renovação por IP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: colors.textPrimary }}>
                <KeyRound size={14} />
                <span>10 Logins de Teste (7 Dias • Renovação por IP)</span>
              </div>
              {/* Abas 1-5 e 6-10 */}
              <div className="flex items-center rounded-lg border p-0.5 text-[10px] font-bold" style={{ borderColor: colors.border }}>
                <button
                  type="button"
                  onClick={() => setSelectedTab('1-5')}
                  className="px-2 py-0.5 rounded transition-all cursor-pointer"
                  style={{
                    backgroundColor: selectedTab === '1-5' ? colors.primary : 'transparent',
                    color: selectedTab === '1-5' ? '#ffffff' : colors.textSecondary
                  }}
                >
                  Logins #01 a #05
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab('6-10')}
                  className="px-2 py-0.5 rounded transition-all cursor-pointer"
                  style={{
                    backgroundColor: selectedTab === '6-10' ? colors.primary : 'transparent',
                    color: selectedTab === '6-10' ? '#ffffff' : colors.textSecondary
                  }}
                >
                  Logins #06 a #10
                </button>
              </div>
            </div>

            {/* Aviso da Regra de Renovação */}
            <div 
              className="p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2"
              style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(37, 99, 235, 0.06)',
                borderColor: 'rgba(59, 130, 246, 0.25)',
                color: colors.textSecondary
              }}
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw size={13} className="text-blue-500 shrink-0" />
                <span>
                  <strong>Renovação Automática:</strong> Ao expirar, qualquer IP diferente renova a conta para mais 7 dias!
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                Senha: 1234
              </span>
            </div>

            {/* Lista dos 5 logins da aba ativa */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {activeAccountsGroup.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                const st = acc.status;

                let badgeColor = 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
                let badgeText = '7 DIAS DISPONÍVEIS';

                if (st.isExpired) {
                  if (st.canRenewWithDifferentIp) {
                    badgeColor = 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
                    badgeText = 'RENOVAR NOVO IP';
                  } else {
                    badgeColor = 'bg-rose-500/20 text-rose-600 dark:text-rose-400';
                    badgeText = 'EXPIRADO NESTE IP';
                  }
                } else if (st.isActivated) {
                  if ((st.renewalCount || 0) > 0) {
                    badgeColor = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
                    badgeText = `RENOVADO #${st.renewalCount} (${st.daysRemaining}d)`;
                  } else {
                    badgeColor = 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
                    badgeText = `ATIVO (${st.daysRemaining}d ${st.hoursRemaining}h)`;
                  }
                }

                return (
                  <div
                    key={acc.id}
                    className="p-2 rounded-xl border flex items-center justify-between gap-2 transition-all hover:scale-[1.005]"
                    style={{
                      backgroundColor: isSelected ? (colors.primaryLight || 'rgba(136, 19, 55, 0.1)') : colors.surfaceHover,
                      borderColor: isSelected ? colors.primary : colors.border
                    }}
                  >
                    <div 
                      onClick={() => fillCredentials(acc.id)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                      >
                        {acc.id}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold flex items-center gap-1.5 truncate" style={{ color: colors.textPrimary }}>
                          <span className="truncate">{acc.email}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black shrink-0 ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-70 flex items-center gap-2 truncate" style={{ color: colors.textSecondary }}>
                          <span>Último IP: {st.lastIp || 'Nenhum'}</span>
                          {st.renewalCount ? <span>• {st.renewalCount} renovações</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botão de simular expiração rápida para teste de renovação */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForceExpire(acc.id);
                        }}
                        className="text-[9px] px-1.5 py-1 rounded border font-semibold opacity-70 hover:opacity-100 transition-opacity"
                        style={{ borderColor: colors.border, color: colors.textSecondary }}
                        title="Simular expiração dos 7 dias para testar a renovação por IP"
                      >
                        Expirar
                      </button>

                      <button
                        type="button"
                        onClick={() => fillCredentials(acc.id)}
                        className="text-[11px] font-bold hover:underline"
                        style={{ color: colors.primary }}
                      >
                        Preencher
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-3.5 text-center text-[11px] opacity-70 flex items-center justify-center gap-1.5" style={{ color: colors.textSecondary }}>
          <Lock size={12} />
          <span>Acesso protegido pelo CV-AutoPilot Enterprise Guard • 10 Logins Teste</span>
        </div>

        {/* Assinatura Obrigatória e Identidade Visual devIA */}
        <div 
          className="mt-4 pt-3 border-t flex items-center justify-between gap-3 text-left transition-all"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="p-1.5 rounded-xl border flex items-center justify-center shadow-xs shrink-0"
              style={{ 
                backgroundColor: isDark ? '#181D18' : '#F1F8E9', 
                borderColor: '#2E7D32' 
              }}
              title="devIA — Apps de IA pro seu bolso de formiga"
            >
              <DevIALogo size={26} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-tight" style={{ color: colors.textPrimary }}>
                  Desenvolvido por <strong style={{ color: '#4CAF50' }}>devIA</strong>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#2E7D32]/20 text-[#4CAF50] border border-[#2E7D32]/30">
                  Preço Justo
                </span>
              </div>
              <div className="text-[10px] font-medium opacity-80" style={{ color: '#546E7A' }}>
                Apps de IA pro seu bolso de formiga
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-semibold opacity-85 block" style={{ color: colors.textSecondary }}>
              IA A Preço Justo Para Pequenas Empresas que devIA
            </span>
          </div>
        </div>
      </div>

      {/* Modal Executivo de Alteração de Senha do Administrador (Ciclo 3 Meses / 90 Dias) */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative transition-all"
            style={{ 
              backgroundColor: colors.surfaceElevated || colors.surface,
              borderColor: colors.borderFocus || colors.primary
            }}
          >
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => {
                setShowChangePasswordModal(false);
                setChangePassError(null);
                setChangePassSuccess(null);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: colors.textSecondary }}
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black" style={{ color: colors.textPrimary }}>
                  Alteração de Senha do Administrador
                </h2>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Governança Executiva: Senha obrigatória a cada 3 meses (90 dias)
                </p>
              </div>
            </div>

            {/* Card com Detalhes do Ciclo Atual */}
            <div 
              className="p-3 rounded-2xl border text-xs mb-4 space-y-1"
              style={{ 
                backgroundColor: adminPasswordInfo.isExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                borderColor: adminPasswordInfo.isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.25)'
              }}
            >
              <div className="flex items-center justify-between font-bold">
                <span style={{ color: colors.textPrimary }}>Conta: {ADMIN_EMAIL}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  adminPasswordInfo.isExpired ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {adminPasswordInfo.isExpired ? '⚠️ SENHA EXPIRADA' : `✅ ${adminPasswordInfo.daysRemaining} DIAS RESTANTES`}
                </span>
              </div>
              <div className="text-[11px] opacity-80" style={{ color: colors.textSecondary }}>
                <span>Última alteração: {formatDateBR(adminPasswordInfo.lastChangedAt)} • </span>
                <span>Vencimento do ciclo de 3 meses: {formatDateBR(adminPasswordInfo.expiresAt)}</span>
              </div>
              {adminPasswordInfo.isExpired && (
                <p className="text-[11px] font-semibold text-rose-500 pt-1">
                  O prazo máximo de 90 dias venceu. Defina uma nova senha para renovar o ciclo de segurança e restabelecer o acesso total.
                </p>
              )}
            </div>

            {/* Feedback Messages */}
            {changePassError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}
            {changePassSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{changePassSuccess}</span>
              </div>
            )}

            {/* Formulário de Troca */}
            <form onSubmit={handleChangeAdminPassword} className="space-y-3">
              {/* Senha Atual */}
              {!adminPasswordInfo.isExpired && (
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                    Senha Atual:
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassToggle ? 'text' : 'password'}
                      required={!adminPasswordInfo.isExpired}
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      placeholder="Digite a senha atual"
                      className="w-full text-xs p-2.5 pr-9 rounded-xl border outline-none font-medium"
                      style={{ 
                        backgroundColor: colors.inputBg || colors.surface, 
                        borderColor: colors.border,
                        color: colors.textPrimary 
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassToggle(!showCurrentPassToggle)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    >
                      {showCurrentPassToggle ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                  Nova Senha (Mínimo 4 caracteres):
                </label>
                <div className="relative">
                  <input
                    type={showNewPassToggle ? 'text' : 'password'}
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Digite a nova senha segura"
                    className="w-full text-xs p-2.5 pr-9 rounded-xl border outline-none font-medium"
                    style={{ 
                      backgroundColor: colors.inputBg || colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassToggle(!showNewPassToggle)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                  >
                    {showNewPassToggle ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirmação */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                  Confirmar Nova Senha:
                </label>
                <input
                  type={showNewPassToggle ? 'text' : 'password'}
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Repita a nova senha para confirmação"
                  className="w-full text-xs p-2.5 rounded-xl border outline-none font-medium"
                  style={{ 
                    backgroundColor: colors.inputBg || colors.surface, 
                    borderColor: colors.border,
                    color: colors.textPrimary 
                  }}
                />
              </div>

              {/* Botões do Formulário */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border hover:opacity-80 cursor-pointer"
                  style={{ borderColor: colors.border, color: colors.textSecondary }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <CheckCircle2 size={14} />
                  <span>Salvar Nova Senha (Renovar Ciclo por 3 Meses)</span>
                </button>
              </div>
            </form>

            {/* Ferramentas de Teste e Validação para o Administrador */}
            <div className="mt-4 pt-3 border-t text-[11px] space-y-2" style={{ borderColor: colors.border }}>
              <span className="font-bold block opacity-75" style={{ color: colors.textSecondary }}>
                🛠️ Laboratório de Testes da Regra dos 3 Meses:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSimulatePasswordExpiry}
                  className="px-2.5 py-1 rounded-lg border text-[10px] font-semibold hover:border-rose-400 text-rose-500 bg-rose-500/5 transition-all cursor-pointer"
                  title="Simula que se passaram 95 dias desde a última alteração"
                >
                  ⚡ Simular Expiração de 3 Meses
                </button>

                <button
                  type="button"
                  onClick={handleResetAdminPasswordToDefault}
                  className="px-2.5 py-1 rounded-lg border text-[10px] font-semibold hover:border-amber-400 text-amber-500 bg-amber-500/5 transition-all cursor-pointer"
                  title="Redefine a senha para 'admin' e inicia novo período de 90 dias"
                >
                  🔄 Restaurar Padrão ("admin")
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Executivo de Recuperação de Acesso do Administrador (Esqueci a Senha) */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.borderFocus || colors.border,
              color: colors.textPrimary 
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 shrink-0">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight" style={{ color: colors.textPrimary }}>
                    Recuperação de Acesso do Administrador
                  </h3>
                  <p className="text-xs font-medium text-amber-500">
                    Titular: {ADMIN_EMAIL}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="p-1.5 rounded-xl border opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ borderColor: colors.border }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Aviso de Operação Local vs Envio por E-mail */}
            <div 
              className="mb-4 p-3 rounded-2xl border text-xs leading-relaxed space-y-1"
              style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.25)',
                color: colors.textSecondary
              }}
            >
              <div className="flex items-center gap-1.5 text-blue-500 font-bold text-xs">
                <Info size={14} className="shrink-0" />
                <span>Sobre a Entrega por E-mail & Segurança Local</span>
              </div>
              <p>
                O CV-AutoPilot é executado de forma privada no seu dispositivo/navegador. Por não utilizar envio externo via provedores SMTP de terceiros, sua senha de Administrador pode ser <strong>visualizada diretamente</strong> ou <strong>redefinida imediatamente</strong> abaixo sem necessidade da senha anterior.
              </p>
            </div>

            {/* Alertas de Sucesso e Erro */}
            {recoverySuccessMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}
            {recoveryErrorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{recoveryErrorMsg}</span>
              </div>
            )}

            {/* Opção 1: Consultar / Revelar Senha Atual */}
            <div 
              className="mb-3 p-3.5 rounded-2xl border space-y-2.5"
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                  <Eye size={14} className="text-amber-500" />
                  Opção 1: Visualizar Senha Atual Configurada
                </span>
                {!revealedCurrentPassword && (
                  <button
                    type="button"
                    onClick={handleRevealPassword}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer shadow-xs"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Revelar Senha
                  </button>
                )}
              </div>

              {revealedCurrentPassword && (
                <div className="p-2.5 rounded-xl border bg-black/20 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: colors.border }}>
                  <div>
                    <span className="text-[10px] block opacity-70 uppercase tracking-wider">Senha Ativa no Sistema:</span>
                    <span className="font-mono text-sm sm:text-base font-black text-amber-500 tracking-wider">
                      {revealedCurrentPassword}
                    </span>
                    {revealedCurrentPassword === DEFAULT_ADMIN_PASSWORD && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-bold">
                        Padrão de Fábrica
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(revealedCurrentPassword)}
                      className="px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 hover:opacity-80 cursor-pointer"
                      style={{ borderColor: colors.border, color: colors.textPrimary }}
                    >
                      {copiedPass ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedPass ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(ADMIN_EMAIL);
                        setPassword(revealedCurrentPassword);
                        setShowRecoveryModal(false);
                        setSuccessNotice(`Senha preenchida para ${ADMIN_EMAIL}. Clique em Acessar CV-AutoPilot.`);
                        setTimeout(() => setSuccessNotice(null), 4000);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer shadow-xs"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Aplicar no Login
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Opção 2: Redefinição Direta para o Padrão (1-Clique) */}
            <div 
              className="mb-3 p-3.5 rounded-2xl border flex items-center justify-between gap-2"
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
            >
              <div>
                <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                  Opção 2: Restaurar Senha de Fábrica ("admin")
                </span>
                <span className="text-[11px] opacity-75" style={{ color: colors.textSecondary }}>
                  Reseta a senha para "admin" e reinicia o ciclo de 3 meses (90 dias).
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefaultAdminPasswordFromModal}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold text-amber-500 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 transition-all shrink-0 cursor-pointer"
              >
                Restaurar para "admin"
              </button>
            </div>

            {/* Opção 3: Definir uma Nova Senha Agora (Sem precisar da antiga) */}
            <form onSubmit={handleApplyNewAdminPasswordFromRecovery} className="p-3.5 rounded-2xl border space-y-2.5" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
              <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                Opção 3: Cadastrar Nova Senha Personalizada
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold block uppercase mb-1 opacity-80">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showRecoveryPassToggle ? 'text' : 'password'}
                      required
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="Mín. 4 caracteres"
                      className="w-full text-xs p-2 pr-8 rounded-xl border outline-none font-medium"
                      style={{ 
                        backgroundColor: colors.surface, 
                        borderColor: colors.border,
                        color: colors.textPrimary 
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryPassToggle(!showRecoveryPassToggle)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    >
                      {showRecoveryPassToggle ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold block uppercase mb-1 opacity-80">Confirmar Senha</label>
                  <input
                    type={showRecoveryPassToggle ? 'text' : 'password'}
                    required
                    value={recoveryConfirmPassword}
                    onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full text-xs p-2 rounded-xl border outline-none font-medium"
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary 
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <CheckCircle2 size={13} />
                  <span>Gravar Nova Senha & Renovar Ciclo</span>
                </button>
              </div>
            </form>

            {/* Rodapé */}
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:opacity-80 cursor-pointer"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de URL Oficial de Acesso Externo */}
      <ExternalAccessModal
        isOpen={showExternalAccessModal}
        onClose={() => setShowExternalAccessModal(false)}
        colors={colors}
      />
    </div>
  );
};

export default LoginScreen;
