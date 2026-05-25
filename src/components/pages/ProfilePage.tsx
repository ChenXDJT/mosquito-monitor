import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少6位' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // 调用修改密码 API（需后端支持）
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '修改失败');
      }
      setMessage({ type: 'success', text: '密码修改成功，请重新登录' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '修改失败，请检查原密码' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={handleBack}>← 返回</button>
          <h2>个人资料</h2>
        </div>
        <div className="profile-info">
          <div className="info-item">
            <label>用户名</label>
            <span>{user.username}</span>
          </div>
          <div className="info-item">
            <label>角色</label>
            <span>{user.role === 'admin' ? '管理员' : '监测员'}</span>
          </div>
          <div className="info-item">
            <label>负责街道</label>
            <span>{user.region || '—'}</span>
          </div>
        </div>

        <div className="password-section">
          <h3>修改密码</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <input
                type="password"
                placeholder="当前密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="新密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="确认新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
            <button type="submit" disabled={loading} className="change-pwd-btn">
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .profile-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f5f5f5;
          overflow-y: auto;
        }
        .profile-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 16px;
          color: #1890ff;
          cursor: pointer;
          padding: 8px 0;
        }
        .profile-header h2 {
          margin: 0;
          font-size: 20px;
        }
        .profile-info {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-item label {
          font-weight: 500;
          color: #666;
        }
        .info-item span {
          color: #1a1a1a;
        }
        .password-section {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .password-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        .form-group input:focus {
          outline: none;
          border-color: #1890ff;
        }
        .message {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .message.success {
          background: #e6f7e6;
          color: #2e7d32;
        }
        .message.error {
          background: #fee2e2;
          color: #dc2626;
        }
        .change-pwd-btn {
          width: 100%;
          padding: 12px;
          background: #1890ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        }
        .change-pwd-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};