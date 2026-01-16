import {Button, Input, Text, View} from '@tarojs/components'
import {useEffect, useState} from 'react'
import type {Tag} from '@/db/types'

interface TagFormProps {
  visible: boolean
  tag: Tag | null
  onClose: () => void
  onSave: (data: {name: string; emoji: string; color: string}) => void
}

// 预设颜色
const PRESET_COLORS = [
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

// 常用 Emoji
const COMMON_EMOJIS = ['📌', '⭐', '🔥', '💡', '📝', '🎯', '✅', '⚡', '🚀', '💼', '🏠', '🎨', '📚', '💰', '🎮']

export default function TagForm({visible, tag, onClose, onSave}: TagFormProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [color, setColor] = useState('#4A90E2')
  const [customColor, setCustomColor] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // 当 tag 变化时更新表单
  useEffect(() => {
    if (tag) {
      setName(tag.name || '')
      setEmoji(tag.emoji || '')
      setColor(tag.color || '#4A90E2')
      // 检查是否是自定义颜色
      if (tag.color && !PRESET_COLORS.includes(tag.color)) {
        setCustomColor(tag.color)
        setShowCustomInput(true)
      } else {
        setCustomColor('')
        setShowCustomInput(false)
      }
    } else {
      setName('')
      setEmoji('')
      setColor('#4A90E2')
      setCustomColor('')
      setShowCustomInput(false)
    }
  }, [tag])

  if (!visible) return null

  const handleSave = () => {
    if (!name.trim()) {
      return
    }
    // 使用自定义颜色或预设颜色
    const finalColor = showCustomInput && customColor ? customColor : color
    onSave({name: name.trim(), emoji, color: finalColor})
  }

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value)
    // 如果输入的是有效的颜色代码，更新预览
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColor(value)
    }
  }

  return (
    <>
      {/* 遮罩层 */}
      <View className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* 表单弹窗 */}
      <View className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <View className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6">
          {/* 标题 */}
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">{tag ? '编辑标签' : '新建标签'}</Text>
            <View className="i-mdi-close text-2xl text-muted-foreground" onClick={onClose} />
          </View>

          {/* 标签名称 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">标签名称</Text>
            <View className="bg-input rounded-lg border border-border px-3 py-2">
              <Input
                className="w-full text-foreground"
                style={{padding: 0, border: 'none', background: 'transparent'}}
                placeholder="请输入标签名称"
                value={name}
                onInput={(e) => setName(e.detail.value)}
                maxlength={20}
              />
            </View>
          </View>

          {/* Emoji 选择 */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Emoji 图标（可选）</Text>
            <View className="bg-input rounded-lg border border-border px-3 py-2 mb-2">
              <Input
                className="w-full text-foreground"
                style={{padding: 0, border: 'none', background: 'transparent'}}
                placeholder="输入或选择 Emoji"
                value={emoji}
                onInput={(e) => setEmoji(e.detail.value)}
                maxlength={2}
              />
            </View>
            <View className="flex flex-wrap gap-2">
              {COMMON_EMOJIS.map((e) => (
                <View
                  key={e}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    emoji === e ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onClick={() => setEmoji(e)}>
                  <Text className="text-xl">{e}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 颜色选择 */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">标签颜色</Text>
            <View className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <View
                  key={c}
                  className={`w-10 h-10 rounded-lg ${color === c && !showCustomInput ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={{backgroundColor: c}}
                  onClick={() => {
                    setColor(c)
                    setShowCustomInput(false)
                  }}
                />
              ))}
              {/* 自定义颜色按钮 */}
              <View
                className={`w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center ${
                  showCustomInput ? 'border-primary bg-primary bg-opacity-10' : 'border-border'
                }`}
                onClick={() => setShowCustomInput(!showCustomInput)}>
                <View className="i-mdi-palette text-lg text-foreground" />
              </View>
            </View>

            {/* 自定义颜色输入 */}
            {showCustomInput && (
              <View className="mt-3">
                <View className="flex items-center gap-2">
                  <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2">
                    <Input
                      className="w-full text-foreground"
                      style={{padding: 0, border: 'none', background: 'transparent'}}
                      placeholder="#4A90E2"
                      value={customColor}
                      onInput={(e) => handleCustomColorChange(e.detail.value)}
                      maxlength={7}
                    />
                  </View>
                  {/* 颜色预览 */}
                  <View
                    className="w-10 h-10 rounded-lg border border-border"
                    style={{backgroundColor: customColor || color}}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">请输入十六进制颜色代码，例如：#4A90E2</Text>
              </View>
            )}
          </View>

          {/* 按钮 */}
          <View className="flex gap-3">
            <Button
              className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg break-keep text-base"
              size="default"
              onClick={onClose}>
              取消
            </Button>
            <Button
              className="flex-1 bg-primary text-white py-3 rounded-lg break-keep text-base"
              size="default"
              onClick={handleSave}>
              保存
            </Button>
          </View>
        </View>
      </View>
    </>
  )
}
