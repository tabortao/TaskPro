import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import type {TaskWithTags} from '@/db/types'

interface SwipeableTaskCardProps {
  task: TaskWithTags
  onDelete: (taskId: string) => void
  onClick: () => void
}

export default function SwipeableTaskCard({task, onDelete, onClick}: SwipeableTaskCardProps) {
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const handleTouchStart = (e: any) => {
    setStartX(e.touches[0].clientX)
    setIsSwiping(true)
  }

  const handleTouchMove = (e: any) => {
    if (!isSwiping) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startX

    // 只允许向左滑动，最多滑动 80px
    if (diff < 0 && diff > -80) {
      setTranslateX(diff)
    } else if (diff < -80) {
      setTranslateX(-80)
    } else if (diff > 0) {
      setTranslateX(0)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)

    // 如果滑动超过 40px，则显示删除按钮
    if (translateX < -40) {
      setTranslateX(-80)
    } else {
      setTranslateX(0)
    }
  }

  const handleDelete = async (e: any) => {
    e.stopPropagation()

    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？'
    })

    if (result.confirm) {
      onDelete(task.id)
      setTranslateX(0)
    }
  }

  const handleCardClick = () => {
    if (translateX < 0) {
      // 如果已经滑动，点击收回
      setTranslateX(0)
    } else {
      // 否则执行点击事件
      onClick()
    }
  }

  return (
    <View className="relative overflow-hidden">
      {/* 删除按钮背景 */}
      <View className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center">
        <View className="i-mdi-delete text-2xl text-white" onClick={handleDelete} />
      </View>

      {/* 任务卡片 */}
      <View
        className="bg-card rounded-xl p-4 shadow-md border border-border transition-transform duration-200"
        style={{transform: `translateX(${translateX}px)`}}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}>
        {/* 任务状态 */}
        <View className="flex items-center justify-between mb-2">
          <View className="flex items-center gap-2">
            <View
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                task.is_completed ? 'bg-primary border-primary' : 'border-border'
              }`}>
              {task.is_completed && <View className="i-mdi-check text-white text-xs" />}
            </View>
            <Text className="text-xs text-muted-foreground">{task.is_completed ? '已完成' : '进行中'}</Text>
          </View>
          <View className="flex items-center gap-2">
            {task.is_pinned && <View className="i-mdi-pin text-sm text-primary" />}
            {task.is_favorite && <View className="i-mdi-star text-sm" style={{color: '#F39C12'}} />}
          </View>
        </View>

        {/* 任务内容 */}
        <Text className="text-foreground break-all line-clamp-2 mb-2">
          {task.content.replace(/\[图片:.*?\]/g, '[图片]')}
        </Text>

        {/* 任务标签 */}
        {task.tags && task.tags.length > 0 && (
          <View className="flex items-center gap-2 flex-wrap">
            {task.tags.map((tag) => (
              <View key={tag.id} className="bg-secondary px-2 py-1 rounded flex items-center gap-1">
                {tag.emoji && <Text className="text-xs">{tag.emoji}</Text>}
                <Text className="text-xs text-secondary-foreground break-keep">{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
