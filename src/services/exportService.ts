/**
 * 导出服务：JSON、Excel、照片 ZIP
 * 注意：所有导出均在后端或前端完成，此处调用 API 获取数据
 * 实际实现中，Excel/ZIP 可能在前端生成以减少后端负载
 */

import { apiGet } from './api';
import { exportToExcel, exportPhotosToZip, flattenRecordsForExcel } from '../utils/exportHelpers';
import { MonitorRecord } from '../types';

export const exportService = {
  /**
   * 导出全部记录为 JSON 文件
   * @param params 筛选条件（用于限定导出范围，如当前任务或街道）
   */
  async exportToJSON(params?: { [key: string]: any }): Promise<void> {
    const records = await apiGet<MonitorRecord[]>('/export/records', params);
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `蚊媒监测数据_${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * 导出指定任务的记录为 Excel 文件（前端生成）
   * @param taskId 任务ID
   * @param taskName 任务名称（用于文件名）
   */
  async exportTaskToExcel(taskId: string, taskName: string): Promise<void> {
    const records = await apiGet<MonitorRecord[]>(`/tasks/${taskId}/records`);
    const flatData = flattenRecordsForExcel(records);
    exportToExcel(flatData, `${taskName}_记录`);
  },

  /**
   * 导出指定任务的所有照片为 ZIP 包（原始图片，无水印）
   * @param taskId 任务ID
   * @param taskName 任务名称
   * @param onProgress 进度回调
   */
  async exportTaskPhotosToZip(
    taskId: string,
    taskName: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const records = await apiGet<MonitorRecord[]>(`/tasks/${taskId}/records`);
    const photoPaths: string[] = [];
    records.forEach(record => {
      if (record.photos && Array.isArray(record.photos)) {
        photoPaths.push(...record.photos);
      }
    });
    if (photoPaths.length === 0) {
      alert('该任务没有照片');
      return;
    }
    await exportPhotosToZip(photoPaths, `${taskName}_照片`, onProgress);
  },
};