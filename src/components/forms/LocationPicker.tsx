import React, { useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';

export interface PickedLocation {
  lng: number;
  lat: number;
  address: string;
}

interface LocationPickerProps {
  onLocationPicked: (location: PickedLocation) => void;
  initialLocation?: PickedLocation | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationPicked, initialLocation }) => {
  const { mapInstance, isMapReady } = useMap();
  const [isPicking, setIsPicking] = useState(false);
  const [tempMarker, setTempMarker] = useState<any>(null);
  const [displayAddress, setDisplayAddress] = useState(initialLocation?.address || '');

  // 清除临时标记
  const clearTempMarker = () => {
    if (tempMarker && mapInstance) {
      mapInstance.removeOverlay(tempMarker);
      setTempMarker(null);
    }
  };

  // 逆地理编码获取地址
  const reverseGeocode = (lng: number, lat: number): Promise<string> => {
    return new Promise((resolve) => {
      const geocoder = new window.BMapGL.Geocoder();
      geocoder.getLocation(new window.BMapGL.Point(lng, lat), (res: any) => {
        resolve(res?.address || `${lng.toFixed(6)}, ${lat.toFixed(6)}`);
      });
    });
  };

  const handleMapClick = async (e: any) => {
    if (!isPicking) return;
    const point = e.point; // BD09坐标
    const lng = point.lng;
    const lat = point.lat;
    const address = await reverseGeocode(lng, lat);
    clearTempMarker();
    // 放置临时标记
    const marker = new window.BMapGL.Marker(point);
    mapInstance.addOverlay(marker);
    setTempMarker(marker);
    setDisplayAddress(address);
    onLocationPicked({ lng, lat, address });
    setIsPicking(false);
    // 移除点击监听
    mapInstance.removeEventListener('click', handleMapClick);
  };

  const startPicking = () => {
    if (!mapInstance) return;
    setIsPicking(true);
    mapInstance.addEventListener('click', handleMapClick);
  };

  const cancelPicking = () => {
    if (mapInstance) {
      mapInstance.removeEventListener('click', handleMapClick);
    }
    setIsPicking(false);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (mapInstance) {
        mapInstance.removeEventListener('click', handleMapClick);
      }
      clearTempMarker();
    };
  }, [mapInstance]);

  // 如果传入了初始位置，展示文字（但不再重复触发回调）
  useEffect(() => {
    if (initialLocation && !displayAddress) {
      setDisplayAddress(initialLocation.address);
    }
  }, [initialLocation]);

  if (!isMapReady) return <div>地图加载中...</div>;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={startPicking}
          disabled={isPicking}
          style={{
            padding: '6px 12px',
            background: isPicking ? '#52c41a' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {isPicking ? '点击地图选点中...' : '在地图上选点'}
        </button>
        {isPicking && (
          <button
            type="button"
            onClick={cancelPicking}
            style={{ padding: '6px 12px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            取消
          </button>
        )}
      </div>
      {displayAddress && (
        <div style={{ fontSize: 12, color: '#666', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
          当前位置：{displayAddress}
        </div>
      )}
    </div>
  );
};