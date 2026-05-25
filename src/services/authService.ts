/**
 * 认证服务：登录、获取当前用户、登出
 */

import { apiPost, apiGet } from './api';
import { User, UserLoginResponse } from '../types';

export const authService = {
  /**
   * 登录
   * @param username 用户名
   * @param password 密码
   * @returns 包含 access_token 和 user 的对象
   */
  async login(username: string, password: string): Promise<UserLoginResponse> {
    return apiPost<UserLoginResponse>('/auth/login', { username, password });
  },

  /**
   * 获取当前登录用户信息
   * @returns 用户对象
   */
  async getCurrentUser(): Promise<User> {
    return apiGet<User>('/auth/me');
  },

  /**
   * 登出（通知后端使 refresh token 失效）
   */
  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      // 即使后端调用失败，前端也清除本地 token
      console.warn('登出接口调用失败', error);
    }
  },
};