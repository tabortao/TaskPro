import {ScrollView, Text, View} from '@tarojs/components'
import type {Tag} from '@/db/types'
import {getTagFullName} from '@/utils/tags'

interface TagSelectorProps {
  tags: Tag[]
  onSelect: (tag: Tag) => void
  visible: boolean
}

export default function TagSelector({tags, onSelect, visible}: TagSelectorProps) {
  if (!visible || tags.length === 0) return null

  return (
    <View className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl shadow-lg border border-border max-h-60 overflow-hidden">
      <ScrollView scrollY style={{maxHeight: '240px'}}>
        <View className="p-2">
          {tags.map((tag) => (
            <View key={tag.id} className="px-3 py-2 hover:bg-accent rounded-lg" onClick={() => onSelect(tag)}>
              <Text className="text-sm text-foreground">#{getTagFullName(tag)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
