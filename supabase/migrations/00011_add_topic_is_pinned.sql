/*
# 为话题表添加置顶字段

1. 修改表
   - `topics`
     - 添加 `is_pinned` (boolean, 默认: false) - 是否置顶

2. 说明
   - 用户可以置顶话题，置顶的话题会显示在列表顶部
*/

ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
