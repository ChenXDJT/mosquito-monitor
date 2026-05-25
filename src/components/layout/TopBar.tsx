import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount } = useOfflineSync();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    // 跳转到登录页由路由处理
    window.location.href = '/login';
  };

  const getUserInitial = () => {
    if (!user?.username) return 'U';
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <div className="top-bar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="菜单">
        ☰
      </button>
      <div className="title">蚊媒监测系统</div>
      <div className="user-info" ref={menuRef}>
        {/* 离线状态指示器 */}
        {!isOnline && (
          <span className="offline-badge" title="离线模式">📶</span>
        )}
        {pendingCount > 0 && (
          <span className="pending-badge" title={`${pendingCount}项待同步`}>
            {pendingCount}
          </span>
        )}
        <div
          className="user-avatar"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          {getUserInitial()}
        </div>
        {showUserMenu && (
          <div className="user-dropdown">
            <div className="user-info-detail">
              <div className="username">{user?.username}</div>
              <div className="role">{user?.role === 'admin' ? '管理员' : '监测员'}</div>
              <div className="region">负责街道: {user?.region || '—'}</div>
            </div>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => window.location.href = '/profile'}>
              个人资料
            </button>
            <button className="dropdown-item logout" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
};