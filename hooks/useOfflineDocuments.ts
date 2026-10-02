import { useState, useEffect, useCallback } from 'react';
import { OfflineDocument, CV, GenerationHistoryItem } from '../types';
import { offlineDocumentService, OFFLINE_DOCS_CHANGE_EVENT } from '../services/offlineDocumentService';

export function useOfflineDocuments() {
  const [offlineDocs, setOfflineDocs] = useState<OfflineDocument[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const docs = await offlineDocumentService.getAllDocuments();
      setOfflineDocs(docs);
      const ids = new Set<string>();
      docs.forEach(d => {
        ids.add(d.id);
        if (d.sourceId) ids.add(d.sourceId);
      });
      setSavedIds(ids);
    } catch (err) {
      console.warn('Erro ao atualizar documentos offline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleChanged = () => refresh();
    window.addEventListener(OFFLINE_DOCS_CHANGE_EVENT, handleChanged);
    return () => {
      window.removeEventListener(OFFLINE_DOCS_CHANGE_EVENT, handleChanged);
    };
  }, [refresh]);

  const toggleSaveCV = async (cv: CV, analysis?: string): Promise<{ saved: boolean; doc?: OfflineDocument }> => {
    const isSaved = savedIds.has(cv.id) || savedIds.has(`cv_${cv.id}`);
    if (isSaved) {
      await offlineDocumentService.removeDocument(cv.id);
      await refresh();
      return { saved: false };
    } else {
      const doc = await offlineDocumentService.saveCVForOffline(cv, analysis);
      await refresh();
      return { saved: true, doc };
    }
  };

  const toggleSaveHistory = async (item: GenerationHistoryItem): Promise<{ saved: boolean; doc?: OfflineDocument }> => {
    const isSaved = savedIds.has(item.id) || savedIds.has(`history_${item.id}`);
    if (isSaved) {
      await offlineDocumentService.removeDocument(item.id);
      await refresh();
      return { saved: false };
    } else {
      const doc = await offlineDocumentService.saveHistoryItemForOffline(item);
      await refresh();
      return { saved: true, doc };
    }
  };

  const removeDoc = async (idOrSourceId: string): Promise<boolean> => {
    const res = await offlineDocumentService.removeDocument(idOrSourceId);
    await refresh();
    return res;
  };

  const isSaved = useCallback((id: string): boolean => {
    return savedIds.has(id) || savedIds.has(`cv_${id}`) || savedIds.has(`history_${id}`);
  }, [savedIds]);

  return {
    offlineDocs,
    savedIds,
    isLoading,
    isSaved,
    toggleSaveCV,
    toggleSaveHistory,
    removeDoc,
    refresh
  };
}
