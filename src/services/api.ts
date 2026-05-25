/**
 * 统一 API 请求封装
 * 自动携带 JWT token，处理错误和刷新逻辑
 */

import { API_BASE } from '../config';

// 请求选项
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;      // 是否跳过认证头（登录接口不需要）
}

// 核心请求函数
export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!skipAuth) {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // 处理 401 未授权（token 过期或无效）
  if (response.status === 401) {
    // 清除本地 token
    localStorage.removeItem('access_token');
    // 可触发全局登出事件
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('登录已过期，请重新登录');
  }

  // 尝试解析 JSON
  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = { success: false, error: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `请求失败: ${response.status}`;
    throw new Error(errorMsg);
  }

  // 如果后端返回格式为 { data: T } 或直接返回 T，这里简单处理
  // 假设大多数接口直接返回需要的对象或数组
  return data as T;
}

// GET 请求
export function apiGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  let url = path;
  if (params) {
    const search = new URLSearchParams(params).toString();
    if (search) url += `?${search}`;
  }
  return apiRequest<T>(url, { method: 'GET' });
}

// POST 请求
export function apiPost<T = any>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// PUT 请求
export function apiPut<T = any>(path: string, body?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// DELETE 请求
export function apiDelete<T = any>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}