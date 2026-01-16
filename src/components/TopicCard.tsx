import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type {Topic} from '@/db/types'

interface TopicCardProps {
  topic: Topic
  onClick: () => void
  onUpdate: () => void
}

export default function TopicCard({topic, onClick, onUpdate}: TopicCardProps) {
  const handleEdit = (e: any) => {
    e.stopPropagation()
    Taro.navigateTo({url: `/pages/topic-form/index?topicId=${topic.id}`})
  }

  // 判断是否是 emoji
  const isEmoji = topic.icon_url && !topic.icon_url.startsWith('http')

  return (
    <View className="bg-gradient-card rounded-xl p-4 shadow-lg border border-border group" onClick={onClick}>
      <View className="flex items-start gap-3">
        {/* 话题图标 */}
        {topic.icon_url ? (
          <View className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            {isEmoji ? (
              <Text className="text-3xl">{topic.icon_url}</Text>
            ) : (
              <View className="i-mdi-folder text-2xl text-white" />
            )}
          </View>
        ) : (
          <View className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <View className="i-mdi-folder text-2xl text-white" />
          </View>
        )}

        {/* 话题信息 - 上下左对齐 */}
        <View className="flex-1 min-w-0 flex flex-col items-start">
          <Text className="text-base font-semibold text-foreground break-keep">{topic.name}</Text>
          {topic.description && (
            <Text className="text-sm text-muted-foreground break-keep mt-1">{topic.description}</Text>
          )}
        </View>

        {/* 编辑按钮 - 默认隐藏，悬停时显示 */}
        <View
          className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
          onClick={handleEdit}>
          <View className="i-mdi-pencil text-lg text-secondary-foreground" />
        </View>
      </View>
    </View>
  )
}
