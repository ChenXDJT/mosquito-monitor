/**
 * 任务相关类型定义
 */

export type TaskStatus = 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  date: string;           // 任务日期 YYYY-MM-DD
  status: TaskStatus;
  userId: string;
  region: string;         // 任务负责街道
  hideHistory: boolean;   // 是否隐藏历史数据（仅显示本任务记录）
  startedAt: string;
  endedAt?: string | null;
  summaryStats?: {
    totalRecords?: number;
    caseCount?: number;
    waterCount?: number;
    blackspotCount?: number;
    adultCount?: number;
    trapCount?: number;
    positiveWaterCount?: number;
    positiveTrapCount?: number;
    totalDistance?: number; // 轨迹总路程（米）
  };
  createdAt: string;
}

export interface CreateTaskInput {
  name: string;
  date: string;
  region: string;
  hideHistory: boolean;
}

export interface UpdateTaskInput {
  name?: string;
  status?: TaskStatus;
  endedAt?: string;
  summaryStats?: Task['summaryStats'];
}

// 轨迹点（单个）
export interface TrackPoint {
  lng: number;
  lat: number;
  timestamp: number;    // Unix 毫秒
  accuracy?: number;
}

// 轨迹批次（批量上传）
export interface TrackBatch {
  taskId: string;
  points: TrackPoint[];
}