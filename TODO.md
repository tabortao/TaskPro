# Task: 修复话题卡片 emoji 图标显示问题

## Plan
- [x] 1. 分析问题原因
  - [x] 1.1 检查话题表单保存逻辑
  - [x] 1.2 检查任务列表显示逻辑
- [x] 2. 修复 SwipeableTopicCard 组件
  - [x] 2.1 添加 emoji 判断逻辑
  - [x] 2.2 使用 Text 组件显示 emoji
  - [x] 2.3 保持样式一致性
- [x] 3. 运行 lint 检查

## Notes
- ✅ 修复话题卡片 emoji 图标显示
- ✅ 所有代码通过 lint 检查（44 个文件）

## 实现细节

### 1. 问题分析
- 话题表单使用 iconEmoji 保存到 icon_url 字段
- icon_url 可能是 emoji 字符串或图片 URL
- SwipeableTopicCard 组件之前只处理了图片 URL 的情况
- 需要添加 emoji 判断和显示逻辑

### 2. 修复方案
- 检查 icon_url 是否以 http 开头
- 如果不是 URL（即 emoji），使用 Text 组件显示
- 如果是 URL，使用 Image 组件显示
- 如果没有图标，显示默认文件夹图标

### 3. 显示逻辑
```typescript
{topic.icon_url ? (
  !topic.icon_url.startsWith('http') ? (
    // Emoji 显示
    <View className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-primary">
      <Text className="text-3xl">{topic.icon_url}</Text>
    </View>
  ) : (
    // 图片 URL 显示
    <Image src={getImageUrl(topic.icon_url)} className="w-12 h-12 rounded-lg" mode="aspectFill" />
  )
) : (
  // 默认图标
  <View className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
    <View className="i-mdi-folder text-2xl text-white" />
  </View>
)}
```

### 4. 样式一致性
- Emoji 容器：w-12 h-12 rounded-lg bg-gradient-primary
- Emoji 文本：text-3xl
- 与任务列表顶部图标样式完全一致

## 待用户测试
- 请测试话题卡片 emoji 图标是否正常显示
- 请测试话题卡片图片 URL 是否正常显示
- 请测试默认文件夹图标是否正常显示
