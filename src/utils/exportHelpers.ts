/**
 * 数据导出辅助工具：Excel 导出、ZIP 打包（无水印）
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { getPhotoPublicUrl } from '../config/supabase';

/**
 * 导出数据为 Excel 文件
 * @param data 要导出的对象数组
 * @param filename 文件名（不含扩展名）
 */
export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Records');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * 导出照片为 ZIP 包（原始图片，不加水印）
 * @param photoPaths Storage 中的照片路径数组
 * @param zipName 压缩包名称
 * @param onProgress 可选进度回调
 */
export async function exportPhotosToZip(
  photoPaths: string[],
  zipName: string,
  onProgress?: (current: number, total: number) => void
) {
  if (!photoPaths.length) {
    console.warn('没有照片可导出');
    return;
  }

  const zip = new JSZip();
  const total = photoPaths.length;

  for (let i = 0; i < total; i++) {
    const path = photoPaths[i];
    const url = getPhotoPublicUrl(path);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`下载照片失败: ${path}`);
      continue;
    }
    const blob = await response.blob();
    // 从路径中提取文件名
    const fileName = path.split('/').pop() || `photo_${i}.jpg`;
    zip.file(fileName, blob);
    if (onProgress) onProgress(i + 1, total);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${zipName}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * 将记录数组转换为扁平化 Excel 行（便于导出）
 * @param records 原始记录对象（含 formData）
 * @returns 扁平化后的对象数组
 */
export function flattenRecordsForExcel(records: any[]): any[] {
  return records.map(record => {
    const base = {
      id: record.id,
      type: record.type,
      address: record.address,
      street: record.street,
      community: record.community,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      photos_count: record.photos?.length || 0,
      task_id: record.taskId || '',
    };
    // 合并 formData
    const formData = record.formData || {};
    return { ...base, ...formData };
  });
}