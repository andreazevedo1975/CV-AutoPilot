import { useState, useEffect, useCallback, useRef } from 'react';
import { backgroundSyncService, BACKGROUND_SYNC_EVENT } from '../services/backgroundSyncService';
import { OfflineMutation, OfflineMutationType, SyncSummary } from '../types';
import { useOnlineStatus } from './useOnlineStatus';

export function useBackgroundSync(onSyncCompleted?: (summary: SyncSummary) => void) {
  const isOnline = useOnlineStatus();
  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>(() => 
    backgroundSyncService.getPendingMutations()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSummary, setLastSyncSummary] = useState<SyncSummary | null>(null);

  // Armazenar callback em ref para evitar que referências anônimas acionem re-renders infinitos
  const onSyncCompletedRef = useRef(onSyncCompleted);
  useEffect(() => {
    onSyncCompletedRef.current = onSyncCompleted;
  });

  const refreshPending = useCallback(() => {
    setPendingMutations(backgroundSyncService.getPendingMutations());
  }, []);

  useEffect(() => {
    // Ouvir eventos globais de sincronização
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SyncSummary>;
      refreshPending();
      if (customEvent.detail && customEvent.detail.syncedCount > 0) {
        setLastSyncSummary(customEvent.detail);
        if (onSyncCompletedRef.current) {
          onSyncCompletedRef.current(customEvent.detail);
        }
      }
    };

    window.addEventListener(BACKGROUND_SYNC_EVENT, handleSyncEvent);
    const unsubscribe = backgroundSyncService.subscribe((summary) => {
      refreshPending();
      if (summary.syncedCount > 0) {
        setLastSyncSummary(summary);
        if (onSyncCompletedRef.current) {
          onSyncCompletedRef.current(summary);
        }
      }
    });

    return () => {
      window.removeEventListener(BACKGROUND_SYNC_EVENT, handleSyncEvent);
      unsubscribe();
    };
  }, [refreshPending]);

  // Se voltar a ficar online e houver mutações pendentes, aciona a sincronização de forma controlada
  const autoSyncTriggeredRef = useRef(false);
  useEffect(() => {
    if (isOnline && pendingMutations.length > 0 && !isSyncing && !autoSyncTriggeredRef.current) {
      autoSyncTriggeredRef.current = true;
      setIsSyncing(true);
      backgroundSyncService.triggerSync('auto_reconnect')
        .then((summary) => {
          refreshPending();
          if (summary.syncedCount > 0) {
            setLastSyncSummary(summary);
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }

    if (!isOnline) {
      autoSyncTriggeredRef.current = false;
    }
  }, [isOnline, pendingMutations.length, isSyncing, refreshPending]);

  const syncNow = async (): Promise<SyncSummary> => {
    setIsSyncing(true);
    try {
      const summary = await backgroundSyncService.triggerSync('user_action');
      refreshPending();
      return summary;
    } finally {
      setIsSyncing(false);
    }
  };

  const recordOfflineChange = async (
    type: OfflineMutationType,
    entityId: string,
    payload: any,
    description: string
  ): Promise<OfflineMutation> => {
    const mutation = await backgroundSyncService.enqueueMutation(type, entityId, payload, description);
    refreshPending();
    return mutation;
  };

  return {
    pendingCount: pendingMutations.length,
    pendingMutations,
    isSyncing,
    lastSyncSummary,
    syncNow,
    recordOfflineChange,
    refreshPending
  };
}
