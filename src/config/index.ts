/**
 * 全局配置常量
 */

// 百度地图 API Key（从环境变量注入）
export const BAIDU_MAP_AK = import.meta.env.VITE_BAIDU_MAP_AK;

// Edge Function 网关地址
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Supabase 配置
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 固定行政区划
export const DISTRICT = '海珠区';

// 街道列表（18个）
export const STREETS = [
  '赤岗街道', '新港街道', '昌岗街道', '江南中街道', '滨江街道', '素社街道',
  '海幢街道', '南华西街道', '龙凤街道', '沙园街道', '南石头街道', '凤阳街道',
  '瑞宝街道', '江海街道', '琶洲街道', '南洲街道', '华洲街道', '官洲街道'
] as const;

// 居委会字典（示例数据，实际使用时需补全）
export const COMMUNITIES: Record<string, string[]> = {
  '赤岗街道': ['赤岗社区', '七星岗社区', '大江涌社区', '珠江帝景社区'],
  '新港街道': ['立新社区', '穗华社区', '海洋社区', '银禧社区'],
  '昌岗街道': ['晓港东社区', '晓港中社区', '江南雅居社区'],
  // 其他街道需根据实际情况补充
  // ...
};

// 积水类型枚举
export const WATER_TYPES = [
  '花盆托盘', '轮胎', '水缸', '地表凹槽', '废弃容器', '水沟', '其他'
];

// 成蚊监测方法枚举
export const ADULT_METHODS = [
  '诱蚊灯', '人工小时', '布雷图指数'
];

// 疾病类型枚举
export const DISEASE_TYPES = [
  '登革热', '基孔肯雅热', '寨卡病毒病'
];

// 防控圈半径（米）
export const CONTROL_RINGS = {
  CORE: 100,      // 核心区
  WARNING: 200,   // 警戒区
  MONITORING: 300 // 监控区
};

// 轨迹采集参数
export const TRACK_CONFIG = {
  MIN_DISTANCE_METERS: 5,  // 最小移动距离（米）
  BATCH_INTERVAL_MS: 30000, // 批量上传间隔（毫秒）
  MAX_BATCH_SIZE: 50        // 单次最大上传点数
};

// 图片压缩配置
export const IMAGE_CONFIG = {
  MAX_WIDTH: 800,
  QUALITY: 0.6,
  FORMAT: 'image/jpeg'
};

// 缓存名称（用于 Service Worker）
export const CACHE_NAMES = {
  STATIC: 'static-v1',
  BAIDU_TILES: 'baidu-tiles-v1',
  STORAGE_IMAGES: 'storage-images-v1'
};