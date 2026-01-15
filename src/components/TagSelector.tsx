import {ScrollView, Text, View} from '@tarojs/components'
import {useEffect, useState} from 'react'
import {getTopic} from '@/db/api'
import type {Tag, Topic} from '@/db/types'
import {getTagFullName} from '@/utils/tags'

interface TagSelectorProps {
  tags: Tag[]
  onSelect: (tag: Tag) => void
  visible: boolean
}

export default function TagSelector({tags, onSelect, visible}: TagSelectorProps) {
  const [topicMap, setTopicMap] = useState<Record<string, Topic>>({})

  useEffect(() => {
    // 加载标签对应的话题信息
    const loadTopics = async () => {
      const map: Record<string, Topic> = {}
      for (const tag of tags) {
        if (tag.topic_id && !map[tag.topic_id]) {
          const topic = await getTopic(tag.topic_id)
          if (topic) {
            map[tag.topic_id] = topic
          }
        }
      }
      setTopicMap(map)
    }
    if (visible && tags.length > 0) {
      loadTopics()
    }
  }, [tags, visible])

  if (!visible || tags.length === 0) return null

  return (
    <View className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl shadow-lg border border-border max-h-60 overflow-hidden">
      <ScrollView scrollY style={{maxHeight: '240px'}}>
        <View className="p-2">
          {tags.map((tag) => {
            const topic = tag.topic_id ? topicMap[tag.topic_id] : null
            return (
              <View key={tag.id} className="px-3 py-2 hover:bg-accent rounded-lg" onClick={() => onSelect(tag)}>
                <View className="flex items-center gap-2">
                  <Text className="text-sm text-foreground">#{getTagFullName(tag)}</Text>
                  {topic && (
                    <View className="flex items-center gap-1">
                      {topic.icon_url && !topic.icon_url.startsWith('http') ? (
                        <Text className="text-xs">{topic.icon_url}</Text>
                      ) : (
                        <View className="i-mdi-folder text-xs text-muted-foreground" />
                      )}
                      <Text className="text-xs text-muted-foreground break-keep">@{topic.name}</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
