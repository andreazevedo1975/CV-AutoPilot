/**
 * CV-AutoPilot Enterprise - Serviço de Armazenamento Offline via IndexedDB e Service Worker
 * Permite salvar currículos e cartas de apresentação específicos para leitura e consulta
 * mesmo sem conexão à internet (em trânsito, aviões, metrô ou redes instáveis).
 */
import { OfflineDocument, CV, GenerationHistoryItem } from '../types';

const DB_NAME = 'cv_autopilot_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_documents';
export const OFFLINE_DOCS_CHANGE_EVENT = 'cv_autopilot_offline_docs_changed';

class OfflineDocumentService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Abre e inicializa o banco de dados IndexedDB
   */
  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB não suportado neste ambiente.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('sourceId', 'sourceId', { unique: false });
            store.createIndex('savedAt', 'savedAt', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Notifica o Service Worker ativo via postMessage sobre a alteração
   */
  private notifyServiceWorker(action: 'SAVE' | 'DELETE', docId: string, doc?: OfflineDocument): void {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: action === 'SAVE' ? 'SAVE_OFFLINE_DOC' : 'REMOVE_OFFLINE_DOC',
          payload: { id: docId, document: doc }
        });
      } catch (err) {
        console.warn('[OfflineService] Aviso ao enviar mensagem para Service Worker:', err);
      }
    }
  }

  /**
   * Dispara evento no window para atualizar componentes React
   */
  private notifyListeners(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_DOCS_CHANGE_EVENT));
    }
  }

  /**
   * Salva um currículo (CV) para leitura offline
   */
  public async saveCVForOffline(cv: CV, analysis?: string): Promise<OfflineDocument> {
    const docId = `cv_${cv.id}`;
    const fullText = cv.content || '';
    const sizeBytes = new Blob([fullText + (analysis || '')]).size;

    const offlineDoc: OfflineDocument = {
      id: docId,
      sourceId: cv.id,
      type: 'cv',
      title: cv.name || 'Currículo Sem Título',
      content: fullText,
      savedAt: new Date().toISOString(),
      sizeBytes,
      metadata: {
        yearsOfExperience: cv.yearsOfExperience,
        portfolioLinks: cv.portfolioLinks,
        technicalSkills: cv.technicalSkills,
        softSkills: cv.softSkills,
        analysis
      }
    };

    await this.putDocument(offlineDoc);
    this.notifyServiceWorker('SAVE', docId, offlineDoc);
    this.notifyListeners();
    return offlineDoc;
  }

  /**
   * Salva uma carta de apresentação ou documento do histórico para leitura offline
   */
  public async saveHistoryItemForOffline(item: GenerationHistoryItem, customTitle?: string): Promise<OfflineDocument> {
    const docId = `history_${item.id}`;
    const fullText = item.output || '';
    const sizeBytes = new Blob([fullText + (item.inputJobDescription || '')]).size;
    const isCoverLetter = item.type === 'Carta de Apresentação';

    const offlineDoc: OfflineDocument = {
      id: docId,
      sourceId: item.id,
      type: isCoverLetter ? 'cover_letter' : 'history_doc',
      title: customTitle || (isCoverLetter ? `Carta de Apresentação (${new Date(item.timestamp).toLocaleDateString('pt-BR')})` : item.type),
      content: fullText,
      savedAt: new Date().toISOString(),
      sizeBytes,
      metadata: {
        inputJobDescription: item.inputJobDescription
      }
    };

    await this.putDocument(offlineDoc);
    this.notifyServiceWorker('SAVE', docId, offlineDoc);
    this.notifyListeners();
    return offlineDoc;
  }

  /**
   * Armazena documento no IndexedDB
   */
  public async putDocument(doc: OfflineDocument): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove um documento do IndexedDB pelo ID ou sourceId
   */
  public async removeDocument(idOrSourceId: string): Promise<boolean> {
    const db = await this.getDB();
    const existing = await this.getDocument(idOrSourceId);
    if (!existing) {
      // Tentar buscar por sourceId se o id direto não funcionou
      const all = await this.getAllDocuments();
      const match = all.find(d => d.sourceId === idOrSourceId || d.id === idOrSourceId);
      if (!match) return false;
      return this.deleteKey(match.id);
    }
    return this.deleteKey(existing.id);
  }

  private async deleteKey(id: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.notifyServiceWorker('DELETE', id);
        this.notifyListeners();
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Verifica se um documento está salvo offline pelo seu ID ou sourceId
   */
  public async isDocumentSaved(idOrSourceId: string): Promise<boolean> {
    try {
      const doc = await this.getDocument(idOrSourceId);
      if (doc) return true;
      const all = await this.getAllDocuments();
      return all.some(d => d.sourceId === idOrSourceId || d.id === idOrSourceId);
    } catch {
      return false;
    }
  }

  /**
   * Retorna um documento específico por ID
   */
  public async getDocument(id: string): Promise<OfflineDocument | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Retorna todos os documentos salvos para leitura offline
   */
  public async getAllDocuments(): Promise<OfflineDocument[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const docs: OfflineDocument[] = request.result || [];
          // Ordena pelos mais recentemente salvos
          docs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          resolve(docs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Retorna total de itens e consumo em bytes
   */
  public async getStorageSummary(): Promise<{ count: number; totalBytes: number; formattedSize: string }> {
    const docs = await this.getAllDocuments();
    const totalBytes = docs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);

    let formattedSize = `${totalBytes} B`;
    if (totalBytes > 1024 * 1024) {
      formattedSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (totalBytes > 1024) {
      formattedSize = `${(totalBytes / 1024).toFixed(1)} KB`;
    }

    return {
      count: docs.length,
      totalBytes,
      formattedSize
    };
  }
}

export const offlineDocumentService = new OfflineDocumentService();
