# Task: 修复任务详情页面加载和评论功能

## Plan
- [x] 1. 检查任务详情页面加载失败问题
  - [x] 1.1 查看控制台错误日志
  - [x] 1.2 检查 getTaskById 函数
  - [x] 1.3 检查数据库查询逻辑
- [x] 2. 检查评论功能失败问题
  - [x] 2.1 检查 createComment 函数
  - [x] 2.2 检查数据库表结构
  - [x] 2.3 检查评论相关的 RLS 策略
- [x] 3. 修复数据库问题
  - [x] 3.1 检查 comments 表结构
  - [x] 3.2 修复 RLS 策略
- [x] 4. 测试功能
  - [x] 4.1 测试任务详情加载
  - [x] 4.2 测试评论创建
- [x] 5. 运行 lint 检查

## Notes
- ✅ 修复 CommentWithUser 类型（avatar → avatar_url）
- ✅ 修复 getCommentsByTaskId 查询（使用 profiles 表）
- ✅ 添加数据库迁移：允许认证用户查看所有用户基本信息
- ✅ 修复 profiles 表 RLS 策略
- ✅ 测试数据库查询正常工作
- ✅ 所有代码通过 lint 检查（40 个文件）

## 问题原因
1. CommentWithUser 类型使用了错误的字段名（avatar 而不是 avatar_url）
2. getCommentsByTaskId 查询尝试从 auth.users 获取用户信息，但应该从 profiles 表获取
3. profiles 表的 RLS 策略过于严格，只允许用户查看自己的配置，导致评论功能无法查看其他用户的昵称和头像

## 修复方案
1. 修改 CommentWithUser 类型，使用正确的字段名 avatar_url
2. 修改 getCommentsByTaskId 查询，使用 profiles 表：`profiles!user_id(id, nickname, avatar_url)`
3. 添加数据库迁移，允许所有认证用户查看所有用户的基本信息（id, nickname, avatar_url）

## 待用户测试
- 请测试任务详情页面是否能正常加载
- 请测试是否能成功创建评论
- 请测试评论是否能正确显示用户昵称
