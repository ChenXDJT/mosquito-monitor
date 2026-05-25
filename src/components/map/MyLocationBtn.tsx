import React, { useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';
import { wgs84ToBd09 } from '../../utils/coordTransform';

interface MyLocationBtnProps {
  enableTracking?: boolean; // 是否开启持续追踪模式
  onLocationChange?: (lng: number, lat: number) => void;
}

export const MyLocationBtn: React.FC<MyLocationBtnProps> = ({ enableTracking = false, onLocationChange }) => {
  const { mapInstance, isMapReady } = useMap();
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [myMarker, setMyMarker] = useState<any>(null);

  // 添加/更新我的位置标记
  const updateMyLocationMarker = (lng: number, lat: number) => {
    if (!mapInstance) return;
    const point = new window.BMapGL.Point(lng, lat);
    if (myMarker) {
      myMarker.setPosition(point);
    } else {
      // 创建紫色圆点标记
      const icon = new window.BMapGL.Icon(
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" fill="%239c27b0" stroke="white" stroke-width="2"/%3E%3Ccircle cx="16" cy="16" r="6" fill="white"/%3E%3C/svg%3E',
        new window.BMapGL.Size(32, 32)
      );
      const marker = new window.BMapGL.Marker(point, { icon });
      mapInstance.addOverlay(marker);
      setMyMarker(marker);
    }
    mapInstance.panTo(point);
    onLocationChange?.(lng, lat);
  };

  // 单次定位
  const locateOnce = () => {
    if (!navigator.geolocation) {
      alert('浏览器不支持地理定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        const [bdLng, bdLat] = wgs84ToBd09(longitude, latitude);
        updateMyLocationMarker(bdLng, bdLat);
      },
      (err) => {
        console.error('定位失败', err);
        alert('定位失败，请检查位置权限');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 开启持续追踪
  const startTracking = () => {
    if (watchId !== null) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        const [bdLng, bdLat] = wgs84ToBd09(longitude, latitude);
        updateMyLocationMarker(bdLng, bdLat);
      },
      (err) => console.error('追踪定位错误', err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    setWatchId(id);
    setTracking(true);
  };

  // 停止追踪
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  };

  const toggleTracking = () => {
    if (tracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  useEffect(() => {
    // 组件挂载时，如果 enableTracking 为 true，自动开启追踪
    if (enableTracking) {
      startTracking();
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableTracking]);

  // 未就绪时不显示按钮（或显示禁用状态）
  if (!isMapReady) return null;

  return (
    <div className="my-location-btn" style={{ position: 'absolute', bottom: 100, right: 12, zIndex: 200 }}>
      <button
        onClick={locateOnce}
        className="location-btn"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: 20,
          cursor: 'pointer',
          marginBottom: 8,
        }}
        title="我的位置"
      >
        🎯
      </button>
      {enableTracking && (
        <button
          onClick={toggleTracking}
          className="tracking-btn"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: tracking ? '#1890ff' : 'white',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: 20,
            cursor: 'pointer',
            color: tracking ? 'white' : '#333',
          }}
          title={tracking ? '停止跟随' : '持续追踪'}
        >
          {tracking ? '⏹️' : '📍'}
        </button>
      )}
    </div>
  );
};