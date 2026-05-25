/**
 * 管理员服务：子账号管理（仅管理员调用，后端会鉴权）
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { User, CreateUserParams, UpdateUserParams } from '../types';

export const adminService = {
  /**
   * 获取所有子账号（非 admin）
   */
  async listUsers(): Promise<User[]> {
    return apiGet<User[]>('/admin/users');
  },

  /**
   * 创建子账号
   * @param params 账号信息
   */
  async createUser(params: CreateUserParams): Promise<User> {
    return apiPost<User>('/admin/users', params);
  },

  /**
   * 更新子账号（修改负责区域或重置密码）
   * @param userId 用户ID
   * @param params 更新内容（region 或 password）
   */
  async updateUser(userId: string, params: UpdateUserParams): Promise<User> {
    return apiPut<User>(`/admin/users/${userId}`, params);
  },

  /**
   * 删除子账号（软删除，无法登录但数据保留）
   * @param userId 用户ID
   */
  async deleteUser(userId: string): Promise<void> {
    return apiDelete(`/admin/users/${userId}`);
  },
};