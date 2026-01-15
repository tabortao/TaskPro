import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import TopicCard from '@/components/TopicCard'
import {getTopics} from '@/db/api'
import type {Topic} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import './index.scss'

export default function ArchivedTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const data = await getTopics(userId, searchQuery, true)
      setTopics(data)
    } catch (error) {
      console.error('加载归档话题失败:', error)
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

  const handleTopicClick = (topicId: string) => {
    Taro.navigateTo({url: `/pages/tasks/index?topicId=${topicId}`})
  }

  return (
    <View className="min-h-screen bg-gradient-subtle">
      <ScrollView scrollY style={{height: '100vh'}}>
        {/* 搜索栏 */}
        <View className="p-4 bg-card border-b border-border">
          <View className="flex items-center gap-2">
            <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2 flex items-center gap-2">
              <View className="i-mdi-magnify text-xl text-muted-foreground" />
              <Input
                className="flex-1 text-foreground"
                style={{padding: 0, border: 'none', background: 'transparent'}}
                placeholder="搜索归档话题"
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
        <View className="p-4">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : topics.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-archive text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">暂无归档话题</Text>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
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
    </View>
  )
}
