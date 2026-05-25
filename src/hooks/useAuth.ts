import { useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 token 获取当前用户信息
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('access_token');
      setUser(null);
      return null;
    }
  }, []);

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(username, password);
      localStorage.setItem('access_token', res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  // 手动刷新用户信息
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 初始化加载用户
  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  return { user, isLoading, login, logout, refreshUser };
}