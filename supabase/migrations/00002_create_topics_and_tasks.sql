/*
# 创建话题和任务表

1. 新建表
   - `topics`
     - `id` (uuid, 主键)
     - `user_id` (uuid, 引用 profiles.id)
     - `name` (text, 非空) - 话题名称
     - `description` (text) - 话题简介
     - `icon_url` (text) - 话题图标
     - `created_at` (timestamptz, 默认: now())
     - `updated_at` (timestamptz, 默认: now())
   
   - `tasks`
     - `id` (uuid, 主键)
     - `topic_id` (uuid, 引用 topics.id, 级联删除)
     - `user_id` (uuid, 引用 profiles.id)
     - `content` (text, 非空) - 任务内容
     - `is_completed` (boolean, 默认: false) - 是否完成
     - `is_pinned` (boolean, 默认: false) - 是否置顶
     - `is_favorite` (boolean, 默认: false) - 是否收藏
     - `created_at` (timestamptz, 默认: now())
     - `updated_at` (timestamptz, 默认: now())

2. 安全策略
   - 所有表启用 RLS
   - 管理员可以访问所有数据
   - 用户只能访问自己的数据
   - 支持完整的 CRUD 操作

3. 索引优化
   - 为 user_id 和 topic_id 创建索引
*/

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_topics_user_id ON topics(user_id);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问所有话题" ON topics
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的话题" ON topics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建话题" ON topics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的话题" ON topics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的话题" ON topics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_completed boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tasks_topic_id ON tasks(topic_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问所有任务" ON tasks
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的任务" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建任务" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的任务" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的任务" ON tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);