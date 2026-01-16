# Task: 优化任务卡片交互和界面

## Plan
- [x] 1. 优化任务左滑右滑功能
  - [x] 1.1 左滑显示编辑和删除
  - [x] 1.2 右滑显示置顶和收藏
  - [x] 1.3 优化圆角设计
- [x] 2. 优化任务选择框
  - [x] 2.1 加大选择框尺寸
  - [x] 2.2 优化点击区域
- [x] 3. 取消任务详情菜单栏
  - [x] 3.1 移除右上角菜单按钮
  - [x] 3.2 调整布局
- [x] 4. 运行 lint 检查

## Notes
- ✅ 重构 SwipeableTaskCard 组件
- ✅ 优化任务选择框
- ✅ 修改任务详情页面
- ✅ 所有代码通过 lint 检查（43 个文件）

## 实现细节

### 1. 重构 SwipeableTaskCard 组件
- 支持左滑和右滑（最多 160px）
- 左滑显示编辑（蓝色 #3498DB）和删除（红色）按钮
- 右滑显示置顶（主色）和收藏（橙色 #F39C12）按钮
- 使用 rounded-xl 优化圆角设计
- 使用 overflow-hidden 防止底色露出

### 2. 优化任务选择框
- 选择框尺寸从 w-5 h-5 改为 w-7 h-7
- 图标尺寸从 text-xs 改为 text-base
- 增加 gap-3 提升点击区域
- 优化视觉反馈

### 3. 任务详情页面优化
- 移除右上角菜单按钮
- 移除菜单相关状态和逻辑
- 移除遮罩层
- 删除 handleEdit、handleDelete、handleTogglePin 函数
- 选择框加大为 w-7 h-7
- 显示置顶图标在收藏图标旁边

### 4. 任务列表页面优化
- 添加 handleEditTask 函数
- 添加 handleTogglePin 函数
- 添加 handleToggleFavorite 函数
- 添加 handleToggleComplete 函数
- 更新 SwipeableTaskCard 组件使用

## 待用户测试
- 请测试任务左滑右滑功能是否正常
- 请测试任务选择框是否方便点击
- 请测试任务详情页面是否正常
