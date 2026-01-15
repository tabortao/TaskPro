import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import TopicCard from '@/components/TopicCard'
import {getTopics} from '@/db/api'
import type {Topic} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import './index.scss'

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const data = await getTopics(userId, searchQuery, false)
      setTopics(data)
    } catch (error) {
      console.error('加载话题失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useDidShow(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    authGuard(currentPath).then((isAuth) => {
      if (isAuth) {
        loadTopics()
      }
    })
  })

  const handleSearch = () => {
    loadTopics()
  }

  const handleAddTopic = () => {
    Taro.navigateTo({url: '/pages/topic-form/index'})
  }

  const handleTopicClick = (topicId: string) => {
    Taro.navigateTo({url: `/pages/tasks/index?topicId=${topicId}`})
  }

  return (
    <View className="min-h-screen bg-gradient-subtle">
      {/* 搜索栏 */}
      <View className="bg-card px-4 py-3 border-b border-border">
        <View className="flex items-center gap-2">
          <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2 flex items-center">
            <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
            <Input
              className="flex-1 text-foreground"
              style={{padding: 0, border: 'none', background: 'transparent'}}
              placeholder="搜索话题..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>
          <Button
            className="bg-primary text-white px-4 py-2 rounded-lg break-keep text-sm"
            size="mini"
            onClick={handleSearch}>
            搜索
          </Button>
        </View>
      </View>

      {/* 话题列表 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 120px)'}}>
        <View className="p-4">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : topics.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-folder-open-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground mb-6">
                {searchQuery ? '未找到相关话题' : '还没有话题，快来创建一个吧'}
              </Text>
              {!searchQuery && (
                <Button
                  className="bg-primary text-white px-6 py-3 rounded-lg break-keep text-base"
                  size="default"
                  onClick={handleAddTopic}>
                  创建话题
                </Button>
              )}
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

      {/* 浮动添加按钮 */}
      {topics.length > 0 && (
        <View
          className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg"
          onClick={handleAddTopic}>
          <View className="i-mdi-plus text-3xl text-white" />
        </View>
      )}
    </View>
  )
}
