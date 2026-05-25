import { useEffect, useState, useRef, useCallback } from 'react';
import { MapFilterParams, MapStatistics } from '../types';
import { recordService } from '../services/recordService';

// 声明全局百度地图实例
declare global {
  interface Window {
    BMapGL: any;
    __mapInstance: any;
  }
}

interface UseMapReturn {
  mapInstance: any; // BMapGL.Map 实例
  isMapReady: boolean;
  centerToLocation: (lng: number, lat: number, zoom?: number) => void;
  addMarker: (options: any) => any;
  clearMarkers: () => void;
  refreshMarkers: (filters: MapFilterParams) => Promise<void>;
  getCurrentBounds: () => any;
  getStatistics: (filters: MapFilterParams) => Promise<MapStatistics>;
}

export function useMap(): UseMapReturn {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  // 等待地图 API 加载完成
  useEffect(() => {
    const checkMap = () => {
      if (window.__mapInstance) {
        setMapInstance(window.__mapInstance);
        setIsMapReady(true);
      } else {
        setTimeout(checkMap, 100);
      }
    };
    checkMap();
  }, []);

  // 移动地图中心
  const centerToLocation = useCallback((lng: number, lat: number, zoom?: number) => {
    if (!mapInstance) return;
    const point = new window.BMapGL.Point(lng, lat);
    mapInstance.centerAndZoom(point, zoom || 16);
  }, [mapInstance]);

  // 添加单个标记（不保存到全局数组，由调用者管理）
  const addMarker = useCallback((options: any) => {
    if (!mapInstance) return null;
    const { lng, lat, icon, title, onClick } = options;
    const point = new window.BMapGL.Point(lng, lat);
    const marker = new window.BMapGL.Marker(point, { icon });
    if (title) marker.setTitle(title);
    marker.addEventListener('click', onClick);
    mapInstance.addOverlay(marker);
    return marker;
  }, [mapInstance]);

  // 清除所有标记
  const clearMarkers = useCallback(() => {
    if (!mapInstance) return;
    markersRef.current.forEach(marker => {
      mapInstance.removeOverlay(marker);
    });
    markersRef.current = [];
    circlesRef.current.forEach(circle => {
      mapInstance.removeOverlay(circle);
    });
    circlesRef.current = [];
  }, [mapInstance]);

  // 根据筛选条件刷新标记（实际调用 service 获取数据后触发外部重新渲染）
  const refreshMarkers = useCallback(async (filters: MapFilterParams) => {
    if (!mapInstance) return;
    // 获取地图当前视野边界
    const bounds = mapInstance.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const viewBounds = {
      north: ne.lat,
      east: ne.lng,
      south: sw.lat,
      west: sw.lng,
    };
    // 获取记录数据（不直接返回，由外部组件通过 useRecords 重新渲染）
    await recordService.list({ ...filters, viewBounds });
    // 注意：这里不需要返回 records，实际地图标记的渲染由 MarkersRenderer 组件根据 useRecords 的数据自动完成
    // 如果需要在获取数据后执行其他操作（如清空标记），可以在外部调用 clearMarkers 并重新渲染
  }, [mapInstance]);

  // 获取当前地图视野范围
  const getCurrentBounds = useCallback(() => {
    if (!mapInstance) return null;
    const bounds = mapInstance.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    return {
      north: ne.lat,
      east: ne.lng,
      south: sw.lat,
      west: sw.lng,
    };
  }, [mapInstance]);

  // 获取统计数据
  const getStatistics = useCallback(async (filters: MapFilterParams) => {
    const bounds = getCurrentBounds();
    return await recordService.getStatistics({ ...filters, viewBounds: bounds });
  }, [getCurrentBounds]);

  return {
    mapInstance,
    isMapReady,
    centerToLocation,
    addMarker,
    clearMarkers,
    refreshMarkers,
    getCurrentBounds,
    getStatistics,
  };
}