import {Image, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useLoad} from '@tarojs/taro'
import {useCallback, useEffect, useMemo, useState} from 'react'
import TagSelector from '@/components/TagSelector'
import TaskItem from '@/components/TaskItem'
import {addTaskTags, createTask, findOrCreateTag, getRecentTags, getTasks, getTopic, searchTags} from '@/db/api'
import type {Tag, TaskWithTags, Topic} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import {getTagFullName, parseTagHierarchy, parseTagsFromContent} from '@/utils/tags'
import {chooseAndUploadImage, getImageUrl} from '@/utils/upload'
import './index.scss'

type TabType = 'ongoing' | 'completed'

export default function Tasks() {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [allTasks, setAllTasks] = useState<TaskWithTags[]>([])
  const [taskContent, setTaskContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [topicId, setTopicId] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('ongoing')

  // 标签自动补全相关状态
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)

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
      setAllTasks(tasksData)
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

  // 根据 Tab 过滤任务
  const displayTasks = useMemo(() => {
    if (activeTab === 'completed') {
      return allTasks.filter((task) => task.is_completed)
    }
    return allTasks.filter((task) => !task.is_completed)
  }, [allTasks, activeTab])

  // 监听输入内容变化，处理标签自动补全
  useEffect(() => {
    const handleTagSuggestion = async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      // 获取光标前的文本
      const textBeforeCursor = taskContent.substring(0, cursorPosition)
      const lastHashIndex = textBeforeCursor.lastIndexOf('#')

      if (lastHashIndex === -1) {
        setShowTagSelector(false)
        return
      }

      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1)

      // 检查 # 后是否有空格，如果有则不显示
      if (textAfterHash.includes(' ')) {
        setShowTagSelector(false)
        return
      }

      // 如果只输入了 #，显示最近使用的标签
      if (textAfterHash === '') {
        const recentTags = await getRecentTags(userId, 10)
        setSuggestedTags(recentTags)
        setShowTagSelector(recentTags.length > 0)
      } else {
        // 搜索匹配的标签
        const matchedTags = await searchTags(userId, textAfterHash)
        setSuggestedTags(matchedTags)
        setShowTagSelector(matchedTags.length > 0)
      }
    }

    handleTagSuggestion()
  }, [taskContent, cursorPosition])

  const handleTagSelect = (tag: Tag) => {
    const textBeforeCursor = taskContent.substring(0, cursorPosition)
    const textAfterCursor = taskContent.substring(cursorPosition)
    const lastHashIndex = textBeforeCursor.lastIndexOf('#')

    if (lastHashIndex !== -1) {
      const tagName = getTagFullName(tag)
      const newText = `${textBeforeCursor.substring(0, lastHashIndex)}#${tagName} ${textAfterCursor}`
      setTaskContent(newText)
      setCursorPosition(lastHashIndex + tagName.length + 2)
    }

    setShowTagSelector(false)
  }

  const handleSubmitTask = async () => {
    if (!taskContent.trim()) {
      Taro.showToast({title: '请输入任务内容', icon: 'none'})
      return
    }

    if (topic?.is_archived) {
      Taro.showToast({title: '归档的话题不能创建新任务', icon: 'none'})
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

      Taro.showToast({title: '创建成功', icon: 'success'})
      setTaskContent('')
      setCursorPosition(0)
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
      const imageTag = `[图片:${result.url}]`
      setTaskContent(taskContent + imageTag)
    }
  }

  return (
    <View className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* 话题信息 */}
      {topic && (
        <View className="bg-gradient-card p-4 border-b border-border">
          <View className="flex items-center gap-3">
            {topic.icon_url ? (
              <Image src={getImageUrl(topic.icon_url)} className="w-12 h-12 rounded-lg" mode="aspectFill" />
            ) : (
              <View className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <View className="i-mdi-folder text-2xl text-white" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground break-keep">{topic.name}</Text>
              {topic.description && (
                <Text className="text-sm text-muted-foreground mt-1 break-keep">{topic.description}</Text>
              )}
              {topic.is_archived && (
                <View className="flex items-center gap-1 mt-1">
                  <View className="i-mdi-archive text-xs text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">已归档</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Tab 切换 */}
      <View className="bg-card border-b border-border flex">
        <View
          className={`flex-1 py-3 text-center ${activeTab === 'ongoing' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('ongoing')}>
          <Text
            className={`text-base break-keep ${
              activeTab === 'ongoing' ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}>
            ⏳ 进行中
          </Text>
        </View>
        <View
          className={`flex-1 py-3 text-center ${activeTab === 'completed' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('completed')}>
          <Text
            className={`text-base break-keep ${
              activeTab === 'completed' ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}>
            ✅ 已完成
          </Text>
        </View>
      </View>

      {/* 任务列表 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 280px)'}}>
        <View className="p-4">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : displayTasks.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-clipboard-text-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">
                {activeTab === 'completed' ? '暂无已完成任务' : '暂无进行中任务'}
              </Text>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
              {displayTasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdate={loadData} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 输入区域 */}
      {!topic?.is_archived && (
        <View className="bg-card border-t border-border p-4 relative">
          {/* 标签选择器 */}
          <TagSelector tags={suggestedTags} onSelect={handleTagSelect} visible={showTagSelector} />

          <View className="flex items-end gap-2">
            <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2">
              <Textarea
                className="w-full text-foreground"
                style={{padding: 0, border: 'none', background: 'transparent', minHeight: '60px'}}
                placeholder="输入任务内容，使用 #标签 添加标签..."
                value={taskContent}
                onInput={(e) => {
                  setTaskContent(e.detail.value)
                  setCursorPosition(e.detail.cursor || 0)
                }}
                onFocus={() => {
                  // 获取当前光标位置
                  setCursorPosition(taskContent.length)
                }}
                onBlur={() => {
                  // 延迟隐藏，以便点击标签选择器
                  setTimeout(() => setShowTagSelector(false), 200)
                }}
                maxlength={500}
                autoHeight
                disabled={submitting}
                cursorSpacing={100}
              />
            </View>

            <View className="flex flex-col gap-2">
              <View
                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center"
                onClick={handleAddImage}>
                <View className="i-mdi-image text-xl text-secondary-foreground" />
              </View>

              <View
                className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
                onClick={submitting ? undefined : handleSubmitTask}>
                <View className="i-mdi-send text-xl text-white" />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
