-- 为话题表添加归档字段
-- 归档的话题不在主列表显示，不能创建新任务

ALTER TABLE topics ADD COLUMN is_archived boolean DEFAULT false NOT NULL;

-- 为归档字段创建索引以提高查询性能
CREATE INDEX idx_topics_is_archived ON topics(is_archived);