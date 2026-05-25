/**
 * 用户相关类型定义
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  region: string;          // 负责街道（如 "赤岗街道"）
  disabledAt?: string;     // 禁用时间（软删除）
  createdAt: string;
}

export interface UserLoginResponse {
  access_token: string;
  user: User;
}

export interface CreateUserParams {
  username: string;
  password: string;
  role?: UserRole;
  region: string;
}

export interface UpdateUserParams {
  region?: string;
  password?: string;       // 重置密码时传入
}