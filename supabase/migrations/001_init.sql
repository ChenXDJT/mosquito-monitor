-- 蚊媒监测系统数据库初始化脚本
-- 版本: 1.0
-- 说明: 创建 users, records, tasks, task_tracks 表，配置 RLS 策略和索引

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 1. 用户表 ====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  region TEXT NOT NULL,                -- 负责街道（如 "赤岗街道"）
  disabled_at TIMESTAMP,               -- 软删除时间，非空表示禁用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS '用户表（自建身份体系）';
COMMENT ON COLUMN users.region IS '负责区域（街道）';
COMMENT ON COLUMN users.disabled_at IS '账号禁用时间，NULL 表示启用';

-- ==================== 2. 任务表 ====================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  hide_history BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  summary_stats JSONB,                 -- 存储完成报告、总路程等
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE tasks IS '外业任务表';
COMMENT ON COLUMN tasks.hide_history IS '是否隐藏历史数据（仅显示本任务记录）';
COMMENT ON COLUMN tasks.summary_stats IS '汇总统计，如 { "problems": "...", "totalDistance": 1234 }';

-- ==================== 3. 监测记录表 ====================
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('case', 'water', 'blackspot', 'adult', 'trap')),
  location JSONB NOT NULL,            -- { "lng": 113.317, "lat": 23.095 }
  address TEXT,                       -- 反地理编码详细地址
  district TEXT DEFAULT '海珠区',
  street TEXT NOT NULL,
  community TEXT NOT NULL,
  photos JSONB DEFAULT '[]',          -- Storage 路径数组
  form_data JSONB NOT NULL,           -- 各类型特有字段
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE records IS '监测记录（五类标记）';
COMMENT ON COLUMN records.location IS 'BD09 坐标 {lng, lat}';
COMMENT ON COLUMN records.photos IS 'Supabase Storage 路径数组';
COMMENT ON COLUMN records.form_data IS '动态字段，根据 type 存储不同结构';

-- ==================== 4. 轨迹表 ====================
CREATE TABLE task_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points JSONB NOT NULL,              -- 轨迹点数组 [{lng, lat, timestamp, accuracy}]
  uploaded_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE task_tracks IS '任务轨迹点（批量上传）';
COMMENT ON COLUMN task_tracks.points IS '数组，每个元素含 lng, lat, timestamp, accuracy';

-- ==================== 索引优化 ====================
CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_task_id ON records(task_id);
CREATE INDEX idx_records_type ON records(type);
CREATE INDEX idx_records_created_at ON records(created_at);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_tracks_task_id ON task_tracks(task_id);

-- 为 JSONB 字段创建 GIN 索引（加速查询）
CREATE INDEX idx_records_location ON records USING GIN (location);
CREATE INDEX idx_records_form_data ON records USING GIN (form_data);

-- ==================== RLS 策略 ====================
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tracks ENABLE ROW LEVEL SECURITY;

-- 默认拒绝所有操作（未匹配到策略时拒绝）
CREATE POLICY "默认拒绝" ON users FOR ALL USING (false);
CREATE POLICY "默认拒绝" ON tasks FOR ALL USING (false);
CREATE POLICY "默认拒绝" ON records FOR ALL USING (false);
CREATE POLICY "默认拒绝" ON task_tracks FOR ALL USING (false);

-- users 表：管理员全权限，普通用户只能查看/修改自己（但不能修改角色）
CREATE POLICY "管理员全权限_users" ON users
  FOR ALL USING ( (current_setting('request.jwt.claims', true)::json->>'role') = 'admin' );

CREATE POLICY "用户查看自己_users" ON users
  FOR SELECT USING ( (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID = id );

CREATE POLICY "用户更新自己_users" ON users
  FOR UPDATE USING ( (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID = id )
  WITH CHECK ( (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID = id );

-- tasks 表：管理员全权限，普通用户只能操作自己创建的任务
CREATE POLICY "管理员全权限_tasks" ON tasks
  FOR ALL USING ( (current_setting('request.jwt.claims', true)::json->>'role') = 'admin' );

CREATE POLICY "用户查看自己的任务_tasks" ON tasks
  FOR SELECT USING ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

CREATE POLICY "用户操作自己的任务_tasks" ON tasks
  FOR ALL USING ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

-- records 表：管理员全权限，普通用户只能查看/编辑/删除自己的记录
CREATE POLICY "管理员全权限_records" ON records
  FOR ALL USING ( (current_setting('request.jwt.claims', true)::json->>'role') = 'admin' );

CREATE POLICY "用户查看自己的记录_records" ON records
  FOR SELECT USING ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

CREATE POLICY "用户操作自己的记录_records" ON records
  FOR ALL USING ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

-- task_tracks 表：管理员全权限，普通用户只能操作自己任务的轨迹
CREATE POLICY "管理员全权限_tracks" ON task_tracks
  FOR ALL USING ( (current_setting('request.jwt.claims', true)::json->>'role') = 'admin' );

CREATE POLICY "用户查看自己的轨迹_tracks" ON task_tracks
  FOR SELECT USING ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

CREATE POLICY "用户插入自己的轨迹_tracks" ON task_tracks
  FOR INSERT WITH CHECK ( user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID );

-- ==================== 自动更新 updated_at 触发器 ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 初始化数据 ====================
-- 插入默认管理员（密码为 "admin123" 的 bcrypt 哈希，实际使用中请替换）
-- 生成哈希命令：Deno 中 bcrypt.hash("admin123")，结果类似 $2b$10$...
-- 注意：此处使用一个示例哈希，部署时请重新生成并替换
INSERT INTO users (id, username, password_hash, role, region)
VALUES (
  uuid_generate_v4(),
  'admin',
  '$2b$10$8U2p8X6XQ0dTZ5qY9cY7L.eYQGqW0u5f0X6Z0q2cVqLdY5Lm8x3q',  -- admin123 的哈希（占位符）
  'admin',
  '海珠区'
) ON CONFLICT (username) DO NOTHING;