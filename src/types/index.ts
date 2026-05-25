/**
 * 统一导出所有类型
 */

// 用户相关
export type { UserRole, User, UserLoginResponse, CreateUserParams, UpdateUserParams } from './user';

// 记录相关
export type {
  RecordType,
  LocationPoint,
  CaseFormData,
  WaterFormData,
  BlackspotFormData,
  AdultFormData,
  TrapFormData,
  RecordFormData,
  MonitorRecord,
  CreateRecordInput,
  UpdateRecordInput,
} from './record';

// 任务相关
export type {
  TaskStatus,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TrackPoint,
  TrackBatch,
} from './task';

// 地图相关
export type {
  BMapGLMap,
  BMapGLPoint,
  BMapGLMarker,
  ControlCircle,
  MapFilterParams,
  MapStatistics,
} from './map';