import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type {Tag} from '@/db/types'

interface TagDrawerProps {
  visible: boolean
  tags: Tag[]
  selectedTagId: string | null
  onClose: () => void
  onSelectTag: (tagId: string | null) => void
  onCreateTag: () => void
  onEditTag: (tag: Tag) => void
  onDeleteTag: (tagId: string) => void
}

// 预设颜色
const _PRESET_COLORS = [
  '#4A90E2', // 蓝色
  '#E74C3C', // 红色
  '#2ECC71', // 绿色
  '#F39C12', // 橙色
  '#9B59B6', // 紫色
  '#1ABC9C', // 青色
  '#E91E63', // 粉色
  '#FF9800', // 琥珀色
  '#607D8B', // 蓝灰色
  '#795548' // 棕色
]

export default function TagDrawer({
  visible,
  tags,
  selectedTagId,
  onClose,
  onSelectTag,
  onCreateTag,
  onEditTag,
  onDeleteTag
}: TagDrawerProps) {
  if (!visible) return null

  const handleDelete = (tag: Tag) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除标签"${tag.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          onDeleteTag(tag.id)
        }
      }
    })
  }

  return (
    <>
      {/* 遮罩层 */}
      <View className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* 侧边栏 */}
      <View className="fixed top-0 right-0 bottom-0 w-80 bg-card shadow-2xl z-50 flex flex-col">
        {/* 头部 */}
        <View className="flex items-center justify-between p-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">标签管理</Text>
          <View className="i-mdi-close text-2xl text-muted-foreground" onClick={onClose} />
        </View>

        {/* 标签列表 */}
        <ScrollView scrollY className="flex-1 p-4">
          {/* 全部标签选项 */}
          <View
            className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
              selectedTagId === null ? 'bg-primary' : 'bg-secondary'
            }`}
            onClick={() => onSelectTag(null)}>
            <View className="flex items-center gap-2">
              <View className="i-mdi-tag-multiple text-xl text-white" />
              <Text className={`text-base break-keep ${selectedTagId === null ? 'text-white' : 'text-foreground'}`}>
                全部任务
              </Text>
            </View>
          </View>

          {/* 标签列表 */}
          {tags.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-10">
              <View className="i-mdi-tag-outline text-4xl text-muted-foreground mb-2" />
              <Text className="text-sm text-muted-foreground">暂无标签</Text>
            </View>
          ) : (
            <View className="flex flex-col gap-2">
              {tags.map((tag) => (
                <View
                  key={tag.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    selectedTagId === tag.id ? 'bg-accent' : 'bg-secondary'
                  }`}>
                  <View className="flex items-center gap-2 flex-1" onClick={() => onSelectTag(tag.id)}>
                    {/* 标签颜色指示器 */}
                    <View className="w-3 h-3 rounded-full" style={{backgroundColor: tag.color}} />
                    {/* Emoji */}
                    {tag.emoji && <Text className="text-base">{tag.emoji}</Text>}
                    {/* 标签名 */}
                    <Text className="text-sm text-foreground break-keep flex-1">{tag.name}</Text>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-pencil text-lg text-primary" onClick={() => onEditTag(tag)} />
                    <View className="i-mdi-delete text-lg text-destructive" onClick={() => handleDelete(tag)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View className="p-4 border-t border-border">
          <Button
            className="w-full bg-primary text-white py-3 rounded-lg break-keep text-base"
            size="default"
            onClick={onCreateTag}>
            <View className="flex items-center justify-center gap-2">
              <View className="i-mdi-plus text-xl" />
              <Text className="text-white">新建标签</Text>
            </View>
          </Button>
        </View>
      </View>
    </>
  )
}
