import { useEffect, useCallback, useState } from 'react';
import { useRecords } from './useRecords';
import { useTask } from './useTask';
import { getAllPendingRecords, getAllPendingTracks } from '../utils/idbHelpers';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const { syncOfflineRecords } = useRecords();
  const { syncOfflineTracks } = useTask();

  // 计算待同步条目数
  const refreshPendingCount = useCallback(async () => {
    const records = await getAllPendingRecords();
    const tracks = await getAllPendingTracks();
    setPendingCount(records.length + tracks.length);
  }, []);

  // 同步所有离线数据
  const syncNow = useCallback(async () => {
    if (!isOnline) return;
    await syncOfflineRecords();
    await syncOfflineTracks();
    await refreshPendingCount();
  }, [isOnline, syncOfflineRecords, syncOfflineTracks, refreshPendingCount]);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow(); // 网络恢复后自动同步
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow, refreshPendingCount]);

  // 定时刷新待同步计数
  useEffect(() => {
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    syncNow,
  };
}