/**
 * API Gateway Edge Function
 * 统一处理前端所有请求，负责鉴权、业务逻辑和数据持久化
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

// ---------- 初始化 Supabase 客户端（使用 service_role 绕过 RLS）----------
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = Deno.env.get('JWT_SECRET')!;
const JWT_EXPIRES_IN = 24 * 60 * 60; // 24 小时

// ---------- 工具函数 ----------
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// 从请求中提取 JWT 并验证
async function verifyAuth(req: Request): Promise<{ userId: string; role: string; region: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, JWT_SECRET, 'HS512');
    return {
      userId: payload.user_id,
      role: payload.role,
      region: payload.region,
    };
  } catch {
    return null;
  }
}

// 检查是否为管理员
function isAdmin(auth: { role: string } | null) {
  return auth?.role === 'admin';
}

// ---------- 路由处理函数 ----------
async function handleLogin(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return errorResponse('用户名和密码不能为空', 400);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password_hash, role, region')
    .eq('username', username)
    .maybeSingle();

  if (error || !user) return errorResponse('用户名或密码错误', 401);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return errorResponse('用户名或密码错误', 401);

  const payload = {
    user_id: user.id,
    role: user.role,
    region: user.region,
    exp: getNumericDate(JWT_EXPIRES_IN),
  };
  const jwt = await create({ alg: 'HS512', typ: 'JWT' }, payload, JWT_SECRET);
  return jsonResponse({
    access_token: jwt,
    user: { id: user.id, username: user.username, role: user.role, region: user.region },
  });
}

async function handleMe(auth: { userId: string } | null) {
  if (!auth) return errorResponse('未授权', 401);
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, role, region')
    .eq('id', auth.userId)
    .single();
  if (error || !user) return errorResponse('用户不存在', 404);
  return jsonResponse(user);
}

async function handleLogout() {
  // 前端清除 token 即可，后端可做黑名单（可选，简化版不实现）
  return jsonResponse({ success: true });
}

// 记录列表（支持筛选和视野范围）
async function handleGetRecords(req: Request, auth: { userId: string; role: string }) {
  const url = new URL(req.url);
  const street = url.searchParams.get('street');
  const community = url.searchParams.get('community');
  const type = url.searchParams.get('type'); // 多类型用逗号分隔
  const taskId = url.searchParams.get('taskId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const trapStart = url.searchParams.get('trapStart');
  const trapEnd = url.searchParams.get('trapEnd');
  const generalStart = url.searchParams.get('generalStart');
  const generalEnd = url.searchParams.get('generalEnd');
  const viewBounds = url.searchParams.get('viewBounds'); // JSON: {north,south,east,west}

  let query = supabase.from('records').select('*');
  // 权限过滤：普通用户只能看自己的记录
  if (auth.role !== 'admin') {
    query = query.eq('user_id', auth.userId);
  }
  if (street) query = query.eq('street', street);
  if (community) query = query.eq('community', community);
  if (taskId) query = query.eq('task_id', taskId);
  if (type) {
    const types = type.split(',');
    query = query.in('type', types);
  }
  // 日期范围：病例用发病日期（form_data->>onsetDate）
  if (startDate && endDate) {
    query = query.or(`form_data->>onsetDate.gte.${startDate},form_data->>onsetDate.lte.${endDate}`);
  }
  // 诱蚊诱卵器日期范围
  if (trapStart && trapEnd) {
    query = query.or(`form_data->>markedDate.gte.${trapStart},form_data->>markedDate.lte.${trapEnd}`);
  }
  // 积水/黑点/成蚊统一日期范围（处理日期 processedDate 或标记日期）
  if (generalStart && generalEnd) {
    query = query.or(`form_data->>processedDate.gte.${generalStart},form_data->>processedDate.lte.${generalEnd}`);
  }
  // 视野范围过滤（坐标在矩形内）
  if (viewBounds) {
    const bounds = JSON.parse(viewBounds);
    query = query.filter('location->>lng', 'gte', bounds.west)
                 .filter('location->>lng', 'lte', bounds.east)
                 .filter('location->>lat', 'gte', bounds.south)
                 .filter('location->>lat', 'lte', bounds.north);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleCreateRecord(req: Request, auth: { userId: string }) {
  const body = await req.json();
  const { type, location, address, district, street, community, photos, formData, taskId } = body;
  if (!type || !location) return errorResponse('缺少必要字段', 400);
  const { data, error } = await supabase
    .from('records')
    .insert({
      user_id: auth.userId,
      type,
      location,
      address: address || '',
      district: district || '海珠区',
      street: street || '',
      community: community || '',
      photos: photos || [],
      form_data: formData || {},
      task_id: taskId || null,
    })
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data, 201);
}

async function handleUpdateRecord(req: Request, auth: { userId: string; role: string }, id: string) {
  const body = await req.json();
  // 先检查权限
  const { data: existing, error: fetchErr } = await supabase
    .from('records')
    .select('user_id')
    .eq('id', id)
    .single();
  if (fetchErr || !existing) return errorResponse('记录不存在', 404);
  if (auth.role !== 'admin' && existing.user_id !== auth.userId) {
    return errorResponse('无权修改此记录', 403);
  }
  const { data, error } = await supabase
    .from('records')
    .update({
      location: body.location,
      address: body.address,
      street: body.street,
      community: body.community,
      photos: body.photos,
      form_data: body.formData,
      task_id: body.taskId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleDeleteRecord(req: Request, auth: { userId: string; role: string }, id: string) {
  const { data: existing, error: fetchErr } = await supabase
    .from('records')
    .select('user_id')
    .eq('id', id)
    .single();
  if (fetchErr || !existing) return errorResponse('记录不存在', 404);
  if (auth.role !== 'admin' && existing.user_id !== auth.userId) {
    return errorResponse('无权删除此记录', 403);
  }
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ success: true });
}

// 统计接口（简化：返回各类数量）
async function handleGetStatistics(req: Request, auth: { userId: string; role: string }) {
  const url = new URL(req.url);
  const street = url.searchParams.get('street');
  const community = url.searchParams.get('community');
  let query = supabase.from('records').select('type, form_data', { count: 'exact' });
  if (auth.role !== 'admin') query = query.eq('user_id', auth.userId);
  if (street) query = query.eq('street', street);
  if (community) query = query.eq('community', community);
  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  const stats = {
    caseCount: 0,
    waterCount: 0,
    blackspotCount: 0,
    adultCount: 0,
    trapCount: 0,
    positiveWaterCount: 0,
    positiveTrapCount: 0,
  };
  for (const rec of data) {
    switch (rec.type) {
      case 'case': stats.caseCount++; break;
      case 'water': stats.waterCount++; if (rec.form_data?.positiveStatus === 'positive') stats.positiveWaterCount++; break;
      case 'blackspot': stats.blackspotCount++; break;
      case 'adult': stats.adultCount++; break;
      case 'trap': stats.trapCount++; if (rec.form_data?.positiveStatus === 'positive') stats.positiveTrapCount++; break;
    }
  }
  return jsonResponse(stats);
}

// 任务相关
async function handleGetTasks(req: Request, auth: { userId: string; role: string }) {
  let query = supabase.from('tasks').select('*');
  if (auth.role !== 'admin') query = query.eq('user_id', auth.userId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleCreateTask(req: Request, auth: { userId: string }) {
  const { name, date, region, hideHistory } = await req.json();
  if (!name || !date || !region) return errorResponse('缺少必要字段', 400);
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      name,
      date,
      region,
      hide_history: hideHistory || false,
      user_id: auth.userId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data, 201);
}

async function handleStartTask(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleCompleteTask(req: Request, id: string) {
  const { problems, totalDistance } = await req.json();
  const summaryStats = { problems, totalDistance };
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      summary_stats: summaryStats,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleUpdateTask(req: Request, id: string) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleDeleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ success: true });
}

// 轨迹
async function handleAddTracks(req: Request, taskId: string, auth: { userId: string }) {
  const { points } = await req.json();
  if (!points || !Array.isArray(points)) return errorResponse('无效轨迹数据', 400);
  const { data, error } = await supabase
    .from('task_tracks')
    .insert({
      task_id: taskId,
      user_id: auth.userId,
      points,
      uploaded_at: new Date().toISOString(),
    });
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ success: true });
}

async function handleGetTracks(taskId: string) {
  const { data, error } = await supabase
    .from('task_tracks')
    .select('points')
    .eq('task_id', taskId)
    .order('uploaded_at', { ascending: true });
  if (error) return errorResponse(error.message, 500);
  const allPoints = data.flatMap(t => t.points);
  return jsonResponse(allPoints);
}

async function handleGetTaskRecords(taskId: string, auth: { userId: string; role: string }) {
  let query = supabase.from('records').select('*').eq('task_id', taskId);
  if (auth.role !== 'admin') query = query.eq('user_id', auth.userId);
  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

// 导出（全量记录）
async function handleExportRecords(req: Request, auth: { userId: string; role: string }) {
  let query = supabase.from('records').select('*');
  if (auth.role !== 'admin') query = query.eq('user_id', auth.userId);
  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

// 子账号管理（仅管理员）
async function handleAdminListUsers(auth: { role: string }) {
  if (!isAdmin(auth)) return errorResponse('无权限', 403);
  const { data, error } = await supabase.from('users').select('id, username, role, region, created_at').eq('role', 'user');
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleAdminCreateUser(req: Request, auth: { role: string }) {
  if (!isAdmin(auth)) return errorResponse('无权限', 403);
  const { username, password, region } = await req.json();
  if (!username || !password || !region) return errorResponse('缺少必要字段', 400);
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const { data, error } = await supabase
    .from('users')
    .insert({ username, password_hash: hash, role: 'user', region })
    .select('id, username, role, region, created_at')
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data, 201);
}

async function handleAdminUpdateUser(req: Request, userId: string, auth: { role: string }) {
  if (!isAdmin(auth)) return errorResponse('无权限', 403);
  const body = await req.json();
  const updateData: any = {};
  if (body.region) updateData.region = body.region;
  if (body.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password_hash = await bcrypt.hash(body.password, salt);
  }
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, username, role, region, created_at')
    .single();
  if (error) return errorResponse(error.message, 500);
  return jsonResponse(data);
}

async function handleAdminDeleteUser(userId: string, auth: { role: string }) {
  if (!isAdmin(auth)) return errorResponse('无权限', 403);
  const { error } = await supabase.from('users').update({ disabled_at: new Date().toISOString() }).eq('id', userId);
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ success: true });
}

// ---------- 路由分发 ----------
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api-gateway', ''); // 函数名为 api-gateway
  const method = req.method;

  // 解析 JWT（登录接口除外）
  let auth = null;
  if (path !== '/auth/login') {
    auth = await verifyAuth(req);
    if (!auth) return errorResponse('未授权', 401);
  }

  // 路由表
  if (path === '/auth/login' && method === 'POST') return handleLogin(req);
  if (path === '/auth/me' && method === 'GET') return handleMe(auth);
  if (path === '/auth/logout' && method === 'POST') return handleLogout();

  if (path === '/records' && method === 'GET') return handleGetRecords(req, auth!);
  if (path === '/records' && method === 'POST') return handleCreateRecord(req, auth!);
  if (path.match(/^\/records\/[^\/]+$/) && method === 'PUT') {
    const id = path.split('/')[2];
    return handleUpdateRecord(req, auth!, id);
  }
  if (path.match(/^\/records\/[^\/]+$/) && method === 'DELETE') {
    const id = path.split('/')[2];
    return handleDeleteRecord(req, auth!, id);
  }
  if (path === '/records/statistics' && method === 'GET') return handleGetStatistics(req, auth!);

  if (path === '/tasks' && method === 'GET') return handleGetTasks(req, auth!);
  if (path === '/tasks' && method === 'POST') return handleCreateTask(req, auth!);
  if (path.match(/^\/tasks\/[^\/]+\/start$/) && method === 'PUT') {
    const id = path.split('/')[2];
    return handleStartTask(id);
  }
  if (path.match(/^\/tasks\/[^\/]+\/complete$/) && method === 'PUT') {
    const id = path.split('/')[2];
    return handleCompleteTask(req, id);
  }
  if (path.match(/^\/tasks\/[^\/]+$/) && method === 'PUT') {
    const id = path.split('/')[2];
    return handleUpdateTask(req, id);
  }
  if (path.match(/^\/tasks\/[^\/]+$/) && method === 'DELETE') {
    const id = path.split('/')[2];
    return handleDeleteTask(id);
  }
  if (path.match(/^\/tasks\/[^\/]+\/tracks$/) && method === 'POST') {
    const id = path.split('/')[2];
    return handleAddTracks(req, id, auth!);
  }
  if (path.match(/^\/tasks\/[^\/]+\/tracks$/) && method === 'GET') {
    const id = path.split('/')[2];
    return handleGetTracks(id);
  }
  if (path.match(/^\/tasks\/[^\/]+\/records$/) && method === 'GET') {
    const id = path.split('/')[2];
    return handleGetTaskRecords(id, auth!);
  }

  if (path === '/export/records' && method === 'GET') return handleExportRecords(req, auth!);

  if (path === '/admin/users' && method === 'GET') return handleAdminListUsers(auth!);
  if (path === '/admin/users' && method === 'POST') return handleAdminCreateUser(req, auth!);
  if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'PUT') {
    const userId = path.split('/')[3];
    return handleAdminUpdateUser(req, userId, auth!);
  }
  if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'DELETE') {
    const userId = path.split('/')[3];
    return handleAdminDeleteUser(userId, auth!);
  }

  return errorResponse('Not Found', 404);
});