/*
# 创建标签和附件表

1. 新建表
   - `tags`
     - `id` (uuid, 主键)
     - `user_id` (uuid, 引用 profiles.id)
     - `name` (text, 非空) - 标签名称
     - `parent_id` (uuid, 引用 tags.id) - 父标签ID，支持层级结构
     - `created_at` (timestamptz, 默认: now())
   
   - `task_tags`
     - `task_id` (uuid, 引用 tasks.id, 级联删除)
     - `tag_id` (uuid, 引用 tags.id, 级联删除)
     - 联合主键 (task_id, tag_id)
   
   - `attachments`
     - `id` (uuid, 主键)
     - `task_id` (uuid, 引用 tasks.id, 级联删除)
     - `user_id` (uuid, 引用 profiles.id)
     - `file_url` (text, 非空) - 文件URL
     - `file_type` (text) - 文件类型（image/document）
     - `file_name` (text) - 文件名
     - `created_at` (timestamptz, 默认: now())

2. 安全策略
   - 所有表启用 RLS
   - 管理员可以访问所有数据
   - 用户只能访问自己的数据

3. 索引优化
   - 为关联字段创建索引
*/

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, parent_id)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_parent_id ON tags(parent_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问所有标签" ON tags
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的标签" ON tags
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建标签" ON tags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的标签" ON tags
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的标签" ON tags
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问所有任务标签" ON task_tags
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的任务标签" ON task_tags
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "用户可以创建任务标签" ON task_tags
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "用户可以删除自己的任务标签" ON task_tags
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text,
  file_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_user_id ON attachments(user_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问所有附件" ON attachments
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的附件" ON attachments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建附件" ON attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的附件" ON attachments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);