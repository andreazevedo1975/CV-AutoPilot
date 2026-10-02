/**
 * CV-AutoPilot Enterprise - Serviço de Background Sync (Workbox 7)
 * Detecta quando o usuário volta a ter conexão e sincroniza automaticamente:
 * - Status de candidaturas atualizados offline (ex: Aplicou -> Entrevista -> Aprovado)
 * - Novas candidaturas registradas em trânsito
 * - Novos currículos criados, estilizados ou editados offline
 */
import { OfflineMutation, OfflineMutationType, SyncSummary, Application, CV } from '../types';

const SYNC_QUEUE_STORAGE_KEY = 'cv_autopilot_pending_sync_mutations';
const SYNC_HISTORY_STORAGE_KEY = 'cv_autopilot_sync_history';
export const BACKGROUND_SYNC_EVENT = 'cv_autopilot_bg_sync_event';

type SyncListener = (summary: SyncSummary) => void;

class BackgroundSyncService {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Ouvinte quando o navegador detecta o retorno da conexão à internet
      window.addEventListener('online', () => {
        console.log('[BackgroundSync] Retorno de rede detectado pelo navegador. Iniciando sincronização automática...');
        this.triggerSync('online_event');
      });

      // 2. Ouvinte de mensagens vindas do Service Worker (Workbox Background Sync)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'WORKBOX_BACKGROUND_SYNC_TRIGGERED') {
            console.log('[BackgroundSync] Mensagem do Service Worker recebida: evento de sync disparado.');
            this.triggerSync('service_worker_event');
          }
        });
      }
    }
  }

  /**
   * Obtém a lista de mutações offline pendentes
   */
  public getPendingMutations(): OfflineMutation[] {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
      if (!stored) return [];
      const parsed: OfflineMutation[] = JSON.parse(stored);
      return parsed.filter(m => !m.synced);
    } catch {
      return [];
    }
  }

  /**
   * Quantidade de mutações pendentes aguardando rede
   */
  public getPendingCount(): number {
    return this.getPendingMutations().length;
  }

  /**
   * Registra uma nova mutação efetuada pelo usuário enquanto offline
   */
  public async enqueueMutation(
    type: OfflineMutationType,
    entityId: string,
    payload: any,
    description: string
  ): Promise<OfflineMutation> {
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      description,
      synced: false,
      retryCount: 0
    };

    const current = this.getPendingMutations();
    // Se já houver mutação pendente para a mesma entidade e mesmo tipo, atualiza o payload
    const existingIdx = current.findIndex(m => m.entityId === entityId && m.type === type);
    if (existingIdx >= 0) {
      current[existingIdx] = mutation;
    } else {
      current.push(mutation);
    }

    try {
      localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('[BackgroundSync] Erro ao gravar mutação na fila:', e);
    }

    // Notificar o Service Worker ativo via postMessage
    this.notifyServiceWorker(mutation);

    // Tentar registrar a tag de Background Sync nativa no Service Worker
    this.registerNativeBackgroundSync();

    // Disparar evento para componentes React atualizarem badges
    this.dispatchSyncEvent({
      syncedCount: 0,
      failedCount: 0,
      items: current,
      timestamp: new Date().toISOString()
    });

    console.log(`[BackgroundSync] Mutação enfileirada para sync: "${description}"`);
    return mutation;
  }

  /**
   * Notifica o Service Worker sobre a nova mutação registrada
   */
  private notifyServiceWorker(mutation: OfflineMutation): void {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'REGISTER_OFFLINE_MUTATION',
          payload: mutation
        });
      } catch (err) {
        console.warn('[BackgroundSync] Falha ao enviar postMessage para SW:', err);
      }
    }
  }

  /**
   * Registra tag no SyncManager nativo do navegador quando suportado (Chromium / Android)
   */
  private async registerNativeBackgroundSync(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('cv-autopilot-bg-sync');
          console.log('[BackgroundSync] Tag cv-autopilot-bg-sync registrada no SyncManager nativo.');
        }
      } catch (err) {
        // Ignora silenciosamente se o navegador rejeitar o registro de sync
      }
    }
  }

  /**
   * Executa a sincronização de todas as alterações pendentes quando a rede volta
   */
  public async triggerSync(source = 'manual'): Promise<SyncSummary> {
    if (this.isSyncing) {
      return {
        syncedCount: 0,
        failedCount: 0,
        items: [],
        timestamp: new Date().toISOString()
      };
    }

    const pending = this.getPendingMutations();
    if (pending.length === 0) {
      return {
        syncedCount: 0,
        failedCount: 0,
        items: [],
        timestamp: new Date().toISOString()
      };
    }

    this.isSyncing = true;
    console.log(`[BackgroundSync] Processando ${pending.length} mutações pendentes (origem: ${source})...`);

    const syncedItems: OfflineMutation[] = [];
    const failedItems: OfflineMutation[] = [];

    // Reconciliar dados de candidaturas e currículos
    for (const item of pending) {
      try {
        await this.processMutation(item);
        item.synced = true;
        item.syncedAt = new Date().toISOString();
        syncedItems.push(item);
      } catch (error) {
        console.error(`[BackgroundSync] Falha ao processar mutação ${item.id}:`, error);
        item.retryCount = (item.retryCount || 0) + 1;
        failedItems.push(item);
      }
    }

    // Atualiza a fila removendo os itens sincronizados
    try {
      localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(failedItems));
      
      // Salva histórico de sincronizações recentes
      const history = this.getSyncHistory();
      const newHistory = [...syncedItems, ...history].slice(0, 30);
      localStorage.setItem(SYNC_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch {}

    const summary: SyncSummary = {
      syncedCount: syncedItems.length,
      failedCount: failedItems.length,
      items: syncedItems,
      timestamp: new Date().toISOString()
    };

    this.isSyncing = false;
    this.dispatchSyncEvent(summary);

    // Notificar listeners registrados
    this.listeners.forEach(cb => {
      try {
        cb(summary);
      } catch {}
    });

    return summary;
  }

  /**
   * Processa e aplica individualmente a mutação aos dados persistentes do aplicativo
   */
  private async processMutation(mutation: OfflineMutation): Promise<void> {
    // Simula uma pequena latência de conciliação de rede para robustez
    await new Promise(resolve => setTimeout(resolve, 80));

    switch (mutation.type) {
      case 'APPLICATION_STATUS_UPDATE': {
        const storedApps = localStorage.getItem('applications');
        if (storedApps) {
          const apps: Application[] = JSON.parse(storedApps);
          const updated = apps.map(a => 
            a.id === mutation.entityId ? { ...a, ...mutation.payload } : a
          );
          localStorage.setItem('applications', JSON.stringify(updated));
        }
        break;
      }

      case 'APPLICATION_CREATE': {
        const storedApps = localStorage.getItem('applications');
        const apps: Application[] = storedApps ? JSON.parse(storedApps) : [];
        if (!apps.some(a => a.id === mutation.entityId)) {
          apps.push(mutation.payload);
          localStorage.setItem('applications', JSON.stringify(apps));
        }
        break;
      }

      case 'APPLICATION_UPDATE': {
        const storedApps = localStorage.getItem('applications');
        if (storedApps) {
          const apps: Application[] = JSON.parse(storedApps);
          const updated = apps.map(a => 
            a.id === mutation.entityId ? { ...a, ...mutation.payload } : a
          );
          localStorage.setItem('applications', JSON.stringify(updated));
        }
        break;
      }

      case 'CV_CREATE': {
        const storedCvs = localStorage.getItem('cvs');
        const cvs: CV[] = storedCvs ? JSON.parse(storedCvs) : [];
        if (!cvs.some(c => c.id === mutation.entityId)) {
          cvs.unshift(mutation.payload);
          localStorage.setItem('cvs', JSON.stringify(cvs));
        }
        break;
      }

      case 'CV_UPDATE': {
        const storedCvs = localStorage.getItem('cvs');
        if (storedCvs) {
          const cvs: CV[] = JSON.parse(storedCvs);
          const updated = cvs.map(c => 
            c.id === mutation.entityId ? { ...c, ...mutation.payload } : c
          );
          localStorage.setItem('cvs', JSON.stringify(updated));
        }
        break;
      }

      default:
        break;
    }
  }

  /**
   * Retorna o histórico de mutações já sincronizadas com sucesso
   */
  public getSyncHistory(): OfflineMutation[] {
    try {
      const stored = localStorage.getItem(SYNC_HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Limpa a fila de mutações pendentes
   */
  public clearPending(): void {
    try {
      localStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
    } catch {}
    this.dispatchSyncEvent({
      syncedCount: 0,
      failedCount: 0,
      items: [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Dispara evento global de sincronização no window
   */
  private dispatchSyncEvent(summary: SyncSummary): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BACKGROUND_SYNC_EVENT, { detail: summary }));
    }
  }

  /**
   * Inscreve um callback para ser notificado após cada sincronização
   */
  public subscribe(callback: SyncListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const backgroundSyncService = new BackgroundSyncService();
