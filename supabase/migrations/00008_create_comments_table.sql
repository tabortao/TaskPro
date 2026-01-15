/*
# 创建评论表

1. 新增表
    - `comments`
        - `id` (uuid, primary key, default: gen_random_uuid())
        - `task_id` (uuid, foreign key references tasks, not null)
        - `user_id` (uuid, foreign key references auth.users, not null)
        - `content` (text, not null) - 评论内容
        - `created_at` (timestamptz, default: now())
        - `updated_at` (timestamptz, default: now())

2. 索引
    - 为 task_id 创建索引以加速查询
    - 为 created_at 创建索引以支持排序

3. 安全策略
    - 表为公开可读（所有用户可以查看评论）
    - 认证用户可以创建评论
    - 用户可以编辑和删除自己的评论
    - 管理员可以删除任何评论
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 所有用户可以查看评论
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

-- 认证用户可以创建评论
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的评论
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 用户可以删除自己的评论
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 管理员可以删除任何评论
CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));