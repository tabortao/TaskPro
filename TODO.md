# Task: TaskPro 微信小程序开发

## Plan
- [x] 步骤1: 初始化 Supabase 和数据库设计
  - [x] 初始化 Supabase 项目
  - [x] 创建数据库表结构（profiles, topics, tasks, tags, task_tags, attachments）
  - [x] 创建图片存储桶
  - [x] 设置 RLS 策略和触发器
  - [x] 创建微信登录 Edge Function
- [x] 步骤2: 更新配置和设计系统
  - [x] 更新 app.scss 颜色系统（任务管理主题）
  - [x] 更新 app.config.ts 路由配置
  - [x] 创建数据库类型定义和 API
- [x] 步骤3: 实现核心功能模块
  - [x] 创建工具函数（标签解析、图片上传、认证守卫）
  - [x] 创建登录页面（微信授权 + 用户名密码）
  - [x] 创建话题列表页（搜索、新增、编辑、删除）
  - [x] 创建任务列表页（Chat-style输入、智能标签、任务状态）
  - [x] 创建我的页面（用户信息、S3配置、登出）
- [x] 步骤4: 运行 lint 并修复问题
- [x] 步骤5: 下载 TabBar 图标

## Notes
- 所有功能已完成实现
- 智能标签解析功能支持 #标签 和 #父标签/子标签 格式
- 图片上传到 Supabase Storage，支持自动压缩
- 用户可配置自己的 S3（存储在 profiles 表）
- 任务支持完成、置顶、收藏状态
- 删除话题时级联删除任务
- Lint 已通过，TabBar 图标已下载
- 微信登录和用户名密码登录均已实现
