// 话题选择器组件
import {ScrollView, Text, View} from '@tarojs/components'
import type {Topic} from '@/db/types'

interface TopicSelectorProps {
  topics: Topic[]
  visible: boolean
  onSelect: (topic: Topic) => void
}

export default function TopicSelector({topics, visible, onSelect}: TopicSelectorProps) {
  if (!visible || topics.length === 0) return null

  return (
    <View className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-hidden">
      <ScrollView scrollY className="max-h-48">
        {topics.map((topic) => (
          <View
            key={topic.id}
            className="px-4 py-3 border-b border-border hover:bg-muted active:bg-muted flex items-center gap-2"
            onClick={() => onSelect(topic)}>
            {/* 话题图标 */}
            {topic.icon_url && !topic.icon_url.startsWith('http') ? (
              <Text className="text-xl">{topic.icon_url}</Text>
            ) : (
              <View className="i-mdi-folder text-xl text-primary" />
            )}
            {/* 话题名称 */}
            <Text className="text-foreground break-keep">{topic.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
