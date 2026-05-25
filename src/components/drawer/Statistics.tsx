import React, { useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';
import { MapStatistics } from '../../types';

export const Statistics: React.FC = () => {
  const { getStatistics } = useMap();
  const [stats, setStats] = useState<MapStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 获取当前视野和筛选条件（筛选条件可从全局状态获取，简化：暂时不带筛选）
      const data = await getStatistics({});
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // 监听地图移动、筛选变化等，重新获取（可扩展）
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return <div>加载中...</div>;

  return (
    <div className="statistics-container">
      <h4>实时统计</h4>
      <div className="stat-grid">
        <div className="stat-item"><span>病例</span><strong>{stats?.caseCount || 0}</strong></div>
        <div className="stat-item"><span>积水点</span><strong>{stats?.waterCount || 0}</strong></div>
        <div className="stat-item"><span>黑点</span><strong>{stats?.blackspotCount || 0}</strong></div>
        <div className="stat-item"><span>成蚊</span><strong>{stats?.adultCount || 0}</strong></div>
        <div className="stat-item"><span>诱卵器</span><strong>{stats?.trapCount || 0}</strong></div>
        <div className="stat-item"><span>阳性积水</span><strong>{stats?.positiveWaterCount || 0}</strong></div>
        <div className="stat-item"><span>阳性诱卵器</span><strong>{stats?.positiveTrapCount || 0}</strong></div>
      </div>
      <button className="refresh-stats" onClick={fetchStats}>刷新</button>
    </div>
  );
};