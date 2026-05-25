import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordService } from '../services/recordService';
import { MonitorRecord, CreateRecordInput, UpdateRecordInput, MapFilterParams } from '../types';
import { addPendingRecord, getAllPendingRecords, deletePendingRecord } from '../utils/idbHelpers';

interface UseRecordsReturn {
  records: MonitorRecord[];
  isLoading: boolean;
  createRecord: (data: CreateRecordInput) => Promise<MonitorRecord>;
  updateRecord: (id: string, data: UpdateRecordInput) => Promise<MonitorRecord>;
  deleteRecord: (id: string) => Promise<void>;
  refetch: (filters?: MapFilterParams) => Promise<void>;
  syncOfflineRecords: () => Promise<void>;
}

export function useRecords(): UseRecordsReturn {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MapFilterParams>({});

  // 查询记录（依赖筛选条件）
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['records', filters],
    queryFn: () => recordService.list(filters),
    staleTime: 1000 * 60, // 1分钟
  });

  // 创建记录 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRecordInput) => recordService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: async (error, data) => {
      console.error('创建记录失败，存入离线队列', error);
      await addPendingRecord({ type: 'create', data });
    },
  });

  // 更新记录 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordInput }) =>
      recordService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: async (error, { id, data }) => {
      console.error('更新记录失败，存入离线队列', error);
      await addPendingRecord({ type: 'update', data: { id, ...data } });
    },
  });

  // 删除记录 mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recordService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: async (error, id) => {
      console.error('删除记录失败，存入离线队列', error);
      await addPendingRecord({ type: 'delete', data: { id } });
    },
  });

  const createRecord = useCallback(async (data: CreateRecordInput) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateRecord = useCallback(async (id: string, data: UpdateRecordInput) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteRecord = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  // 手动刷新（可传新筛选条件）
  const refresh = useCallback(async (newFilters?: MapFilterParams) => {
    if (newFilters) setFilters(newFilters);
    await refetch();
  }, [refetch]);

  // 同步离线记录（网络恢复后调用）
  const syncOfflineRecords = useCallback(async () => {
    const pendingList = await getAllPendingRecords();
    for (const pending of pendingList) {
      try {
        if (pending.type === 'create') {
          await recordService.create(pending.data);
        } else if (pending.type === 'update') {
          await recordService.update(pending.data.id, pending.data);
        } else if (pending.type === 'delete') {
          await recordService.delete(pending.data.id);
        }
        await deletePendingRecord(pending.id!);
      } catch (error) {
        console.error('同步离线记录失败', error);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['records'] });
  }, [queryClient]);

  return {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    refetch: refresh,
    syncOfflineRecords,
  };
}