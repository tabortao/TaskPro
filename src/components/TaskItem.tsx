import {Image, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import {deleteTask, updateTask} from '@/db/api'
import type {TaskWithTags} from '@/db/types'
import {highlightTags} from '@/utils/tags'
import {getImageUrl} from '@/utils/upload'

interface TaskItemProps {
  task: TaskWithTags
  onUpdate: () => void
}

export default function TaskItem({task, onUpdate}: TaskItemProps) {
  const [showActions, setShowActions] = useState(false)

  const handleToggleComplete = async () => {
    try {
      await updateTask(task.id, {is_completed: !task.is_completed})
      onUpdate()
    } catch (error) {
      console.error('更新任务失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleTogglePin = async () => {
    try {
      await updateTask(task.id, {is_pinned: !task.is_pinned})
      Taro.showToast({title: task.is_pinned ? '取消置顶' : '已置顶', icon: 'success'})
      onUpdate()
    } catch (error) {
      console.error('更新任务失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await updateTask(task.id, {is_favorite: !task.is_favorite})
      Taro.showToast({title: task.is_favorite ? '取消收藏' : '已收藏', icon: 'success'})
      onUpdate()
    } catch (error) {
      console.error('更新任务失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteTask(task.id)
            Taro.showToast({title: '删除成功', icon: 'success'})
            onUpdate()
          } catch (error) {
            console.error('删除任务失败:', error)
            Taro.showToast({title: '删除失败', icon: 'none'})
          }
        }
      }
    })
  }

  // 解析内容中的图片
  const imageRegex = /\[图片:(https?:\/\/[^\]]+)\]/g
  const images: string[] = []
  const matches = task.content.matchAll(imageRegex)
  for (const match of matches) {
    images.push(match[1])
  }
  const contentWithoutImages = task.content.replace(imageRegex, '')

  // 高亮标签
  const highlightedContent = highlightTags(contentWithoutImages)

  return (
    <View className="bg-card rounded-xl p-4 shadow-md border border-border">
      {/* 任务内容 */}
      <View className="flex items-start gap-3 mb-2">
        {/* 完成状态 */}
        <View
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
            task.is_completed ? 'bg-primary border-primary' : 'border-border'
          }`}
          onClick={handleToggleComplete}>
          {task.is_completed && <View className="i-mdi-check text-white text-sm" />}
        </View>

        {/* 内容 */}
        <View className="flex-1 min-w-0">
          <View className="flex flex-wrap items-center">
            {highlightedContent.map((part, index) => (
              <Text
                key={index}
                className={`text-base break-keep ${
                  task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                } ${part.isTag ? 'text-primary font-semibold' : ''}`}>
                {part.text}
              </Text>
            ))}
          </View>

          {/* 标签 */}
          {task.tags && task.tags.length > 0 && (
            <View className="flex flex-wrap gap-2 mt-2">
              {task.tags.map((tag) => (
                <View key={tag.id} className="bg-accent px-2 py-1 rounded">
                  <Text className="text-xs text-accent-foreground">#{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 图片 */}
          {images.length > 0 && (
            <View className="flex flex-wrap gap-2 mt-2">
              {images.map((img, index) => (
                <Image
                  key={index}
                  src={getImageUrl(img)}
                  className="w-20 h-20 rounded-lg"
                  mode="aspectFill"
                  onClick={() => {
                    Taro.previewImage({
                      urls: images.map((i) => getImageUrl(i)),
                      current: getImageUrl(img)
                    })
                  }}
                />
              ))}
            </View>
          )}

          {/* 附件 */}
          {task.attachments && task.attachments.length > 0 && (
            <View className="flex flex-wrap gap-2 mt-2">
              {task.attachments.map((att) => (
                <View key={att.id} className="bg-secondary px-3 py-2 rounded-lg flex items-center gap-2">
                  <View className="i-mdi-file text-secondary-foreground" />
                  <Text className="text-xs text-secondary-foreground">{att.file_name || '附件'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 更多操作 */}
        <View
          className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center"
          onClick={() => setShowActions(!showActions)}>
          <View className="i-mdi-dots-vertical text-lg text-secondary-foreground" />
        </View>
      </View>

      {/* 操作按钮 */}
      {showActions && (
        <View className="flex items-center gap-2 pt-3 border-t border-border">
          <View
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${
              task.is_pinned ? 'bg-primary' : 'bg-secondary'
            }`}
            onClick={handleTogglePin}>
            <View className={`i-mdi-pin text-sm ${task.is_pinned ? 'text-white' : 'text-secondary-foreground'}`} />
            <Text className={`text-xs ${task.is_pinned ? 'text-white' : 'text-secondary-foreground'}`}>
              {task.is_pinned ? '取消置顶' : '置顶'}
            </Text>
          </View>

          <View
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${
              task.is_favorite ? 'bg-primary' : 'bg-secondary'
            }`}
            onClick={handleToggleFavorite}>
            <View className={`i-mdi-star text-sm ${task.is_favorite ? 'text-white' : 'text-secondary-foreground'}`} />
            <Text className={`text-xs ${task.is_favorite ? 'text-white' : 'text-secondary-foreground'}`}>
              {task.is_favorite ? '取消收藏' : '收藏'}
            </Text>
          </View>

          <View
            className="flex-1 bg-destructive py-2 rounded-lg flex items-center justify-center gap-1"
            onClick={handleDelete}>
            <View className="i-mdi-delete text-sm text-white" />
            <Text className="text-xs text-white">删除</Text>
          </View>
        </View>
      )}

      {/* 状态标识 */}
      <View className="flex items-center gap-2 mt-2">
        {task.is_pinned && (
          <View className="flex items-center gap-1">
            <View className="i-mdi-pin text-xs text-primary" />
            <Text className="text-xs text-primary">置顶</Text>
          </View>
        )}
        {task.is_favorite && (
          <View className="flex items-center gap-1">
            <View className="i-mdi-star text-xs text-primary" />
            <Text className="text-xs text-primary">收藏</Text>
          </View>
        )}
        <Text className="text-xs text-muted-foreground ml-auto">
          {new Date(task.created_at).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  )
}
