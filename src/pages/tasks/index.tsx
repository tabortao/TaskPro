import {Image, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useLoad} from '@tarojs/taro'
import {useCallback, useMemo, useState} from 'react'
import TagDrawer from '@/components/TagDrawer'
import TagForm from '@/components/TagForm'
import TagSelector from '@/components/TagSelector'
import TaskItem from '@/components/TaskItem'
import {
  addTaskTags,
  createTag,
  createTask,
  deleteTag,
  findOrCreateTag,
  getTags,
  getTasks,
  getTopic,
  searchTags,
  updateTag
} from '@/db/api'
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

  // 标签管理相关状态
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showTagDrawer, setShowTagDrawer] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorite' | string>('all') // 'all' | 'favorite' | tagId
  const [showTagForm, setShowTagForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // 标签自动补全相关状态
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])

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

      const [topicData, tasksData, tagsData] = await Promise.all([
        getTopic(topicId),
        getTasks(topicId),
        getTags(userId, topicId) // 只加载该话题的标签
      ])

      setTopic(topicData)
      setAllTasks(tasksData)
      setAllTags(tagsData)
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

  // 根据 Tab 和筛选条件筛选任务
  const displayTasks = useMemo(() => {
    let filtered = allTasks

    // 按完成状态筛选
    if (activeTab === 'completed') {
      filtered = filtered.filter((task) => task.is_completed)
    } else {
      filtered = filtered.filter((task) => !task.is_completed)
    }

    // 按筛选条件筛选
    if (selectedFilter === 'favorite') {
      // 收藏筛选
      filtered = filtered.filter((task) => task.is_favorite)
    } else if (selectedFilter !== 'all') {
      // 标签筛选
      filtered = filtered.filter((task) => task.tags?.some((tag) => tag.id === selectedFilter))
    }

    return filtered
  }, [allTasks, activeTab, selectedFilter])

  // 监听输入内容变化，处理标签自动补全
  const handleInputChange = async (value: string) => {
    setTaskContent(value)

    const userId = await getCurrentUserId()
    if (!userId) return

    // 检查是否输入了 #
    const lastChar = value[value.length - 1]
    const beforeLastChar = value[value.length - 2]

    // 如果刚输入 #，且前面是空格或开头
    if (lastChar === '#' && (!beforeLastChar || beforeLastChar === ' ' || beforeLastChar === '\n')) {
      // 显示所有标签
      setSuggestedTags(allTags.slice(0, 10))
      setShowTagSelector(true)
      return
    }

    // 检查光标前是否有未完成的标签输入
    const lastHashIndex = value.lastIndexOf('#')
    if (lastHashIndex === -1) {
      setShowTagSelector(false)
      return
    }

    const textAfterHash = value.substring(lastHashIndex + 1)

    // 如果 # 后有空格，则不显示
    if (textAfterHash.includes(' ') || textAfterHash.includes('\n')) {
      setShowTagSelector(false)
      return
    }

    // 搜索匹配的标签
    if (textAfterHash.length > 0) {
      const matchedTags = await searchTags(userId, textAfterHash, topicId) // 只搜索该话题的标签
      setSuggestedTags(matchedTags)
      setShowTagSelector(matchedTags.length > 0)
    } else {
      setSuggestedTags(allTags.slice(0, 10))
      setShowTagSelector(allTags.length > 0)
    }
  }

  const handleTagSelect = (tag: Tag) => {
    const lastHashIndex = taskContent.lastIndexOf('#')
    if (lastHashIndex !== -1) {
      const beforeHash = taskContent.substring(0, lastHashIndex)
      const afterHash = taskContent.substring(lastHashIndex + 1)
      const spaceIndex = afterHash.indexOf(' ')
      const afterTag = spaceIndex !== -1 ? afterHash.substring(spaceIndex) : ''

      const tagName = getTagFullName(tag)
      setTaskContent(`${beforeHash}#${tagName} ${afterTag}`)
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
            const parentTag = await findOrCreateTag(userId, parent, null, topicId) // 传递 topicId
            parentTagId = parentTag.id
          }

          const childTag = await findOrCreateTag(userId, child, parentTagId, topicId) // 传递 topicId
          tagIds.push(childTag.id)
        }

        await addTaskTags(newTask.id, tagIds)
      }

      Taro.showToast({title: '创建成功', icon: 'success'})
      setTaskContent('')
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

  const handleCreateTag = () => {
    setEditingTag(null)
    setShowTagForm(true)
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setShowTagForm(true)
  }

  const handleSaveTag = async (data: {name: string; emoji: string; color: string}) => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      if (editingTag) {
        // 编辑标签
        await updateTag(editingTag.id, data)
        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        // 新建标签
        await createTag({
          user_id: userId,
          topic_id: topicId, // 添加 topic_id
          name: data.name,
          emoji: data.emoji || null,
          color: data.color,
          parent_id: null
        })
        Taro.showToast({title: '创建成功', icon: 'success'})
      }

      setShowTagForm(false)
      setEditingTag(null)
      loadData()
    } catch (error: any) {
      console.error('保存标签失败:', error)
      Taro.showToast({title: error.message || '保存失败', icon: 'none'})
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId)
      Taro.showToast({title: '删除成功', icon: 'success'})
      if (selectedTagId === tagId) {
        setSelectedTagId(null)
      }
      loadData()
    } catch (error: any) {
      console.error('删除标签失败:', error)
      Taro.showToast({title: error.message || '删除失败', icon: 'none'})
    }
  }

  return (
    <View className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* 话题信息 */}
      {topic && (
        <View className="bg-gradient-card p-4 border-b border-border">
          <View className="flex items-start gap-3">
            {/* 话题图标和备注 */}
            <View className="flex flex-col items-center gap-2">
              {topic.icon_url ? (
                topic.icon_url.startsWith('emoji:') ? (
                  <View className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-primary">
                    <Text className="text-3xl">{topic.icon_url.replace('emoji:', '')}</Text>
                  </View>
                ) : (
                  <Image src={getImageUrl(topic.icon_url)} className="w-12 h-12 rounded-lg" mode="aspectFill" />
                )
              ) : (
                <View className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <View className="i-mdi-folder text-2xl text-white" />
                </View>
              )}
              {topic.description && (
                <Text className="text-xs text-muted-foreground text-center break-keep max-w-16">
                  {topic.description}
                </Text>
              )}
            </View>

            {/* 话题名称和状态 */}
            <View className="flex-1 min-w-0">
              <Text className="text-lg font-bold text-foreground break-keep">{topic.name}</Text>
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

      {/* Tab 切换和标签按钮 */}
      <View className="bg-card border-b border-border flex items-center">
        <View className="flex-1 flex">
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
        <View className="px-4 py-3" onClick={() => setShowTagDrawer(true)}>
          <Text className="text-2xl">🏷️</Text>
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
                {selectedFilter === 'favorite'
                  ? '暂无收藏任务'
                  : selectedFilter !== 'all'
                    ? '该标签下暂无任务'
                    : activeTab === 'completed'
                      ? '暂无已完成任务'
                      : '暂无进行中任务'}
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
                onInput={(e) => handleInputChange(e.detail.value)}
                onFocus={() => {
                  // 检查是否有未完成的标签输入
                  if (taskContent.includes('#')) {
                    handleInputChange(taskContent)
                  }
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

      {/* 标签管理侧边栏 */}
      <TagDrawer
        visible={showTagDrawer}
        tags={allTags}
        selectedTagId={selectedTagId}
        selectedFilter={selectedFilter}
        onClose={() => setShowTagDrawer(false)}
        onSelectTag={(tagId) => {
          setSelectedTagId(tagId)
          setSelectedFilter(tagId || 'all')
          setShowTagDrawer(false)
        }}
        onSelectFavorite={() => {
          setSelectedTagId(null)
          setSelectedFilter('favorite')
          setShowTagDrawer(false)
        }}
        onCreateTag={handleCreateTag}
        onEditTag={handleEditTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* 标签编辑表单 */}
      <TagForm
        visible={showTagForm}
        tag={editingTag}
        onClose={() => {
          setShowTagForm(false)
          setEditingTag(null)
        }}
        onSave={handleSaveTag}
      />
    </View>
  )
}
