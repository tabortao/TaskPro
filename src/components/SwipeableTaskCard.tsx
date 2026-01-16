import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import type {TaskWithTags} from '@/db/types'

interface SwipeableTaskCardProps {
  task: TaskWithTags
  onDelete: (taskId: string) => void
  onEdit: (taskId: string) => void
  onTogglePin: (taskId: string) => void
  onToggleFavorite: (taskId: string) => void
  onToggleComplete: (taskId: string) => void
  onClick: () => void
}

export default function SwipeableTaskCard({
  task,
  onDelete,
  onEdit,
  onTogglePin,
  onToggleFavorite,
  onToggleComplete,
  onClick
}: SwipeableTaskCardProps) {
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

    // 左滑最多 160px（编辑+删除），右滑最多 160px（置顶+收藏）
    if (diff < 0 && diff > -160) {
      setTranslateX(diff)
    } else if (diff < -160) {
      setTranslateX(-160)
    } else if (diff > 0 && diff < 160) {
      setTranslateX(diff)
    } else if (diff > 160) {
      setTranslateX(160)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)

    // 如果滑动超过 80px，则显示按钮
    if (translateX < -80) {
      setTranslateX(-160)
    } else if (translateX > 80) {
      setTranslateX(160)
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

  const handleEdit = (e: any) => {
    e.stopPropagation()
    onEdit(task.id)
    setTranslateX(0)
  }

  const handleTogglePin = (e: any) => {
    e.stopPropagation()
    onTogglePin(task.id)
    setTranslateX(0)
  }

  const handleToggleFavorite = (e: any) => {
    e.stopPropagation()
    onToggleFavorite(task.id)
    setTranslateX(0)
  }

  const handleCardClick = () => {
    if (translateX !== 0) {
      // 如果已经滑动，点击收回
      setTranslateX(0)
    } else {
      // 否则执行点击事件
      onClick()
    }
  }

  const handleCheckboxClick = (e: any) => {
    e.stopPropagation()
    onToggleComplete(task.id)
  }

  return (
    <View className="relative overflow-hidden rounded-xl">
      {/* 左侧按钮（右滑显示）- 置顶和收藏 */}
      <View className="absolute left-0 top-0 bottom-0 flex items-center">
        <View className="w-20 h-full bg-primary flex items-center justify-center" onClick={handleTogglePin}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-pin text-2xl text-white" />
            <Text className="text-xs text-white">{task.is_pinned ? '取消' : '置顶'}</Text>
          </View>
        </View>
        <View
          className="w-20 h-full flex items-center justify-center"
          style={{background: '#F39C12'}}
          onClick={handleToggleFavorite}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-star text-2xl text-white" />
            <Text className="text-xs text-white">{task.is_favorite ? '取消' : '收藏'}</Text>
          </View>
        </View>
      </View>

      {/* 右侧按钮（左滑显示）- 编辑和删除 */}
      <View className="absolute right-0 top-0 bottom-0 flex items-center">
        <View
          className="w-20 h-full flex items-center justify-center"
          style={{background: '#3498DB'}}
          onClick={handleEdit}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-pencil text-2xl text-white" />
            <Text className="text-xs text-white">编辑</Text>
          </View>
        </View>
        <View className="w-20 h-full bg-destructive flex items-center justify-center" onClick={handleDelete}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-delete text-2xl text-white" />
            <Text className="text-xs text-white">删除</Text>
          </View>
        </View>
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
          <View className="flex items-center gap-3">
            {/* 任务选择框 - 加大尺寸 */}
            <View
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                task.is_completed ? 'bg-primary border-primary' : 'border-border'
              }`}
              onClick={handleCheckboxClick}>
              {task.is_completed && <View className="i-mdi-check text-white text-base" />}
            </View>
            <Text className="text-sm text-muted-foreground">{task.is_completed ? '已完成' : '进行中'}</Text>
          </View>
          <View className="flex items-center gap-2">
            {task.is_pinned && <View className="i-mdi-pin text-base text-primary" />}
            {task.is_favorite && <View className="i-mdi-star text-base" style={{color: '#F39C12'}} />}
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
