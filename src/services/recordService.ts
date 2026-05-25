/**
 * 监测记录服务：增删改查、统计
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { MonitorRecord, CreateRecordInput, UpdateRecordInput, MapFilterParams, MapStatistics } from '../types';

export const recordService = {
  /**
   * 获取记录列表（支持筛选和分页）
   * @param params 筛选条件（街道、类型、日期范围、任务ID等）
   * @returns 记录数组
   */
  async list(params?: MapFilterParams & { viewBounds?: any; page?: number; pageSize?: number }): Promise<MonitorRecord[]> {
    return apiGet<MonitorRecord[]>('/records', params);
  },

  /**
   * 获取单条记录详情
   * @param id 记录ID
   */
  async get(id: string): Promise<MonitorRecord> {
    return apiGet<MonitorRecord>(`/records/${id}`);
  },

  /**
   * 创建记录
   * @param data 创建数据（不含 userId，后端从 token 获取）
   */
  async create(data: CreateRecordInput): Promise<MonitorRecord> {
    return apiPost<MonitorRecord>('/records', data);
  },

  /**
   * 更新记录
   * @param id 记录ID
   * @param data 更新数据
   */
  async update(id: string, data: UpdateRecordInput): Promise<MonitorRecord> {
    return apiPut<MonitorRecord>(`/records/${id}`, data);
  },

  /**
   * 删除记录
   * @param id 记录ID
   */
  async delete(id: string): Promise<void> {
    return apiDelete(`/records/${id}`);
  },

  /**
   * 获取统计数据（基于当前视图和筛选条件）
   * @param params 筛选条件（含视野范围）
   * @returns 各类别计数
   */
  async getStatistics(params: MapFilterParams & { viewBounds?: any }): Promise<MapStatistics> {
    return apiGet<MapStatistics>('/records/statistics', params);
  },
};