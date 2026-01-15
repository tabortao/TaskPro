import {Image, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useLoad} from '@tarojs/taro'
import {useCallback, useMemo, useState} from 'react'
import TaskItem from '@/components/TaskItem'
import {addTaskTags, createTask, findOrCreateTag, getTasks, getTopic} from '@/db/api'
import type {TaskWithTags, Topic} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import {parseTagHierarchy, parseTagsFromContent} from '@/utils/tags'
import {chooseAndUploadImage, getImageUrl} from '@/utils/upload'
import './index.scss'

export default function Tasks() {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [tasks, setTasks] = useState<TaskWithTags[]>([])
  const [taskContent, setTaskContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [topicId, setTopicId] = useState('')

  useLoad((options) => {
    if (options.topicId) {
      setTopicId(options.topicId)
    }
  })

  const loadData = useCallback(async () => {
    if (!topicId) return

    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const [topicData, tasksData] = await Promise.all([getTopic(topicId), getTasks(topicId)])

      setTopic(topicData)
      setTasks(tasksData)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useDidShow(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    authGuard(currentPath).then((isAuth) => {
      if (isAuth && topicId) {
        loadData()
      }
    })
  })

  const handleSubmitTask = async () => {
    if (!taskContent.trim()) {
      Taro.showToast({title: '请输入任务内容', icon: 'none'})
      return
    }

    setSubmitting(true)

    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      // 创建任务
      const newTask = await createTask({
        topic_id: topicId,
        user_id: userId,
        content: taskContent,
        is_completed: false,
        is_pinned: false,
        is_favorite: false
      })

      if (!newTask) {
        throw new Error('创建任务失败')
      }

      // 解析并创建标签
      const tagStrings = parseTagsFromContent(taskContent)
      if (tagStrings.length > 0) {
        const tagIds: string[] = []

        for (const tagStr of tagStrings) {
          const {parent, child} = parseTagHierarchy(tagStr)

          let parentTagId: string | null = null
          if (parent) {
            const parentTag = await findOrCreateTag(userId, parent, null)
            parentTagId = parentTag.id
          }

          const childTag = await findOrCreateTag(userId, child, parentTagId)
          tagIds.push(childTag.id)
        }

        await addTaskTags(newTask.id, tagIds)
      }

      setTaskContent('')
      Taro.showToast({title: '创建成功', icon: 'success'})
      loadData()
    } catch (error: any) {
      console.error('创建任务失败:', error)
      Taro.showToast({title: error.message || '创建失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddImage = async () => {
    const result = await chooseAndUploadImage()
    if (result.success && result.url) {
      // 将图片URL添加到任务内容中
      setTaskContent((prev) => `${prev} [图片:${result.url}]`)
    }
  }

  const handleTaskUpdate = async () => {
    await loadData()
  }

  // 统计信息
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.is_completed).length
    const pinned = tasks.filter((t) => t.is_pinned).length
    const favorite = tasks.filter((t) => t.is_favorite).length
    return {total, completed, pinned, favorite}
  }, [tasks])

  return (
    <View className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* 话题信息 */}
      {topic && (
        <View className="bg-gradient-card px-4 py-4 border-b border-border">
          <View className="flex items-center gap-3 mb-3">
            {topic.icon_url && (
              <Image src={getImageUrl(topic.icon_url)} className="w-12 h-12 rounded-lg" mode="aspectFill" />
            )}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{topic.name}</Text>
              {topic.description && <Text className="text-sm text-muted-foreground mt-1">{topic.description}</Text>}
            </View>
          </View>

          {/* 统计信息 */}
          <View className="flex items-center gap-4">
            <View className="flex items-center gap-1">
              <View className="i-mdi-format-list-checks text-primary" />
              <Text className="text-xs text-muted-foreground">总计 {stats.total}</Text>
            </View>
            <View className="flex items-center gap-1">
              <View className="i-mdi-check-circle text-primary" />
              <Text className="text-xs text-muted-foreground">完成 {stats.completed}</Text>
            </View>
            <View className="flex items-center gap-1">
              <View className="i-mdi-pin text-primary" />
              <Text className="text-xs text-muted-foreground">置顶 {stats.pinned}</Text>
            </View>
            <View className="flex items-center gap-1">
              <View className="i-mdi-star text-primary" />
              <Text className="text-xs text-muted-foreground">收藏 {stats.favorite}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 任务列表 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 280px)'}}>
        <View className="p-4">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-clipboard-text-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">还没有任务，快来创建一个吧</Text>
            </View>
          ) : (
            <View className="space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Chat-style 输入框 */}
      <View className="bg-card border-t border-border px-4 py-3">
        <View className="flex items-end gap-2">
          <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2">
            <Textarea
              className="w-full text-foreground"
              style={{padding: 0, border: 'none', background: 'transparent', minHeight: '60px', maxHeight: '120px'}}
              placeholder="输入任务内容，支持 #标签 或 #父标签/子标签..."
              value={taskContent}
              onInput={(e) => setTaskContent(e.detail.value)}
              maxlength={500}
              autoHeight
              disabled={submitting}
            />
          </View>

          <View className="flex flex-col gap-2">
            <View
              className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center"
              onClick={handleAddImage}>
              <View className="i-mdi-image text-xl text-secondary-foreground" />
            </View>

            <View
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${taskContent.trim() ? 'bg-gradient-primary' : 'bg-muted'}`}
              onClick={submitting ? undefined : handleSubmitTask}>
              <View className={`i-mdi-send text-xl ${taskContent.trim() ? 'text-white' : 'text-muted-foreground'}`} />
            </View>
          </View>
        </View>

        <Text className="text-xs text-muted-foreground mt-2">
          提示：使用 #标签 快速添加标签，支持 #父标签/子标签 层级结构
        </Text>
      </View>
    </View>
  )
}
