/*
# 标签按话题隔离和全局任务搜索

1. 修改标签表
    - 添加 `topic_id` 字段 (uuid, foreign key references topics, nullable)
    - 标签可以属于特定话题，也可以是全局标签（topic_id 为 null）
    - 添加索引以加速按话题查询标签

2. 数据迁移
    - 现有标签保持为全局标签（topic_id 为 null）

3. 唯一约束更新
    - 更新唯一约束：同一话题下标签名称唯一
    - 全局标签（topic_id 为 null）名称也唯一

4. 说明
    - 标签现在可以按话题隔离
    - 每个话题可以有自己的标签体系
    - 全局标签（topic_id 为 null）可以在所有话题中使用
*/

-- 添加 topic_id 字段到 tags 表
ALTER TABLE tags ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES topics(id) ON DELETE CASCADE;

-- 创建索引以加速按话题查询标签
CREATE INDEX IF NOT EXISTS idx_tags_topic_id ON tags(topic_id);

-- 删除旧的唯一约束（如果存在）
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_user_id_name_parent_id_key') THEN
        ALTER TABLE tags DROP CONSTRAINT tags_user_id_name_parent_id_key;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tag_per_user') THEN
        ALTER TABLE tags DROP CONSTRAINT unique_tag_per_user;
    END IF;
END $$;

-- 创建新的唯一约束：同一用户、同一话题下，相同父标签的标签名称唯一
-- 使用 COALESCE 处理 null 值
CREATE UNIQUE INDEX IF NOT EXISTS unique_tag_per_user_topic ON tags(
  user_id, 
  COALESCE(topic_id::text, 'global'), 
  name, 
  COALESCE(parent_id::text, 'no_parent')
);
