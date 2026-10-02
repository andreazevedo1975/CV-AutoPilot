// services/authService.ts - Sistema de Autenticação e Controle de Acesso por Rede Externa com 10 Logins Teste e Renovação por IP
import { AuthUser, ExternalNetworkInfo, NetworkTrialRecord, TestLoginAccount, TestLoginRecord } from '../types';

export const ADMIN_EMAIL = 'andreazevedo1975@gmail.com';
export const DEFAULT_TEST_PASSWORD = '1234';

// 10 Logins de Teste Pré-Configurados com aliases flexíveis
export const TEST_ACCOUNTS: TestLoginAccount[] = [
  { id: 1, email: 'teste1@teste.com.br', name: 'Conta Teste #01', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste@teste.com.br', 'teste01@teste.com.br'] },
  { id: 2, email: 'teste2@teste.com.br', name: 'Conta Teste #02', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste02@teste.com.br'] },
  { id: 3, email: 'teste3@teste.com.br', name: 'Conta Teste #03', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste03@teste.com.br'] },
  { id: 4, email: 'teste4@teste.com.br', name: 'Conta Teste #04', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste04@teste.com.br'] },
  { id: 5, email: 'teste5@teste.com.br', name: 'Conta Teste #05', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste05@teste.com.br'] },
  { id: 6, email: 'teste6@teste.com.br', name: 'Conta Teste #06', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste06@teste.com.br'] },
  { id: 7, email: 'teste7@teste.com.br', name: 'Conta Teste #07', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste07@teste.com.br'] },
  { id: 8, email: 'teste8@teste.com.br', name: 'Conta Teste #08', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste08@teste.com.br'] },
  { id: 9, email: 'teste9@teste.com.br', name: 'Conta Teste #09', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste09@teste.com.br'] },
  { id: 10, email: 'teste10@teste.com.br', name: 'Conta Teste #10', defaultPassword: DEFAULT_TEST_PASSWORD, aliases: ['teste10@teste.com.br'] },
];

// Compatibilidade com código legado
export const TRIAL_EMAIL = TEST_ACCOUNTS[0].email;
export const TRIAL_DEFAULT_PASSWORD = DEFAULT_TEST_PASSWORD;

const AUTH_USER_SESSION_KEY = 'cv_autopilot_current_user_session';
const TEST_LOGINS_STORAGE_KEY = 'cv_autopilot_test_logins_registry_v4';
const CACHED_EXTERNAL_IP_KEY = 'cv_autopilot_detected_external_ip_v2';
const SIMULATED_IP_KEY = 'cv_autopilot_simulated_ip_v1';
export const TRIAL_DURATION_DAYS = 7;

// Constantes de Segurança para a Senha do Administrador (Renovação Obrigatória a Cada 3 Meses)
const ADMIN_PASSWORD_STORAGE_KEY = 'cv_autopilot_admin_pass_v4';
const ADMIN_PASSWORD_UPDATED_AT_KEY = 'cv_autopilot_admin_pass_updated_at_v4';
export const ADMIN_PASSWORD_EXPIRY_DAYS = 90; // 3 meses = 90 dias
export const DEFAULT_ADMIN_PASSWORD = 'admin';

export interface AdminPasswordInfo {
  isExpired: boolean;
  daysRemaining: number;
  lastChangedAt: string;
  expiresAt: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  networkIp?: string;
  isRenewed?: boolean;
  renewalCount?: number;
  testAccountId?: number;
  isPasswordExpired?: boolean;
}

export interface NetworkTrialStatus {
  isActivated: boolean;
  networkIp: string;
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  activatedAt?: string;
  expiresAt?: string;
  renewalCount?: number;
  lastRenewedAt?: string;
  lastIp?: string;
  expiredIp?: string;
  canRenewWithDifferentIp?: boolean;
  isSameIpExpired?: boolean;
}

export class AuthService {
  private static cachedNetwork: ExternalNetworkInfo | null = null;
  private static networkDetectionPromise: Promise<ExternalNetworkInfo> | null = null;

  /**
   * Retorna os 10 logins de teste oficiais disponíveis
   */
  public static getTestAccounts(): TestLoginAccount[] {
    return TEST_ACCOUNTS;
  }

  /**
   * Localiza uma conta de teste por e-mail ou alias (case-insensitive)
   */
  public static findTestAccount(emailInput: string): TestLoginAccount | undefined {
    if (!emailInput) return undefined;
    const clean = emailInput.trim().toLowerCase();
    return TEST_ACCOUNTS.find(acc => 
      acc.email.toLowerCase() === clean || 
      acc.aliases.some(alias => alias.toLowerCase() === clean)
    );
  }

  /**
   * Identifica a rede externa do cliente (IP público e metadados).
   */
  public static async detectExternalNetwork(): Promise<ExternalNetworkInfo> {
    if (this.cachedNetwork) {
      return this.cachedNetwork;
    }

    if (this.networkDetectionPromise) {
      return this.networkDetectionPromise;
    }

    this.networkDetectionPromise = (async () => {
      // 1. Verificar se há simulação de IP ativa no ambiente
      const simIp = this.getSimulatedIp();
      if (simIp) {
        const simInfo: ExternalNetworkInfo = {
          ip: simIp,
          isExternal: true,
          detectedAt: new Date().toISOString()
        };
        this.cachedNetwork = simInfo;
        return simInfo;
      }

      // 2. Tentar ler do cache local para resposta imediata
      const cachedIp = localStorage.getItem(CACHED_EXTERNAL_IP_KEY);
      let detectedIp = cachedIp || '';

      // 3. Consulta de IP público externo via api.ipify.org
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.ip) {
            detectedIp = data.ip;
            localStorage.setItem(CACHED_EXTERNAL_IP_KEY, detectedIp);
          }
        }
      } catch {
        // Fallback secundário
        try {
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
          const res2 = await fetch('https://api64.ipify.org?format=json', {
            signal: controller2.signal
          });
          clearTimeout(timeoutId2);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.ip) {
              detectedIp = data2.ip;
              localStorage.setItem(CACHED_EXTERNAL_IP_KEY, detectedIp);
            }
          }
        } catch {
          // Utiliza fallback de hardware estável
        }
      }

      if (!detectedIp) {
        const clientFingerprint = this.getClientNetworkFingerprint();
        detectedIp = `187.32.${(parseInt(clientFingerprint, 16) % 200) + 10}.${(parseInt(clientFingerprint, 16) % 240) + 5}`;
      }

      const networkInfo: ExternalNetworkInfo = {
        ip: detectedIp,
        isExternal: !detectedIp.startsWith('127.') && !detectedIp.startsWith('localhost'),
        detectedAt: new Date().toISOString()
      };

      this.cachedNetwork = networkInfo;
      return networkInfo;
    })();

    return this.networkDetectionPromise;
  }

  /**
   * Obtém o IP da rede externa detectada de forma síncrona com suporte a IP Simulado para testes
   */
  public static getDetectedNetworkIpSync(): string {
    const simIp = this.getSimulatedIp();
    if (simIp) return simIp;

    if (this.cachedNetwork?.ip) {
      return this.cachedNetwork.ip;
    }
    const cached = localStorage.getItem(CACHED_EXTERNAL_IP_KEY);
    if (cached) return cached;
    return `187.32.44.18`;
  }

  /**
   * Permite simular a troca de IP para validar o requisito:
   * "renová-los sempre que o prazo expirar (desde que não seja o mesmo número de IP)"
   */
  public static getSimulatedIp(): string | null {
    try {
      return localStorage.getItem(SIMULATED_IP_KEY);
    } catch {
      return null;
    }
  }

  public static setSimulatedIp(ip: string | null): void {
    try {
      if (ip && ip.trim()) {
        localStorage.setItem(SIMULATED_IP_KEY, ip.trim());
      } else {
        localStorage.removeItem(SIMULATED_IP_KEY);
      }
      this.cachedNetwork = null;
      this.networkDetectionPromise = null;
    } catch (e) {
      console.warn('Erro ao atualizar IP simulado:', e);
    }
  }

  /**
   * Gera uma assinatura estável como fallback de IP
   */
  private static getClientNetworkFingerprint(): string {
    const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
    const screenInfo = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '';
    const raw = `${nav.userAgent || ''}-${nav.language || ''}-${screenInfo}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  /**
   * Obtém o registro persistente de todos os 10 logins de teste
   */
  public static getTestLoginsRegistry(): Record<string, TestLoginRecord> {
    try {
      const raw = localStorage.getItem(TEST_LOGINS_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Salva o registro de logins de teste
   */
  public static saveTestLoginsRegistry(registry: Record<string, TestLoginRecord>): void {
    try {
      localStorage.setItem(TEST_LOGINS_STORAGE_KEY, JSON.stringify(registry));
    } catch (e) {
      console.warn('Erro ao salvar registro de logins de teste:', e);
    }
  }

  /**
   * Consulta o status detalhado de um login de teste específico (1 a 10 ou por email)
   */
  public static getTestAccountStatus(emailOrId: string | number, customNetworkIp?: string): NetworkTrialStatus {
    const currentIp = customNetworkIp || this.getDetectedNetworkIpSync();
    let account: TestLoginAccount | undefined;

    if (typeof emailOrId === 'number') {
      account = TEST_ACCOUNTS.find(a => a.id === emailOrId);
    } else {
      account = this.findTestAccount(emailOrId);
    }

    if (!account) {
      // Fallback genérico
      return {
        isActivated: false,
        networkIp: currentIp,
        daysRemaining: TRIAL_DURATION_DAYS,
        hoursRemaining: 0,
        isExpired: false
      };
    }

    const registry = this.getTestLoginsRegistry();
    const record = registry[`acc_${account.id}`];

    if (!record || !record.expiresAt) {
      // Conta ainda não foi ativada
      return {
        isActivated: false,
        networkIp: currentIp,
        daysRemaining: TRIAL_DURATION_DAYS,
        hoursRemaining: 0,
        isExpired: false,
        renewalCount: 0,
        lastIp: undefined,
        canRenewWithDifferentIp: true
      };
    }

    const expiresAtMs = new Date(record.expiresAt).getTime();
    const nowMs = Date.now();
    const diffMs = expiresAtMs - nowMs;

    if (diffMs <= 0) {
      // Conta expirou!
      const expiredOnIp = record.expiredIp || record.lastIp;
      const isSameIp = Boolean(expiredOnIp && expiredOnIp === currentIp);

      return {
        isActivated: true,
        networkIp: currentIp,
        daysRemaining: 0,
        hoursRemaining: 0,
        isExpired: true,
        activatedAt: record.firstActivatedAt,
        expiresAt: record.expiresAt,
        renewalCount: record.renewalCount || 0,
        lastRenewedAt: record.lastRenewedAt,
        lastIp: record.lastIp,
        expiredIp: expiredOnIp,
        isSameIpExpired: isSameIp,
        canRenewWithDifferentIp: !isSameIp // Pode renovar automaticamente se for um IP diferente!
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      isActivated: true,
      networkIp: currentIp,
      daysRemaining: days,
      hoursRemaining: hours,
      isExpired: false,
      activatedAt: record.firstActivatedAt,
      expiresAt: record.expiresAt,
      renewalCount: record.renewalCount || 0,
      lastRenewedAt: record.lastRenewedAt,
      lastIp: record.lastIp,
      canRenewWithDifferentIp: false
    };
  }

  /**
   * Compatibilidade para telas que consultam o status de rede geral
   */
  public static getTrialStatusForNetwork(networkIp?: string, email?: string): NetworkTrialStatus {
    const targetEmail = email || TRIAL_EMAIL;
    return this.getTestAccountStatus(targetEmail, networkIp);
  }

  /**
   * Compatibilidade para telas que consultam o tempo restante de trial
   */
  public static getTrialRemainingTime(email?: string, networkIp?: string): { 
    days: number; 
    hours: number; 
    isExpired: boolean; 
    isActivated: boolean; 
    networkIp: string;
    renewalCount: number;
    canRenewWithDifferentIp: boolean;
  } {
    const status = this.getTrialStatusForNetwork(networkIp, email);
    return {
      days: status.daysRemaining,
      hours: status.hoursRemaining,
      isExpired: status.isExpired,
      isActivated: status.isActivated,
      networkIp: status.networkIp,
      renewalCount: status.renewalCount || 0,
      canRenewWithDifferentIp: !!status.canRenewWithDifferentIp
    };
  }

  /**
   * Realiza login no sistema com validação de credenciais, identificação da rede externa
   * e regra de renovação automática dos 10 logins de teste quando o prazo expirar (desde que não seja o mesmo IP)
   */
  public static login(emailInput: string, passwordInput: string, customNetworkIp?: string): LoginResult {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    const networkIp = customNetworkIp || this.getDetectedNetworkIpSync();

    // 1. Administrador Total com Digitação Manual Obrigatória e Renovação a Cada 3 Meses
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      if (!cleanPass) {
        return {
          success: false,
          error: 'A senha de Administrador deve ser digitada manualmente. O preenchimento automático está desativado por governança de segurança.'
        };
      }

      const currentAdminPass = this.getAdminPassword();
      if (cleanPass !== currentAdminPass) {
        return {
          success: false,
          error: 'Senha de Administrador incorreta. A senha deve ser digitada manualmente pelo titular da conta.'
        };
      }

      // Validar política de validade de 3 meses (90 dias)
      const passInfo = this.getAdminPasswordInfo();
      if (passInfo.isExpired) {
        return {
          success: false,
          isPasswordExpired: true,
          error: 'A senha de Administrador expirou pois ultrapassou o prazo de validade de 3 meses (90 dias). Por segurança, é obrigatório definir uma nova senha para acessar o sistema.'
        };
      }

      const adminUser: AuthUser = {
        email: ADMIN_EMAIL,
        name: 'André Azevedo (Administrador)',
        role: 'admin',
        isUnlimited: true,
        networkIp,
        createdAt: new Date().toISOString()
      };
      
      try {
        sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(adminUser));
        localStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(adminUser));
      } catch {}

      return { success: true, user: adminUser, networkIp };
    }

    // 2. Busca entre os 10 logins de teste oficiais
    const testAccount = this.findTestAccount(cleanEmail);

    if (testAccount) {
      if (cleanPass !== testAccount.defaultPassword) {
        return {
          success: false,
          error: `Senha incorreta para a conta ${testAccount.email}. A senha autorizada é: ${testAccount.defaultPassword}`
        };
      }

      const registry = this.getTestLoginsRegistry();
      const accKey = `acc_${testAccount.id}`;
      let record = registry[accKey];
      const now = new Date();

      // Caso A: Primeiro acesso histórico desta conta de teste
      if (!record || !record.expiresAt) {
        const expires = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
        record = {
          id: testAccount.id,
          email: testAccount.email,
          firstActivatedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          lastLoginAt: now.toISOString(),
          lastIp: networkIp,
          renewalCount: 0,
          accessCount: 1,
          ipHistory: [networkIp]
        };
        registry[accKey] = record;
        this.saveTestLoginsRegistry(registry);

        const trialUser: AuthUser = {
          email: testAccount.email,
          name: `${testAccount.name} (7 Dias)`,
          role: 'trial',
          isUnlimited: false,
          trialActivatedAt: record.firstActivatedAt,
          trialExpiresAt: record.expiresAt,
          networkIp,
          createdAt: record.firstActivatedAt,
          renewalCount: 0,
          isRenewed: false,
          testAccountId: testAccount.id
        };

        try {
          sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(trialUser));
        } catch {}

        return {
          success: true,
          user: trialUser,
          daysRemaining: TRIAL_DURATION_DAYS,
          hoursRemaining: 0,
          networkIp,
          testAccountId: testAccount.id
        };
      }

      // Caso B: Conta já foi ativada anteriormente -> Checar se o prazo expirou
      const expiresAtMs = new Date(record.expiresAt).getTime();
      const isExpired = expiresAtMs <= now.getTime();

      if (isExpired) {
        // REGRA DO USUÁRIO: "renová-los sempre que o prazo expirar (desde que não seja o mesmo número de IP)"
        const expiredOnIp = record.expiredIp || record.lastIp;
        const isSameIp = Boolean(expiredOnIp && expiredOnIp === networkIp);

        if (isSameIp) {
          // MESMO IP: Bloqueado! A renovação exige um IP diferente
          record.expiredIp = networkIp;
          this.saveTestLoginsRegistry(registry);

          return {
            success: false,
            error: `O prazo de 7 dias do login ${testAccount.email} expirou para esta rede/IP (${networkIp}). Conforme a política de segurança, a renovação automática deste login só é permitida a partir de um número de IP diferente.`,
            daysRemaining: 0,
            hoursRemaining: 0,
            networkIp,
            testAccountId: testAccount.id
          };
        } else {
          // IP DIFERENTE: RENOVAÇÃO AUTOMÁTICA! Concede novo ciclo de 7 dias
          const newExpires = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
          const previousIp = record.lastIp || expiredOnIp || 'Anterior';
          
          record.expiredIp = undefined;
          record.firstActivatedAt = now.toISOString();
          record.expiresAt = newExpires.toISOString();
          record.lastRenewedAt = now.toISOString();
          record.renewalCount = (record.renewalCount || 0) + 1;
          record.lastIp = networkIp;
          record.lastLoginAt = now.toISOString();
          record.accessCount = (record.accessCount || 0) + 1;
          
          if (!record.ipHistory) record.ipHistory = [];
          if (!record.ipHistory.includes(networkIp)) {
            record.ipHistory.push(networkIp);
          }

          registry[accKey] = record;
          this.saveTestLoginsRegistry(registry);

          const trialUser: AuthUser = {
            email: testAccount.email,
            name: `${testAccount.name} (Renovado • Ciclo #${record.renewalCount})`,
            role: 'trial',
            isUnlimited: false,
            trialActivatedAt: record.firstActivatedAt,
            trialExpiresAt: record.expiresAt,
            networkIp,
            createdAt: record.firstActivatedAt,
            renewalCount: record.renewalCount,
            isRenewed: true,
            testAccountId: testAccount.id
          };

          try {
            sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(trialUser));
            localStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(trialUser));
          } catch {}

          return {
            success: true,
            user: trialUser,
            isRenewed: true,
            renewalCount: record.renewalCount,
            daysRemaining: TRIAL_DURATION_DAYS,
            hoursRemaining: 0,
            networkIp,
            testAccountId: testAccount.id
          };
        }
      }

      // Caso C: Conta ainda dentro do período válido de 7 dias
      record.lastLoginAt = now.toISOString();
      record.accessCount = (record.accessCount || 0) + 1;
      record.lastIp = networkIp;
      if (!record.ipHistory) record.ipHistory = [];
      if (!record.ipHistory.includes(networkIp)) {
        record.ipHistory.push(networkIp);
      }
      registry[accKey] = record;
      this.saveTestLoginsRegistry(registry);

      const diffMs = expiresAtMs - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const trialUser: AuthUser = {
        email: testAccount.email,
        name: `${testAccount.name}${record.renewalCount ? ` (Renovado • #${record.renewalCount})` : ''}`,
        role: 'trial',
        isUnlimited: false,
        trialActivatedAt: record.firstActivatedAt,
        trialExpiresAt: record.expiresAt,
        networkIp,
        createdAt: record.firstActivatedAt,
        renewalCount: record.renewalCount || 0,
        isRenewed: (record.renewalCount || 0) > 0,
        testAccountId: testAccount.id
      };

      try {
        sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(trialUser));
        localStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(trialUser));
      } catch {}

      return {
        success: true,
        user: trialUser,
        daysRemaining: days,
        hoursRemaining: hours,
        networkIp,
        renewalCount: record.renewalCount || 0,
        testAccountId: testAccount.id
      };
    }

    // 3. Acesso Livre para Qualquer Pessoa com o Link (Ambiente de Teste Livre)
    const displayName = cleanEmail.includes('@') 
      ? cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Ambiente de Teste';

    const guestUser: AuthUser = {
      email: cleanEmail || 'teste@cvautopilot.app',
      name: `${displayName} (Acesso Livre via Link)`,
      role: 'guest',
      isUnlimited: true,
      networkIp,
      createdAt: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(guestUser));
      localStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(guestUser));
    } catch {}

    return {
      success: true,
      user: guestUser,
      networkIp
    };
  }

  /**
   * Cria instantaneamente uma sessão com Acesso Livre para quem acessa via link ou URL pública.
   * Não precisa de login Google, senhas ou cadastros prévios.
   */
  public static createGuestUser(customName?: string): AuthUser {
    const networkIp = this.getDetectedNetworkIpSync();
    const guestUser: AuthUser = {
      email: 'teste@cvautopilot.app',
      name: customName || 'Ambiente de Teste (Acesso Livre)',
      role: 'guest',
      isUnlimited: true,
      networkIp,
      createdAt: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(guestUser));
      localStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(guestUser));
    } catch {}

    return guestUser;
  }

  /**
   * Auto-renovação silenciosa de conta de teste para garantir continuidade total no ambiente de testes.
   */
  public static renewTestAccountSilently(email: string, networkIp: string): void {
    const account = this.findTestAccount(email);
    if (!account) return;
    const registry = this.getTestLoginsRegistry();
    const accKey = `acc_${account.id}`;
    const record = registry[accKey];
    if (record) {
      const now = new Date();
      const newExpires = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
      record.expiresAt = newExpires.toISOString();
      record.lastRenewedAt = now.toISOString();
      record.renewalCount = (record.renewalCount || 0) + 1;
      record.expiredIp = undefined;
      registry[accKey] = record;
      this.saveTestLoginsRegistry(registry);
    }
  }

  /**
   * Garante que sempre exista uma sessão ativa válida.
   * Se nenhuma sessão existir, inicializa automaticamente com o perfil de Ambiente de Teste (Acesso Livre).
   * Sem necessidade de login Google, senhas ou travas de IP.
   */
  public static ensureActiveSession(): AuthUser {
    const existing = this.getCurrentUser();
    if (existing) {
      return existing;
    }
    return this.createGuestUser('Ambiente de Teste (Acesso Livre)');
  }

  /**
   * Força a expiração imediata de uma conta de teste (recurso para simulação e validação do requisito de renovação)
   */
  public static forceExpireTestAccount(accountId: number, ipToExpire?: string): void {
    const registry = this.getTestLoginsRegistry();
    const accKey = `acc_${accountId}`;
    const targetAccount = TEST_ACCOUNTS.find(a => a.id === accountId);
    if (!targetAccount) return;

    const currentIp = ipToExpire || this.getDetectedNetworkIpSync();
    const now = new Date();
    // Define expiração para 1 minuto atrás
    const expiredDate = new Date(now.getTime() - 60000);

    const existing = registry[accKey] || {
      id: targetAccount.id,
      email: targetAccount.email,
      firstActivatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiredDate.toISOString(),
      lastLoginAt: now.toISOString(),
      lastIp: currentIp,
      expiredIp: currentIp,
      renewalCount: 0,
      accessCount: 1,
      ipHistory: [currentIp]
    };

    existing.expiresAt = expiredDate.toISOString();
    existing.expiredIp = currentIp;
    existing.lastIp = currentIp;

    registry[accKey] = existing;
    this.saveTestLoginsRegistry(registry);
  }

  /**
   * Reinicia o status de uma conta de teste individual
   */
  public static resetTestAccount(accountId: number): void {
    const registry = this.getTestLoginsRegistry();
    delete registry[`acc_${accountId}`];
    this.saveTestLoginsRegistry(registry);
  }

  /**
   * Reinicia todas as contas de teste para o estado original virgem
   */
  public static resetAllTestAccounts(): void {
    try {
      localStorage.removeItem(TEST_LOGINS_STORAGE_KEY);
      localStorage.removeItem(SIMULATED_IP_KEY);
    } catch {}
  }

  /**
   * Obtém a sessão salva em memória (sessionStorage ou localStorage).
   */
  public static getCurrentUser(): AuthUser | null {
    try {
      const stored = sessionStorage.getItem(AUTH_USER_SESSION_KEY) || localStorage.getItem(AUTH_USER_SESSION_KEY);
      if (!stored) return null;

      const user: AuthUser = JSON.parse(stored);

      // No ambiente de teste, se uma conta trial expirar, renovamos silenciosamente para nunca travar a ferramenta
      if (user.role === 'trial') {
        const trialStatus = this.getTestAccountStatus(user.email, user.networkIp);
        if (trialStatus.isExpired) {
          this.renewTestAccountSilently(user.email, user.networkIp);
        }
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Efetua o logout do usuário
   */
  public static logout(): void {
    try {
      sessionStorage.removeItem(AUTH_USER_SESSION_KEY);
      localStorage.removeItem(AUTH_USER_SESSION_KEY);
    } catch {}
  }

  /**
   * Reinicia o período de 7 dias do trial para a rede atual (recurso de administrador)
   */
  public static resetTrialPeriod(networkIp?: string): void {
    const ip = networkIp || this.getDetectedNetworkIpSync();
    // Reinicia a conta de teste 1
    const registry = this.getTestLoginsRegistry();
    const now = new Date();
    const expires = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    registry[`acc_1`] = {
      id: 1,
      email: TEST_ACCOUNTS[0].email,
      firstActivatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      lastLoginAt: now.toISOString(),
      lastIp: ip,
      renewalCount: 0,
      accessCount: 1,
      ipHistory: [ip]
    };
    this.saveTestLoginsRegistry(registry);
  }

  /**
   * Obtém a senha atual do Administrador (nunca exposta para preenchimento automático)
   */
  public static getAdminPassword(): string {
    try {
      const stored = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {}
    return DEFAULT_ADMIN_PASSWORD;
  }

  /**
   * Obtém informações detalhadas sobre a validade de 3 meses (90 dias) da senha do Administrador
   */
  public static getAdminPasswordInfo(): AdminPasswordInfo {
    const now = Date.now();
    let lastChangedAt = '';

    try {
      lastChangedAt = localStorage.getItem(ADMIN_PASSWORD_UPDATED_AT_KEY) || '';
    } catch {}

    if (!lastChangedAt) {
      // Primeira inicialização: define a data de hoje como marco inicial dos 3 meses
      lastChangedAt = new Date().toISOString();
      try {
        localStorage.setItem(ADMIN_PASSWORD_UPDATED_AT_KEY, lastChangedAt);
      } catch {}
    }

    const lastChangedMs = new Date(lastChangedAt).getTime();
    const expiryMs = lastChangedMs + ADMIN_PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const diffMs = expiryMs - now;
    const isExpired = diffMs <= 0;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      isExpired,
      daysRemaining,
      lastChangedAt,
      expiresAt: new Date(expiryMs).toISOString()
    };
  }

  /**
   * Altera a senha do Administrador com validação de segurança e reinicia o ciclo de 3 meses (90 dias)
   */
  public static changeAdminPassword(
    currentPasswordInput: string,
    newPasswordInput: string,
    skipCurrentCheck: boolean = false
  ): { success: boolean; error?: string } {
    const cleanCurrent = currentPasswordInput.trim();
    const cleanNew = newPasswordInput.trim();

    const actualCurrent = this.getAdminPassword();

    if (!skipCurrentCheck && cleanCurrent !== actualCurrent) {
      return {
        success: false,
        error: 'A senha atual informada está incorreta. Digite sua senha atual para autorizar a troca.'
      };
    }

    if (cleanNew.length < 4) {
      return {
        success: false,
        error: 'A nova senha deve ter no mínimo 4 caracteres.'
      };
    }

    if (cleanNew === actualCurrent) {
      return {
        success: false,
        error: 'A nova senha deve ser diferente da senha anterior para renovar o ciclo de 3 meses.'
      };
    }

    try {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, cleanNew);
      localStorage.setItem(ADMIN_PASSWORD_UPDATED_AT_KEY, new Date().toISOString());
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: 'Falha ao salvar a nova senha no armazenamento local.'
      };
    }
  }

  /**
   * Força a expiração imediata da senha de administrador (útil para testes da regra dos 3 meses)
   */
  public static forceExpireAdminPassword(): void {
    try {
      // Define a data de alteração para 95 dias atrás
      const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(ADMIN_PASSWORD_UPDATED_AT_KEY, ninetyFiveDaysAgo);
    } catch {}
  }

  /**
   * Restaura a senha do Administrador para o padrão inicial ('admin') e reinicia a contagem de 3 meses
   */
  public static resetAdminPasswordToDefault(): void {
    try {
      localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      localStorage.setItem(ADMIN_PASSWORD_UPDATED_AT_KEY, new Date().toISOString());
    } catch {}
  }

  /**
   * Recupera ou redefine a senha do Administrador caso tenha sido esquecida pelo titular.
   * Se nenhuma nova senha for fornecida, restaura para o padrão de fábrica 'admin'.
   */
  public static recoverAdminPassword(newPassword?: string): { success: boolean; password: string; message: string } {
    try {
      const targetPass = newPassword && newPassword.trim().length >= 4 
        ? newPassword.trim() 
        : DEFAULT_ADMIN_PASSWORD;

      if (targetPass === DEFAULT_ADMIN_PASSWORD) {
        localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      } else {
        localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, targetPass);
      }
      localStorage.setItem(ADMIN_PASSWORD_UPDATED_AT_KEY, new Date().toISOString());

      return {
        success: true,
        password: targetPass,
        message: targetPass === DEFAULT_ADMIN_PASSWORD 
          ? `Senha do Administrador restaurada com sucesso para a padrão de fábrica: "${DEFAULT_ADMIN_PASSWORD}". O ciclo de 3 meses (90 dias) foi renovado.`
          : `Nova senha do Administrador definida com sucesso! O ciclo de 3 meses (90 dias) foi renovado.`
      };
    } catch (e) {
      return {
        success: false,
        password: '',
        message: 'Erro ao gravar as credenciais no armazenamento local do navegador.'
      };
    }
  }

  /**
   * Obtém a senha do administrador cadastrada atualmente para fins de recuperação do titular
   */
  public static getCurrentStoredAdminPassword(): string {
    return this.getAdminPassword();
  }
}
