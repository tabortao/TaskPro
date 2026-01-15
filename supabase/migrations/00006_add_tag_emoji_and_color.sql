/*
# 为标签表添加 emoji 和颜色字段

1. 新增字段
    - `emoji` (text, nullable) - 标签的 emoji 图标
    - `color` (text, default: '#4A90E2') - 标签的颜色，默认为主题蓝色

2. 说明
    - emoji 字段可选，用于标签的视觉标识
    - color 字段用于标签徽章和任务卡片底纹
    - 默认颜色为系统主题色
*/

ALTER TABLE tags ADD COLUMN emoji text;
ALTER TABLE tags ADD COLUMN color text DEFAULT '#4A90E2' NOT NULL;