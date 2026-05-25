import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名或密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>蚊媒监测系统</h1>
          <p>登革热等蚊媒传染病现场监测</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="login-footer">
          <span>内部使用</span>
        </div>
      </div>
      <style>{`
        .login-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-container {
          width: 90%;
          max-width: 320px;
          background: white;
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
        }
        .login-header h1 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        .login-header p {
          font-size: 14px;
          color: #666;
          margin-bottom: 32px;
        }
        .login-form .form-group {
          margin-bottom: 16px;
        }
        .login-form input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border 0.2s;
        }
        .login-form input:focus {
          border-color: #667eea;
        }
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 8px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .login-btn {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          background: #5a67d8;
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 24px;
          font-size: 12px;
          color: #999;
        }
      `}</style>
    </div>
  );
};