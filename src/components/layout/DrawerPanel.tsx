import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Filters } from '../drawer/Filters';
import { TaskPanel } from '../drawer/TaskPanel';
import { RecordList } from '../drawer/RecordList';
import { ExportPanel } from '../drawer/ExportPanel';
import { UserManagement } from '../drawer/UserManagement';
import { OfflineMapCache } from '../drawer/OfflineMapCache';

interface DrawerPanelProps {
  open: boolean;
  onClose: () => void;
}

type TabKey = 'filters' | 'task' | 'records' | 'export' | 'admin' | 'offline';

export const DrawerPanel: React.FC<DrawerPanelProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabKey>('filters');

  // 防止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const tabs: { key: TabKey; label: string; adminOnly?: boolean }[] = [
    { key: 'filters', label: '筛选与统计' },
    { key: 'task', label: '任务' },
    { key: 'records', label: '记录列表' },
    { key: 'export', label: '数据导出' },
    { key: 'offline', label: '离线地图' },
    { key: 'admin', label: '账号管理', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || (tab.adminOnly && isAdmin));

  const renderContent = () => {
    switch (activeTab) {
      case 'filters':
        return <Filters />;
      case 'task':
        return <TaskPanel />;
      case 'records':
        return <RecordList />;
      case 'export':
        return <ExportPanel />;
      case 'offline':
        return <OfflineMapCache />;
      case 'admin':
        return isAdmin ? <UserManagement /> : null;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="drawer-mask visible" onClick={onClose} />
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <span>功能面板</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="drawer-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
};