import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import FloatingButton from '@/components/FloatingButton'
import GlobalInput from '@/components/GlobalInput'
import TopicCard from '@/components/TopicCard'
import {getTopics, searchAllTasks} from '@/db/api'
import type {TaskWithTags, Topic} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(TaskWithTags & {topic: Topic})[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const data = await getTopics(userId, '', false)
      setTopics(data)
    } catch (error) {
      console.error('加载话题失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setLoading(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const results = await searchAllTasks(userId, searchQuery.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('搜索失败:', error)
      Taro.showToast({title: '搜索失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    setSearchResults([])
  }

  const handleGoToProfile = () => {
    Taro.navigateTo({url: '/pages/profile/index'})
  }

  useDidShow(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    authGuard(currentPath).then((isAuth) => {
      if (isAuth) {
        loadTopics()
      }
    })
  })

  const handleAddTopic = () => {
    Taro.navigateTo({url: '/pages/topic-form/index'})
  }

  const handleTopicClick = (topicId: string) => {
    Taro.navigateTo({url: `/pages/tasks/index?topicId=${topicId}`})
  }

  const handleTaskCreated = () => {
    loadTopics()
  }

  return (
    <View className="min-h-screen bg-gradient-subtle pb-32">
      {/* 搜索栏 */}
      <View className="bg-card px-4 py-3 border-b border-border">
        <View className="flex items-center gap-2">
          <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2 flex items-center">
            <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
            <Input
              className="flex-1 text-foreground"
              style={{padding: 0, border: 'none', background: 'transparent'}}
              placeholder="搜索任务内容..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.detail.value)}
              onConfirm={handleSearch}
            />
            {searchQuery && <View className="i-mdi-close text-xl text-muted-foreground" onClick={handleClearSearch} />}
          </View>
          <View
            className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
            onClick={handleGoToProfile}>
            <View className="i-mdi-account text-2xl text-primary-foreground" />
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 180px)'}}>
        <View className="p-4 pb-8">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : isSearching ? (
            // 搜索结果
            searchResults.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-20">
                <View className="i-mdi-text-search text-6xl text-muted-foreground mb-4" />
                <Text className="text-muted-foreground">未找到相关任务</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                <Text className="text-sm text-muted-foreground mb-2">找到 {searchResults.length} 个任务</Text>
                {searchResults.map((task) => (
                  <View
                    key={task.id}
                    className="bg-card rounded-lg p-4 border border-border"
                    onClick={() => Taro.navigateTo({url: `/pages/task-detail/index?taskId=${task.id}`})}>
                    {/* 任务所属话题 */}
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-folder text-sm text-primary" />
                      <Text className="text-xs text-primary break-keep">{task.topic.name}</Text>
                    </View>
                    {/* 任务内容 */}
                    <Text className="text-foreground break-all line-clamp-3">
                      {task.content.replace(/\[图片:.*?\]/g, '[图片]')}
                    </Text>
                    {/* 任务标签 */}
                    {task.tags && task.tags.length > 0 && (
                      <View className="flex items-center gap-2 mt-2 flex-wrap">
                        {task.tags.map((tag) => (
                          <View key={tag.id} className="bg-secondary px-2 py-1 rounded flex items-center gap-1">
                            {tag.emoji && <Text className="text-xs">{tag.emoji}</Text>}
                            <Text className="text-xs text-secondary-foreground break-keep">{tag.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          ) : topics.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-folder-open-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground mb-6">还没有话题，快来创建一个吧</Text>
              <View className="bg-primary text-white px-6 py-3 rounded-lg" onClick={handleAddTopic}>
                <Text className="text-primary-foreground text-base break-keep">创建话题</Text>
              </View>
            </View>
          ) : (
            <View className="space-y-3">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => handleTopicClick(topic.id)}
                  onUpdate={loadTopics}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 悬浮按钮 */}
      <FloatingButton icon="i-mdi-plus" onClick={handleAddTopic} />

      {/* 全局输入框 */}
      <GlobalInput onTaskCreated={handleTaskCreated} />
    </View>
  )
}
