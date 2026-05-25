import React from 'react';
import { MonitorRecord } from '../../types';
import { getPhotoPublicUrl } from '../../config/supabase';
import { recordService } from '../../services/recordService';

interface InfoWindowOptions {
  onEdit?: (record: MonitorRecord) => void;
  onDelete?: (record: MonitorRecord) => void;
}

export const openInfoWindow = (mapInstance: any, record: MonitorRecord, options: InfoWindowOptions) => {
  const { onEdit, onDelete: _onDelete } = options;

  // 构建照片缩略图 HTML
  const photoThumbs = (record.photos || []).slice(0, 3).map((path: string) => {
    const url = getPhotoPublicUrl(path);
    return `<img src="${url}?width=80&height=80" style="width:60px;height:60px;object-fit:cover;margin:2px;border-radius:4px;" />`;
  }).join('');

  const formDataHtml = `<pre style="font-size:12px;margin:4px 0;white-space:pre-wrap;">${JSON.stringify(record.formData, null, 2)}</pre>`;

  const content = `
    <div style="max-width:260px;font-size:13px;">
      <div><strong>类型：</strong>${record.type}</div>
      <div><strong>地址：</strong>${record.address || '—'}</div>
      <div><strong>街道/居委：</strong>${record.street} / ${record.community}</div>
      <div><strong>创建时间：</strong>${new Date(record.createdAt).toLocaleString()}</div>
      <div><strong>详细信息：</strong>${formDataHtml}</div>
      ${photoThumbs ? `<div><strong>照片：</strong><div style="display:flex;flex-wrap:wrap;">${photoThumbs}</div></div>` : ''}
      <div class="info-window-buttons" style="display:flex;gap:8px;margin-top:12px;">
        <button id="info-edit-btn" style="flex:1;padding:6px;background:#1890ff;color:white;border:none;border-radius:4px;">编辑</button>
        <button id="info-delete-btn" style="flex:1;padding:6px;background:#ff4d4f;color:white;border:none;border-radius:4px;">删除</button>
      </div>
    </div>
  `;

  const point = new window.BMapGL.Point(record.location.lng, record.location.lat);
  const infoWindow = new window.BMapGL.InfoWindow(content, {
    width: 280,
    enableMessage: true,
  });
  mapInstance.openInfoWindow(infoWindow, point);

  setTimeout(() => {
    const editBtn = document.getElementById('info-edit-btn');
    const deleteBtn = document.getElementById('info-delete-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        mapInstance.closeInfoWindow();
        onEdit?.(record);
      };
    }
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (confirm('确定删除该记录吗？')) {
          try {
            await recordService.delete(record.id);
            mapInstance.closeInfoWindow();
            window.dispatchEvent(new CustomEvent('record-deleted', { detail: { id: record.id } }));
          } catch (error) {
            alert('删除失败：' + error);
          }
        }
      };
    }
  }, 100);
};

export const InfoWindowComponent: React.FC = () => null;