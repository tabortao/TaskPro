// Emoji 选择器组件
import {ScrollView, Text, View} from '@tarojs/components'
import {useState} from 'react'

// Emoji 分类数据（60+ emoji）
const EMOJI_CATEGORIES = {
  smileys: {
    name: '表情',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '☺️',
      '😚'
    ]
  },
  gestures: {
    name: '手势',
    emojis: [
      '👋',
      '🤚',
      '🖐',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍'
    ]
  },
  animals: {
    name: '动物',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆'
    ]
  },
  food: {
    name: '食物',
    emojis: [
      '🍎',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬'
    ]
  },
  activities: {
    name: '活动',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳'
    ]
  },
  objects: {
    name: '物品',
    emojis: [
      '⌚',
      '📱',
      '💻',
      '⌨️',
      '🖥',
      '🖨',
      '🖱',
      '🖲',
      '🕹',
      '🗜',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📞',
      '☎️'
    ]
  },
  symbols: {
    name: '符号',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️'
    ]
  }
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose?: () => void
  selectedEmoji?: string
}

export default function EmojiPicker({onSelect, onClose, selectedEmoji}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys')

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji)
    onClose?.()
  }

  return (
    <View className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <View className="bg-card rounded-t-3xl w-full max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <View className="flex items-center justify-between p-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">选择 Emoji</Text>
          <View className="i-mdi-close text-2xl text-muted-foreground" onClick={onClose} />
        </View>

        {/* 分类标签 */}
        <ScrollView scrollX className="flex-shrink-0 border-b border-border">
          <View className="flex p-2 gap-2">
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <View
                key={key}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  activeCategory === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}>
                <Text className="text-sm break-keep">{category.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Emoji 网格 */}
        <ScrollView scrollY className="flex-1 p-4">
          <View className="grid grid-cols-5 gap-3">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
              <View
                key={index}
                className={`flex items-center justify-center h-12 rounded-lg ${
                  selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => handleEmojiSelect(emoji)}>
                <Text className="text-2xl">{emoji}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
