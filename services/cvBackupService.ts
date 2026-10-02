// CV Auto-Backup Service - Enterprise Data Safety & Browser Cloud Storage
import { CV } from '../types';

export type BackupDestination = 'indexeddb' | 'cloud_storage' | 'both';
export type BackupTrigger = 'auto_change' | 'auto_interval' | 'manual' | 'before_unload';

export interface BackupConfig {
  enabled: boolean;
  destination: BackupDestination;
  intervalMinutes: number; // 0 = immediately on changes, 5 = every 5m, 15, 30, 60
  retentionLimit: number; // 5, 10, 20 snapshots
  backupOnBeforeUnload: boolean;
  lastBackupTimestamp: string | null;
  lastBackupStatus: 'success' | 'error' | 'idle';
  autoDownloadJson: boolean;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  cvCount: number;
  destination: BackupDestination;
  trigger: BackupTrigger;
  totalBytes: number;
  cvs: CV[];
  analysisResults: Record<string, string>;
  checksum: string;
}

const CONFIG_STORAGE_KEY = 'cv_autopilot_backup_config_v1';
const CLOUD_STORAGE_KEY = 'cv_autopilot_cloud_vault_v1';
const DB_NAME = 'CVAutoPilot_EnterpriseDB';
const DB_VERSION = 1;
const STORE_NAME = 'cv_snapshots';

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: true,
  destination: 'both',
  intervalMinutes: 0, // Instantâneo ao alterar ou processar
  retentionLimit: 10,
  backupOnBeforeUnload: true,
  lastBackupTimestamp: null,
  lastBackupStatus: 'idle',
  autoDownloadJson: false,
};

// Simple fast hash for data integrity verification
function computeChecksum(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Open or initialize IndexedDB
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao abrir IndexedDB.'));
  });
}

// Save snapshot to IndexedDB
async function saveToIndexedDb(snapshot: BackupSnapshot): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CVBackupService] Falha ao salvar no IndexedDB:', err);
  }
}

// Get all snapshots from IndexedDB
async function getFromIndexedDb(): Promise<BackupSnapshot[]> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as BackupSnapshot[];
        resolve(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CVBackupService] Falha ao buscar do IndexedDB:', err);
    return [];
  }
}

// Delete snapshot from IndexedDB
async function deleteFromIndexedDb(id: string): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CVBackupService] Falha ao deletar do IndexedDB:', err);
  }
}

// Get snapshots from Browser Cloud Vault (localStorage mirror/storage partition)
function getCloudSnapshots(): BackupSnapshot[] {
  try {
    const data = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[CVBackupService] Erro ao ler nuvem local do navegador:', e);
    return [];
  }
}

// Save snapshots to Browser Cloud Vault
function saveCloudSnapshots(snapshots: BackupSnapshot[]): void {
  try {
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.warn('[CVBackupService] Erro ao gravar na nuvem local do navegador:', e);
  }
}

export const cvBackupService = {
  // Load configuration with default fallback
  getConfig(): BackupConfig {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_BACKUP_CONFIG };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BACKUP_CONFIG, ...parsed };
    } catch {
      return { ...DEFAULT_BACKUP_CONFIG };
    }
  },

  // Save configuration
  saveConfig(newConfig: BackupConfig): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('[CVBackupService] Erro ao salvar configuração:', e);
    }
  },

  // Request persistent storage in browser to avoid eviction
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        return isPersisted;
      } catch {
        return false;
      }
    }
    return false;
  },

  // Check if browser storage is persisted
  async checkPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  },

  // Estimate browser storage usage
  async getStorageEstimate(): Promise<{ quotaMB: number; usageMB: number; percent: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMB = ((estimate.usage || 0) / (1024 * 1024));
        const quotaMB = ((estimate.quota || 0) / (1024 * 1024));
        const percent = quotaMB > 0 ? (usageMB / quotaMB) * 100 : 0;
        return {
          usageMB: Math.round(usageMB * 100) / 100,
          quotaMB: Math.round(quotaMB * 100) / 100,
          percent: Math.round(percent * 100) / 100
        };
      } catch {
        return { quotaMB: 0, usageMB: 0, percent: 0 };
      }
    }
    return { quotaMB: 0, usageMB: 0, percent: 0 };
  },

  // Perform full backup snapshot
  async performBackup(
    cvs: CV[],
    analysisResults: Record<string, string>,
    trigger: BackupTrigger = 'manual',
    customConfig?: BackupConfig
  ): Promise<BackupSnapshot | null> {
    const config = customConfig || this.getConfig();

    if (!config.enabled && trigger !== 'manual') {
      return null;
    }

    try {
      const now = new Date();
      const payloadString = JSON.stringify({ cvs, analysisResults });
      const checksum = computeChecksum(payloadString);
      const totalBytes = new Blob([payloadString]).size;

      const snapshot: BackupSnapshot = {
        id: `backup_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now.toISOString(),
        cvCount: cvs.length,
        destination: config.destination,
        trigger,
        totalBytes,
        cvs: JSON.parse(JSON.stringify(cvs)),
        analysisResults: JSON.parse(JSON.stringify(analysisResults)),
        checksum,
      };

      // 1. Armazenamento Local Persistente do Navegador (IndexedDB)
      if (config.destination === 'indexeddb' || config.destination === 'both') {
        await saveToIndexedDb(snapshot);
      }

      // 2. Nuvem do Navegador (Web Cloud Storage Vault)
      if (config.destination === 'cloud_storage' || config.destination === 'both') {
        const cloudSnapshots = getCloudSnapshots();
        cloudSnapshots.unshift(snapshot);
        // Apply retention limit
        const trimmed = cloudSnapshots.slice(0, config.retentionLimit || 10);
        saveCloudSnapshots(trimmed);
      }

      // Enforce retention limit also on IndexedDB
      if (config.destination === 'indexeddb' || config.destination === 'both') {
        try {
          const allIdb = await getFromIndexedDb();
          const limit = config.retentionLimit || 10;
          if (allIdb.length > limit) {
            const toDelete = allIdb.slice(limit);
            for (const item of toDelete) {
              await deleteFromIndexedDb(item.id);
            }
          }
        } catch (e) {
          console.warn('[CVBackupService] Erro ao podar histórico IndexedDB:', e);
        }
      }

      // Update config metadata
      const updatedConfig: BackupConfig = {
        ...config,
        lastBackupTimestamp: now.toISOString(),
        lastBackupStatus: 'success',
      };
      this.saveConfig(updatedConfig);

      // Auto-download JSON if configured
      if (config.autoDownloadJson && trigger === 'manual') {
        this.downloadSnapshotJson(snapshot);
      }

      return snapshot;
    } catch (err) {
      console.error('[CVBackupService] Falha durante o backup:', err);
      const updatedConfig: BackupConfig = {
        ...config,
        lastBackupStatus: 'error',
      };
      this.saveConfig(updatedConfig);
      throw err;
    }
  },

  // Get all unified snapshots from all configured destinations
  async getAllSnapshots(): Promise<BackupSnapshot[]> {
    const fromIdb = await getFromIndexedDb();
    const fromCloud = getCloudSnapshots();

    // Merge and deduplicate by id
    const map = new Map<string, BackupSnapshot>();
    for (const s of [...fromIdb, ...fromCloud]) {
      if (!map.has(s.id)) {
        map.set(s.id, s);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  // Delete a snapshot
  async deleteSnapshot(id: string): Promise<void> {
    await deleteFromIndexedDb(id);
    const cloud = getCloudSnapshots().filter(s => s.id !== id);
    saveCloudSnapshots(cloud);
  },

  // Clear all backup snapshots
  async clearAllSnapshots(): Promise<void> {
    try {
      const db = await openIndexedDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {}
    localStorage.removeItem(CLOUD_STORAGE_KEY);
  },

  // Download snapshot as a standalone JSON backup file
  downloadSnapshotJson(snapshot: BackupSnapshot): void {
    const dataStr = JSON.stringify({
      app: 'CV-AutoPilot Enterprise',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      snapshot,
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFormatted = new Date(snapshot.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = `Backup_Curriculos_Processados_${dateFormatted}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Parse and validate imported JSON backup file
  parseBackupFile(jsonContent: string): { cvs: CV[]; analysisResults: Record<string, string>; date?: string } {
    try {
      const data = JSON.parse(jsonContent);

      if (data.snapshot && Array.isArray(data.snapshot.cvs)) {
        return {
          cvs: data.snapshot.cvs,
          analysisResults: data.snapshot.analysisResults || {},
          date: data.snapshot.timestamp,
        };
      }

      // Direct array of CVs
      if (Array.isArray(data)) {
        return { cvs: data, analysisResults: {} };
      }

      if (Array.isArray(data.cvs)) {
        return {
          cvs: data.cvs,
          analysisResults: data.analysisResults || {},
          date: data.exportedAt || data.timestamp,
        };
      }

      throw new Error('Formato de arquivo de backup inválido. Certifique-se de carregar um arquivo .json gerado pelo sistema.');
    } catch (err: any) {
      throw new Error(err.message || 'Arquivo corrompido ou formato não suportado.');
    }
  }
};
