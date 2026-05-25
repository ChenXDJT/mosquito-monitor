/**
 * 监测记录相关类型定义
 */

export type RecordType = 'case' | 'water' | 'blackspot' | 'adult' | 'trap';

// 坐标点 (经度, 纬度, 百度BD09坐标系)
export interface LocationPoint {
  lng: number;
  lat: number;
}

// 病例专用字段
export interface CaseFormData {
  caseNumber: string;          // 病例编号
  diseaseType: string;         // 疾病类型
  patientName: string;
  onsetDate: string;           // 发病日期
  isolationStart: string;
  isolationEnd: string;
  epidemicEndDate: string;     // 疫点结束日期
}

// 积水点字段
export interface WaterFormData {
  waterType: string;           // 积水类型
  positiveStatus: 'pending' | 'positive'; // 待检测/阳性
  processedDate?: string;
}

// 黑点字段
export interface BlackspotFormData {
  description: string;
  remark?: string;
  processedDate?: string;
}

// 成蚊监测字段
export interface AdultFormData {
  method: string;              // 诱蚊灯/人工小时/布雷图指数
  density: number;
  species: string;
}

// 诱蚊诱卵器字段
export interface TrapFormData {
  placementDate: string;
  isValid: boolean;
  invalidReason?: string;
  positiveStatus: 'pending' | 'positive' | 'negative';
  markedDate: string;
 回收日期?: string;
}

// 联合类型：根据 type 决定具体结构
export type RecordFormData =
  | ({ type: 'case' } & CaseFormData)
  | ({ type: 'water' } & WaterFormData)
  | ({ type: 'blackspot' } & BlackspotFormData)
  | ({ type: 'adult' } & AdultFormData)
  | ({ type: 'trap' } & TrapFormData);

// 数据库存储的记录结构
export interface MonitorRecord {
  id: string;
  userId: string;
  taskId?: string | null;
  type: RecordType;
  location: LocationPoint;
  address: string;              // 反地理编码得到的详细地址
  district: string;             // 固定 "海珠区"
  street: string;               // 街道
  community: string;            // 居委会
  photos: string[];             // Supabase Storage 文件路径数组
  formData: RecordFormData;     // 各类型特有字段（JSONB）
  createdAt: string;
  updatedAt: string;
}

// 创建记录时的输入（不含 id、userId 等）
export type CreateRecordInput = Omit<MonitorRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string;  // 后端会从 token 获取
};

// 更新记录输入
export type UpdateRecordInput = Partial<Omit<MonitorRecord, 'id' | 'userId' | 'createdAt'>>;