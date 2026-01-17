import {Image, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import type {Topic} from '@/db/types'
import {getImageUrl} from '@/utils/upload'

interface SwipeableTopicCardProps {
  topic: Topic
  onDelete: (topicId: string) => void
  onEdit: (topicId: string) => void
  onTogglePin: (topicId: string) => void
  onArchive: (topicId: string) => void
  onClick: () => void
}

export default function SwipeableTopicCard({
  topic,
  onDelete,
  onEdit,
  onTogglePin,
  onArchive,
  onClick
}: SwipeableTopicCardProps) {
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

    // 左滑最多 160px（编辑+删除），右滑最多 160px（置顶+归档）
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
      content: '确定要删除这个话题吗？删除后该话题下的所有任务也会被删除。'
    })

    if (result.confirm) {
      onDelete(topic.id)
      setTranslateX(0)
    }
  }

  const handleEdit = (e: any) => {
    e.stopPropagation()
    onEdit(topic.id)
    setTranslateX(0)
  }

  const handleTogglePin = (e: any) => {
    e.stopPropagation()
    onTogglePin(topic.id)
    setTranslateX(0)
  }

  const handleArchive = (e: any) => {
    e.stopPropagation()
    onArchive(topic.id)
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

  return (
    <View className="relative overflow-hidden rounded-xl">
      {/* 左侧按钮（右滑显示）- 置顶和归档 */}
      <View className="absolute left-0 top-0 bottom-0 flex items-center">
        <View className="w-20 h-full bg-primary flex items-center justify-center" onClick={handleTogglePin}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-pin text-2xl text-white" />
            <Text className="text-xs text-white">{topic.is_pinned ? '取消' : '置顶'}</Text>
          </View>
        </View>
        <View
          className="w-20 h-full flex items-center justify-center"
          style={{background: '#95A5A6'}}
          onClick={handleArchive}>
          <View className="flex flex-col items-center gap-1">
            <View className="i-mdi-archive text-2xl text-white" />
            <Text className="text-xs text-white">归档</Text>
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

      {/* 话题卡片 */}
      <View
        className="bg-card rounded-xl p-4 shadow-md border border-border transition-transform duration-200"
        style={{transform: `translateX(${translateX}px)`}}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}>
        <View className="flex items-start gap-3">
          {/* 话题图标 */}
          <View className="flex-shrink-0">
            {topic.icon ? (
              <Image src={getImageUrl(topic.icon)} className="w-12 h-12 rounded-lg" mode="aspectFill" />
            ) : (
              <View className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <View className="i-mdi-folder text-2xl text-white" />
              </View>
            )}
          </View>

          {/* 话题信息 */}
          <View className="flex-1 flex flex-col items-start gap-1">
            <View className="flex items-center gap-2">
              <Text className="text-base font-medium text-foreground break-keep">{topic.name}</Text>
              {topic.is_pinned && <View className="i-mdi-pin text-sm text-primary" />}
            </View>
            {topic.description && (
              <Text className="text-sm text-muted-foreground break-all line-clamp-2">{topic.description}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
