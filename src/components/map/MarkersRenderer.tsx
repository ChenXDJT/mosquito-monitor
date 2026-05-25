import React, { useEffect, useRef } from 'react';
import { useRecords } from '../../hooks/useRecords';
import { useMap } from '../../hooks/useMap';
import { MonitorRecord, RecordType } from '../../types';
import { openInfoWindow } from './InfoWindow';

// 标记颜色和图标样式
const getMarkerColor = (type: RecordType, isExpired: boolean = false): string => {
  if (isExpired) return '#999999';
  const colors: Record<RecordType, string> = {
    case: '#ff4d4f',
    water: '#13c2c2',
    blackspot: '#1677ff',
    adult: '#722ed1',
    trap: '#faad14',
  };
  return colors[type];
};

const getEmoji = (type: RecordType): string => {
  const emojis: Record<RecordType, string> = {
    case: '🦟',
    water: '💧',
    blackspot: '⚠️',
    adult: '🦗',
    trap: '🧪',
  };
  return emojis[type];
};

// 使用 Canvas 绘制自定义 Marker 图标
const createCustomIcon = (type: RecordType, isExpired: boolean = false) => {
  const color = getMarkerColor(type, isExpired);
  const emoji = getEmoji(type);
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, 32, 32);
  // 绘制圆形背景
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // 绘制 emoji 文字
  ctx.font = '18px "Segoe UI Emoji"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 16, 16);
  return new window.BMapGL.Icon(canvas.toDataURL(), new window.BMapGL.Size(32, 32));
};

interface MarkersRendererProps {
  filters: any; // 筛选条件
  onMarkerClick?: (record: MonitorRecord) => void;
}

export const MarkersRenderer: React.FC<MarkersRendererProps> = ({ filters, onMarkerClick }) => {
  const { records, isLoading } = useRecords();
  const { mapInstance, isMapReady } = useMap();
  const markersRef = useRef<any[]>([]);

  // 判断记录是否过期（用于变灰）
  const isRecordExpired = (record: MonitorRecord): boolean => {
    const formData = record.formData as any;
    const today = new Date().toISOString().slice(0, 10);
    if (record.type === 'case') {
      // 病例：隔离结束日期小于今天
      return formData?.isolationEnd && formData.isolationEnd < today;
    }
    if (record.type === 'water' || record.type === 'blackspot') {
      return formData?.processedDate && formData.processedDate < today;
    }
    if (record.type === 'trap') {
      return formData?.positiveStatus === 'negative';
    }
    return false;
  };

  // 清除所有标记
  const clearMarkers = () => {
    if (!mapInstance) return;
    markersRef.current.forEach(marker => {
      mapInstance.removeOverlay(marker);
    });
    markersRef.current = [];
  };

  // 渲染标记
  const renderMarkers = () => {
    if (!mapInstance || !isMapReady) return;
    clearMarkers();
    if (!records.length) return;

    records.forEach(record => {
      const { lng, lat } = record.location;
      const point = new window.BMapGL.Point(lng, lat);
      const isExpired = isRecordExpired(record);
      const icon = createCustomIcon(record.type, isExpired);
      if (!icon) return;
      const marker = new window.BMapGL.Marker(point, { icon });
      marker.addEventListener('click', () => {
        openInfoWindow(mapInstance, record, {
          onEdit: () => onMarkerClick?.(record),
          onDelete: () => onMarkerClick?.(record),
        });
      });
      mapInstance.addOverlay(marker);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!isLoading && isMapReady) {
      renderMarkers();
    }
  }, [records, isLoading, isMapReady, filters]);

  return null;
};