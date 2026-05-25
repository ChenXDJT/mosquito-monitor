import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    BMapGL: any;
    __mapInstance: any;
  }
}

export const BaiduMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [_isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // 等待百度地图 API 加载完成
    const checkApiLoaded = () => {
      if (window.BMapGL) {
        initMap();
      } else {
        setTimeout(checkApiLoaded, 100);
      }
    };
    checkApiLoaded();
  }, []);

  const initMap = () => {
    if (!mapContainer.current) return;
    // 海珠区大致中心坐标（BD09）
    const center = new window.BMapGL.Point(113.317, 23.095);
    const map = new window.BMapGL.Map(mapContainer.current);
    map.centerAndZoom(center, 14);
    map.enableScrollWheelZoom(true);
    map.addControl(new window.BMapGL.NavigationControl());
    map.addControl(new window.BMapGL.ScaleControl());
    // 存储到全局，供其他组件使用
    window.__mapInstance = map;
    setIsMapReady(true);
  };

  return (
    <div
      ref={mapContainer}
      className="map-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};