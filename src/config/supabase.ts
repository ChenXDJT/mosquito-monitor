/**
 * Supabase 客户端配置
 * 注意：前端仅使用 anon key 进行 Storage 上传和可能的实时订阅，
 * 所有业务数据操作统一通过 Edge Function，不在前端直接调用 supabase 数据库 API。
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './index';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('缺少 Supabase 环境变量，请检查 .env 文件');
}

// 创建 Supabase 客户端（公开访问，仅用于 Storage 和 Auth 辅助）
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // 禁用自动会话管理，因为我们使用自建 JWT
  },
});

// Storage 存储桶名称
export const STORAGE_BUCKET = 'mosquito-photos';

// 获取照片的公开 URL（需要经过 Storage 桶策略允许公开读取）
export const getPhotoPublicUrl = (path: string) => {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
};