import {Image, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {updateTask} from '@/db/api'
import type {TaskWithTags} from '@/db/types'
import {getImageUrl} from '@/utils/upload'

interface TaskItemProps {
  task: TaskWithTags
  onUpdate: () => void
}

export default function TaskItem({task, onUpdate}: TaskItemProps) {
  // 获取第一个标签的颜色作为底纹
  const backgroundColor = task.tags && task.tags.length > 0 ? `${task.tags[0].color}15` : 'transparent'

  const handleToggleComplete = async () => {
    try {
      await updateTask(task.id, {is_completed: !task.is_completed})
      onUpdate()
    } catch (error) {
      console.error('更新任务失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleCompleteClick = (e: any) => {
    e.stopPropagation()
    handleToggleComplete()
  }

  // 解析内容中的图片
  const imageRegex = /\[图片:(https?:\/\/[^\]]+)\]/g
  const images: string[] = []
  const matches = task.content.matchAll(imageRegex)
  for (const match of matches) {
    images.push(match[1])
  }

  // 移除图片和标签，只显示纯文本内容
  let contentWithoutImagesAndTags = task.content.replace(imageRegex, '')
  // 移除 #标签 和 #标签/子标签 格式
  contentWithoutImagesAndTags = contentWithoutImagesAndTags.replace(/#[^\s#]+/g, '').trim()

  // 内容截断（超过100字符显示省略号）
  const displayContent =
    contentWithoutImagesAndTags.length > 100
      ? `${contentWithoutImagesAndTags.substring(0, 100)}...`
      : contentWithoutImagesAndTags

  // 点击任务卡片进入详情
  const handleCardClick = () => {
    Taro.navigateTo({url: `/pages/task-detail/index?taskId=${task.id}`})
  }

  return (
    <View
      className="bg-card rounded-xl p-4 shadow-md border border-border"
      style={{backgroundColor}}
      onClick={handleCardClick}>
      {/* 任务内容 */}
      <View className="flex items-start gap-3 mb-2">
        {/* 完成状态 */}
        <View
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
            task.is_completed ? 'bg-primary border-primary' : 'border-border'
          }`}
          onClick={handleCompleteClick}>
          {task.is_completed && <View className="i-mdi-check text-white text-sm" />}
        </View>

        {/* 内容 */}
        <View className="flex-1 min-w-0">
          <Text
            className={`text-base break-words ${
              task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
            {displayContent}
          </Text>

          {/* 标签 */}
          {task.tags && task.tags.length > 0 && (
            <View className="flex flex-wrap gap-2 mt-2">
              {task.tags.map((tag) => (
                <View
                  key={tag.id}
                  className="px-2 py-1 rounded flex items-center gap-1"
                  style={{backgroundColor: `${tag.color}30`}}>
                  {tag.emoji && <Text className="text-xs">{tag.emoji}</Text>}
                  <Text className="text-xs font-semibold" style={{color: tag.color}}>
                    {tag.name}
                  </Text>
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
      </View>

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
