/**
 * 任务服务：任务 CRUD、轨迹管理
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Task, CreateTaskInput, UpdateTaskInput, TrackPoint } from '../types';

export const taskService = {
  /**
   * 获取所有任务（根据权限过滤）
   * @param params 可选筛选（status 等）
   */
  async list(params?: { status?: 'in_progress' | 'completed' }): Promise<Task[]> {
    return apiGet<Task[]>('/tasks', params);
  },

  /**
   * 获取单个任务详情
   * @param id 任务ID
   */
  async get(id: string): Promise<Task> {
    return apiGet<Task>(`/tasks/${id}`);
  },

  /**
   * 创建新任务
   * @param input 创建参数
   */
  async create(input: CreateTaskInput): Promise<Task> {
    return apiPost<Task>('/tasks', input);
  },

  /**
   * 开始任务（状态改为 in_progress）
   * @param id 任务ID
   */
  async start(id: string): Promise<Task> {
    return apiPut<Task>(`/tasks/${id}/start`);
  },

  /**
   * 完成任务（状态改为 completed，记录结束时间、报告）
   * @param id 任务ID
   * @param report 完成报告（存在问题、总路程等）
   */
  async complete(id: string, report?: { problems?: string; totalDistance?: number }): Promise<Task> {
    return apiPut<Task>(`/tasks/${id}/complete`, report);
  },

  /**
   * 更新任务信息
   * @param id 任务ID
   * @param data 更新内容
   */
  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    return apiPut<Task>(`/tasks/${id}`, data);
  },

  /**
   * 删除任务（软删除或硬删除，根据后端实现）
   * @param id 任务ID
   */
  async delete(id: string): Promise<void> {
    return apiDelete(`/tasks/${id}`);
  },

  /**
   * 批量上传轨迹点
   * @param taskId 任务ID
   * @param points 轨迹点数组
   */
  async addTracks(taskId: string, points: TrackPoint[]): Promise<void> {
    return apiPost(`/tasks/${taskId}/tracks`, { points });
  },

  /**
   * 获取任务的轨迹点（用于显示折线）
   * @param taskId 任务ID
   */
  async getTracks(taskId: string): Promise<TrackPoint[]> {
    return apiGet<TrackPoint[]>(`/tasks/${taskId}/tracks`);
  },
};