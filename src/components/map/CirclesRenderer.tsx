import React, { useEffect, useRef } from 'react';
import { useRecords } from '../../hooks/useRecords';
import { useMap } from '../../hooks/useMap';
import { CONTROL_RINGS } from '../../config';

// 防控圈配置
const RING_CONFIG = {
  core: {
    radius: CONTROL_RINGS.CORE,
    strokeColor: '#ff4d4f',
    strokeStyle: 'dashed',
    fillColor: 'rgba(255, 77, 79, 0.1)',
  },
  warning: {
    radius: CONTROL_RINGS.WARNING,
    strokeColor: '#1677ff',
    strokeStyle: 'dashed',
    fillColor: 'rgba(22, 119, 255, 0.08)',
  },
  monitoring: {
    radius: CONTROL_RINGS.MONITORING,
    strokeColor: '#52c41a',
    strokeStyle: 'dashed',
    fillColor: 'rgba(82, 196, 26, 0.05)',
  },
};

interface CirclesRendererProps {
  enabledRings: {
    core: boolean;
    warning: boolean;
    monitoring: boolean;
  };
}

export const CirclesRenderer: React.FC<CirclesRendererProps> = ({ enabledRings }) => {
  const { records } = useRecords();
  const { mapInstance, isMapReady } = useMap();
  const circlesRef = useRef<any[]>([]);

  const clearCircles = () => {
    if (!mapInstance) return;
    circlesRef.current.forEach(circle => {
      mapInstance.removeOverlay(circle);
    });
    circlesRef.current = [];
  };

  const renderCircles = () => {
    if (!mapInstance || !isMapReady) return;
    clearCircles();

    // 只对病例类型绘制防控圈
    const caseRecords = records.filter(r => r.type === 'case');
    caseRecords.forEach(record => {
      const { lng, lat } = record.location;
      const point = new window.BMapGL.Point(lng, lat);
      const today = new Date().toISOString().slice(0, 10);
      const formData = record.formData as any;
      const isExpired = formData?.isolationEnd && formData.isolationEnd < today;
      // 过期病例使用实线灰色
      const strokeStyle = isExpired ? 'solid' : 'dashed';
      const strokeColor = isExpired ? '#999' : undefined;

      if (enabledRings.core) {
        const circle = new window.BMapGL.Circle(point, RING_CONFIG.core.radius, {
          strokeColor: strokeColor || RING_CONFIG.core.strokeColor,
          strokeWeight: 2,
          strokeStyle,
          fillColor: RING_CONFIG.core.fillColor,
          fillOpacity: 0.1,
        });
        mapInstance.addOverlay(circle);
        circlesRef.current.push(circle);
      }
      if (enabledRings.warning) {
        const circle = new window.BMapGL.Circle(point, RING_CONFIG.warning.radius, {
          strokeColor: strokeColor || RING_CONFIG.warning.strokeColor,
          strokeWeight: 2,
          strokeStyle,
          fillColor: RING_CONFIG.warning.fillColor,
          fillOpacity: 0.08,
        });
        mapInstance.addOverlay(circle);
        circlesRef.current.push(circle);
      }
      if (enabledRings.monitoring) {
        const circle = new window.BMapGL.Circle(point, RING_CONFIG.monitoring.radius, {
          strokeColor: strokeColor || RING_CONFIG.monitoring.strokeColor,
          strokeWeight: 2,
          strokeStyle,
          fillColor: RING_CONFIG.monitoring.fillColor,
          fillOpacity: 0.05,
        });
        mapInstance.addOverlay(circle);
        circlesRef.current.push(circle);
      }
    });
  };

  useEffect(() => {
    renderCircles();
  }, [records, isMapReady, enabledRings]);

  return null;
};