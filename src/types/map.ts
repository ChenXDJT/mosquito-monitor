/**
 * 百度地图相关类型（主要为了类型提示）
 */

// 百度地图 GL 实例（部分常用类型，非完整）
export interface BMapGLMap {
  centerAndZoom(point: any, zoom: number): void;
  enableScrollWheelZoom(): void;
  addControl(control: any): void;
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  getBounds(): any;
  panTo(point: any): void;
  addOverlay(overlay: any): void;
  removeOverlay(overlay: any): void;
  clearOverlays(): void;
}

export interface BMapGLPoint {
  lng: number;
  lat: number;
}

export interface BMapGLMarker {
  setIcon(icon: any): void;
}

// 防控圈参数
export interface ControlCircle {
  radius: number;        // 米
  strokeColor: string;
  strokeStyle: 'solid' | 'dashed';
  fillColor?: string;
}

// 地图筛选条件（前端传递）
export interface MapFilterParams {
  street?: string;
  community?: string;
  type?: string[];                // 选中的类型数组 ['case','water',...]
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  // 积水/黑点/成蚊专用统一日期范围
  generalDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  // 诱蚊诱卵器专用日期范围
  trapDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  taskId?: string;               // 任务筛选（隐藏历史数据时使用）
}

// 实时统计结果
export interface MapStatistics {
  caseCount: number;
  waterCount: number;
  blackspotCount: number;
  adultCount: number;
  trapCount: number;
  positiveWaterCount: number;
  positiveTrapCount: number;
}