# TaskPro - 轻量级任务管理小程序

<div align="center">

![TaskPro Logo](https://img.shields.io/badge/TaskPro-任务管理-4A90E2?style=for-the-badge)

一个基于 Taro + React + TypeScript 的轻量级任务管理微信小程序，提供类似聊天的任务输入体验和强大的标签管理功能。

[![Taro](https://img.shields.io/badge/Taro-4.1.5-blue)](https://taro.jd.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89.0-3ecf8e)](https://supabase.com/)

</div>

## 📖 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [数据库设计](#数据库设计)
- [部署说明](#部署说明)
- [经验总结](#经验总结)
- [许可证](#许可证)

## 🎯 项目简介

TaskPro 是一个现代化的任务管理微信小程序，旨在帮助用户高效管理任务和项目。它提供了直观的用户界面、强大的标签系统和灵活的任务组织方式。

秒哒应用链接:https://www.miaoda.cn/projects/app-8y2p9eqmj5dt

![20260120223744](.\docs\img\20260120223744.jpg)

### 核心特点

- 🚀 **快速输入**：类似聊天的任务输入体验，快速创建任务
- 🏷️ **智能标签**：支持 `#标签/子标签` 格式，自动解析标签层级
- 📁 **话题管理**：按项目组织任务，支持话题图标和描述
- 🔍 **全局搜索**：快速搜索话题和任务
- 📎 **附件支持**：支持图片和文件上传
- 🎨 **现代设计**：基于 TailwindCSS 的响应式设计
- 🔐 **安全认证**：支持微信授权登录和邮箱密码登录

## ✨ 核心功能

### 1. 话题管理

- ✅ 创建和管理不同的话题（项目）
- ✅ 支持全局搜索话题
- ✅ 话题图标（支持 Emoji 和图片）
- ✅ 话题简介和描述
- ✅ 话题置顶和归档
- ✅ 左滑右滑快捷操作（编辑、删除、置顶、归档）

### 2. 任务管理

#### 2.1 Chat-style 输入
- ✅ 像聊天一样快速创建任务
- ✅ 支持自然语言输入任务内容
- ✅ 底部固定输入框，随时添加任务

#### 2.2 智能标签
- ✅ 支持 `#标签/子标签` 格式自动解析
- ✅ 可为任务添加多个标签
- ✅ 支持标签分类和层级结构
- ✅ 支持标签的新增、修改和删除
- ✅ 标签颜色和 Emoji 自定义

#### 2.3 任务状态
- ✅ 支持任务完成标记
- ✅ 支持置顶任务
- ✅ 支持收藏任务
- ✅ 支持任务编辑、删除
- ✅ 左滑右滑快捷操作（编辑、删除、置顶、收藏）
- ✅ 加大选择框，优化点击体验

#### 2.4 附件支持
- ✅ 支持图片上传与预览
- ✅ 支持附件上传
- ✅ 图片等附件存储到 Supabase Storage
- ✅ 用户登录后可设置自己的 S3 配置

### 3. 用户登录

- ✅ 支持微信授权登录
- ✅ 支持账号密码登录
  - 账号必须为邮箱格式
  - 密码必须使用数字和字母，不小于 6 位
  - 密码中可以包含特殊字符，不强制

### 4. 界面优化

- ✅ 主页菜单优化（我的话题、进行中、我的）
- ✅ 话题卡片左侧显示图标
- ✅ 任务列表底部安全区域，防止被输入框遮挡
- ✅ 左滑右滑交互优化
- ✅ 响应式设计，适配不同屏幕尺寸

## 🛠️ 技术栈

### 前端框架
- **Taro 4.1.5** - 跨平台小程序开发框架
- **React 18.3.1** - UI 组件库
- **TypeScript 5.x** - 类型安全的 JavaScript 超集

### 状态管理
- **Zustand 5.0.8** - 轻量级状态管理库
- **Immer 10.1.1** - 不可变数据处理

### 样式方案
- **TailwindCSS 3.x** - 原子化 CSS 框架
- **weapp-tailwindcss 4.9.2** - 小程序 TailwindCSS 适配器
- **Sass** - CSS 预处理器

### 后端服务
- **Supabase 2.89.0** - 开源 Firebase 替代方案
  - PostgreSQL 数据库
  - 实时订阅
  - 身份认证
  - 对象存储
  - Row Level Security (RLS)

### 文件存储
- **Supabase Storage** - 主要存储方案
- **AWS S3** - 可选的自定义存储方案
  - @aws-sdk/client-s3
  - @aws-sdk/lib-storage

### 开发工具
- **Biome 2.3.4** - 代码质量检查和格式化
- **TypeScript Compiler** - 类型检查
- **Vite 4.5.14** - 构建工具

## 📁 项目结构

```
app-8y2p9eqmj5dt/
├── src/
│   ├── app.config.ts          # Taro 应用配置
│   ├── app.scss               # 全局样式和设计变量
│   ├── app.tsx                # 应用入口
│   ├── client/                # 客户端配置
│   │   └── supabase.ts        # Supabase 客户端初始化
│   ├── components/            # 公共组件
│   │   ├── EmojiPicker.tsx    # Emoji 选择器
│   │   ├── FloatingButton.tsx # 悬浮按钮
│   │   ├── GlobalInput.tsx    # 全局输入框
│   │   ├── SwipeableTaskCard.tsx    # 可滑动任务卡片
│   │   ├── SwipeableTopicCard.tsx   # 可滑动话题卡片
│   │   ├── TagDrawer.tsx      # 标签抽屉
│   │   └── TopicCard.tsx      # 话题卡片
│   ├── db/                    # 数据库相关
│   │   ├── api.ts             # 数据库 API 封装
│   │   └── types.ts           # 数据库类型定义
│   ├── pages/                 # 页面
│   │   ├── archived-topics/   # 已归档话题
│   │   ├── login/             # 登录页面
│   │   ├── profile/           # 个人中心
│   │   ├── profile-edit/      # 个人信息编辑
│   │   ├── task-detail/       # 任务详情
│   │   ├── task-edit/         # 任务编辑
│   │   ├── tasks/             # 任务列表
│   │   ├── topic-form/        # 话题表单
│   │   └── topics/            # 话题列表（主页）
│   ├── store/                 # 状态管理
│   │   └── auth.ts            # 认证状态
│   └── utils/                 # 工具函数
│       ├── auth.ts            # 认证工具
│       ├── s3.ts              # S3 上传工具
│       └── upload.ts          # 上传工具
├── supabase/                  # Supabase 配置
│   ├── functions/             # Edge Functions
│   └── migrations/            # 数据库迁移文件
│       ├── 00001_create_profiles_and_auth.sql
│       ├── 00002_create_topics_and_tasks.sql
│       ├── 00003_create_tags_and_attachments.sql
│       ├── 00004_create_storage_bucket.sql
│       ├── 00005_add_topic_archived_field.sql
│       ├── 00006_add_tag_emoji_and_color.sql
│       ├── 00007_remove_s3_config_from_profiles.sql
│       ├── 00008_create_comments_table.sql
│       ├── 00009_add_topic_id_to_tags_and_global_search.sql
│       ├── 00010_allow_public_profile_view.sql
│       └── 00011_add_topic_is_pinned.sql
├── docs/                      # 文档
│   └── 经验.md                # 开发经验总结
├── config/                    # 配置文件
│   └── index.ts               # 项目配置
├── .env                       # 环境变量
├── package.json               # 项目依赖
├── tailwind.config.ts         # TailwindCSS 配置
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- pnpm >= 8.x
- 微信开发者工具

### 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```env
# Supabase 配置
TARO_APP_SUPABASE_URL=your_supabase_url
TARO_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用配置
TARO_APP_ID=your_app_id
```

### 开发调试

```bash
# 微信小程序
pnpm run dev:weapp

# H5
pnpm run dev:h5
```

### 代码检查

```bash
# 运行 lint 检查
pnpm run lint
```

### 构建发布

```bash
# 构建微信小程序
pnpm run build:weapp

# 构建 H5
pnpm run build:h5
```

## 💻 开发指南

### 代码规范

- 使用 TypeScript 编写代码，确保类型安全
- 遵循 Biome 规范
- 组件使用函数式组件和 Hooks
- 使用 2 空格缩进
- 使用 TailwindCSS 进行样式开发，避免内联样式

### 组件开发

```tsx
import {View, Text} from '@tarojs/components'
import Taro from '@tarojs/taro'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export default function MyComponent({title, onAction}: MyComponentProps) {
  return (
    <View className="p-4 bg-card rounded-lg">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      <View className="mt-2" onClick={onAction}>
        <Text className="text-primary">点击操作</Text>
      </View>
    </View>
  )
}
```

### 状态管理

使用 Zustand 进行状态管理：

```typescript
import {create} from 'zustand'

interface MyStore {
  count: number
  increment: () => void
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({count: state.count + 1}))
}))
```

### 数据库操作

所有数据库操作封装在 `src/db/api.ts` 中：

```typescript
import {supabase} from '@/client/supabase'
import type {Task} from '@/db/types'

export async function getTasks(userId: string, topicId: string): Promise<Task[]> {
  const {data, error} = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .order('created_at', {ascending: false})

  if (error) throw error
  return data || []
}
```

### 路由导航

```typescript
import Taro from '@tarojs/taro'

// 导航到普通页面
Taro.navigateTo({url: '/pages/task-detail/index?taskId=123'})

// 导航到 TabBar 页面
Taro.switchTab({url: '/pages/topics/index'})

// 返回上一页
Taro.navigateBack()
```

### 样式开发

使用 TailwindCSS 原子类：

```tsx
<View className="flex flex-col gap-4 p-4 bg-gradient-primary rounded-xl shadow-lg">
  <Text className="text-xl font-bold text-white">标题</Text>
  <Text className="text-sm text-white/80">描述文本</Text>
</View>
```

### 设计系统

项目使用语义化的设计 token，定义在 `src/app.scss` 中：

```scss
:root {
  --primary: 210 79% 46%;
  --secondary: 210 40% 96%;
  --accent: 210 100% 50%;
  --foreground: 222 47% 11%;
  --background: 0 0% 100%;
  --card: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --muted: 210 40% 96%;
  --destructive: 0 84% 60%;
  
  /* 渐变 */
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  --gradient-card: linear-gradient(180deg, hsl(var(--card)), hsl(var(--muted)));
}
```

## 🗄️ 数据库设计

### 核心表结构

#### profiles（用户表）
- `id` - 用户 ID（UUID）
- `phone` - 手机号
- `email` - 邮箱
- `openid` - 微信 OpenID
- `nickname` - 昵称
- `role` - 角色（user/admin）
- `created_at` - 创建时间

#### topics（话题表）
- `id` - 话题 ID（UUID）
- `user_id` - 用户 ID
- `name` - 话题名称
- `description` - 话题描述
- `icon_url` - 话题图标（Emoji 或图片 URL）
- `is_archived` - 是否归档
- `is_pinned` - 是否置顶
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### tasks（任务表）
- `id` - 任务 ID（UUID）
- `topic_id` - 话题 ID
- `user_id` - 用户 ID
- `content` - 任务内容
- `is_completed` - 是否完成
- `is_pinned` - 是否置顶
- `is_favorite` - 是否收藏
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### tags（标签表）
- `id` - 标签 ID（UUID）
- `user_id` - 用户 ID
- `topic_id` - 话题 ID（可选）
- `name` - 标签名称
- `parent_id` - 父标签 ID（支持层级）
- `emoji` - 标签 Emoji
- `color` - 标签颜色
- `created_at` - 创建时间

#### task_tags（任务标签关联表）
- `task_id` - 任务 ID
- `tag_id` - 标签 ID

#### attachments（附件表）
- `id` - 附件 ID（UUID）
- `task_id` - 任务 ID
- `user_id` - 用户 ID
- `file_url` - 文件 URL
- `file_name` - 文件名
- `file_type` - 文件类型
- `file_size` - 文件大小
- `created_at` - 创建时间

### 安全策略

所有表启用 Row Level Security (RLS)：
- 用户只能访问自己的数据
- 管理员可以访问所有数据
- 支持完整的 CRUD 操作

## 📦 部署说明

### 微信小程序部署

1. 使用微信开发者工具打开项目
2. 构建小程序：`pnpm run build:weapp`
3. 在微信开发者工具中上传代码
4. 提交审核并发布

### H5 部署

1. 构建 H5 应用：`pnpm run build:h5`
2. 将 `dist/h5` 目录部署到静态服务器
3. 配置域名和 HTTPS

### Supabase 配置

1. 创建 Supabase 项目
2. 运行数据库迁移文件
3. 配置存储桶
4. 更新环境变量

## 📚 经验总结

详细的开发经验总结请查看 [docs/经验.md](./docs/经验.md)

主要包含：
- 项目初始化和配置
- 话题和任务管理实现
- 标签系统设计
- 用户认证和权限控制
- 文件上传和存储
- 界面交互优化
- 性能优化技巧
- 常见问题解决方案

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

Copyright (c) 2026 TaskPro

---

<div align="center">
Made with ❤️ by TaskPro Team
</div>
