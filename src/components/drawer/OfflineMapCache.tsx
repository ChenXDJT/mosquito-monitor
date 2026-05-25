import React, { useState } from 'react';
import { useMap } from '../../hooks/useMap';
import { getAllTileMeta, cacheTileMeta } from '../../utils/idbHelpers';

export const OfflineMapCache: React.FC = () => {
  const { mapInstance, getCurrentBounds } = useMap();
  const [caching, setCaching] = useState(false);
  const [cachedAreas, setCachedAreas] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const loadCacheMeta = async () => {
    const metas = await getAllTileMeta();
    setCachedAreas(metas);
  };

  const getTileUrls = (_bounds: any, zoom: number): string[] => {
    // 计算当前视野内的瓦片坐标范围（百度地图瓦片规则：http://online{0-3}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl&udt=20200101）
    // 简化实现：示例中只模拟几个 URL
    const urls: string[] = [];
    // 实际需要根据经纬度范围计算瓦片坐标，此处略，可参考百度地图瓦片算法
    for (let i = 0; i < 10; i++) {
      urls.push(`https://online0.map.bdimg.com/tile/?qt=tile&x=${i}&y=${i}&z=${zoom}`);
    }
    return urls;
  };

  const cacheCurrentView = async () => {
    if (!mapInstance) return;
    const bounds = getCurrentBounds();
    if (!bounds) return;
    const zoom = mapInstance.getZoom();
    const tileUrls = getTileUrls(bounds, zoom);
    setCaching(true);
    setProgress(0);
    const cache = await caches.open('baidu-tiles-v1');
    for (let i = 0; i < tileUrls.length; i++) {
      const url = tileUrls[i];
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        console.warn('缓存瓦片失败', url);
      }
      setProgress(((i + 1) / tileUrls.length) * 100);
    }
    // 保存元数据
    await cacheTileMeta(`${bounds.north}_${bounds.south}_${bounds.west}_${bounds.east}_${zoom}`, {
      bounds,
      zoom,
      timestamp: Date.now(),
    });
    await loadCacheMeta();
    setCaching(false);
    alert('缓存完成');
  };

  const clearCache = async () => {
    if (confirm('确定清除所有离线地图瓦片吗？')) {
      const cache = await caches.open('baidu-tiles-v1');
      const keys = await cache.keys();
      for (const key of keys) {
        await cache.delete(key);
      }
      // 清理元数据（可另行实现）
      alert('缓存已清除');
      setCachedAreas([]);
    }
  };

  React.useEffect(() => {
    loadCacheMeta();
  }, []);

  return (
    <div className="offline-cache">
      <h4>离线地图</h4>
      <p>预下载当前区域地图瓦片，可在无网络时查看底图。</p>
      <button onClick={cacheCurrentView} disabled={caching}>
        {caching ? `缓存中 ${Math.round(progress)}%` : '缓存当前可见区域'}
      </button>
      <button onClick={clearCache}>清除所有缓存</button>
      <div className="cached-areas">
        <h5>已缓存区域</h5>
        {cachedAreas.length === 0 && <div>暂无缓存</div>}
        {cachedAreas.map((area, idx) => (
          <div key={idx} className="cache-item">
            <span>缩放级别 {area.zoom}</span>
            <span>{new Date(area.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};