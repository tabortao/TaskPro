import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getProfile} from '@/db/api'
import type {Profile} from '@/db/types'
import {authGuard, getCurrentUserId, logout} from '@/utils/auth'
import './index.scss'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const data = await getProfile(userId)
      setProfile(data)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    authGuard(currentPath).then((isAuth) => {
      if (isAuth) {
        loadProfile()
      }
    })
  })

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gradient-subtle">
      <ScrollView scrollY style={{height: '100vh'}}>
        {loading ? (
          <View className="flex flex-col items-center justify-center py-20">
            <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        ) : (
          <View className="p-4">
            {/* 用户信息卡片 */}
            <View className="bg-gradient-card rounded-xl p-6 mb-4 shadow-lg">
              <View className="flex items-center gap-4 mb-4">
                <View className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <View className="i-mdi-account text-4xl text-white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-foreground">
                    {profile?.nickname || profile?.username || '用户'}
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {profile?.role === 'admin' ? '管理员' : '普通用户'}
                  </Text>
                </View>
              </View>

              {profile?.username && (
                <View className="flex items-center gap-2 py-2 border-t border-border">
                  <View className="i-mdi-account-circle text-primary" />
                  <Text className="text-sm text-muted-foreground">用户名：</Text>
                  <Text className="text-sm text-foreground">{profile.username}</Text>
                </View>
              )}

              {profile?.email && (
                <View className="flex items-center gap-2 py-2 border-t border-border">
                  <View className="i-mdi-email text-primary" />
                  <Text className="text-sm text-muted-foreground">邮箱：</Text>
                  <Text className="text-sm text-foreground">{profile.email}</Text>
                </View>
              )}

              {profile?.openid && (
                <View className="flex items-center gap-2 py-2 border-t border-border">
                  <View className="i-mdi-wechat text-primary" />
                  <Text className="text-sm text-muted-foreground">已绑定微信</Text>
                </View>
              )}
            </View>

            {/* 已归档话题 */}
            <View className="bg-card rounded-xl p-4 mb-4 shadow-lg">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <View className="i-mdi-archive text-xl text-accent-foreground" />
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground">已归档话题</Text>
                    <Text className="text-xs text-muted-foreground mt-1">查看归档的话题</Text>
                  </View>
                </View>
                <Button
                  className="bg-primary text-white px-4 py-2 rounded-lg break-keep text-sm"
                  size="mini"
                  onClick={() => Taro.navigateTo({url: '/pages/archived-topics/index'})}>
                  查看
                </Button>
              </View>
            </View>

            {/* 关于应用 */}
            <View className="bg-card rounded-xl p-4 mb-4 shadow-lg">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <View className="i-mdi-information text-xl text-accent-foreground" />
                </View>
                <Text className="text-base font-semibold text-foreground">关于 TaskPro</Text>
              </View>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                TaskPro
                是一个轻量级任务管理系统，提供类似聊天的任务输入体验和强大的标签管理功能，帮助您高效管理任务和项目。
              </Text>
              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-xs text-muted-foreground">版本：1.0.0</Text>
                <Text className="text-xs text-muted-foreground mt-1">© 2026 TaskPro</Text>
              </View>
            </View>

            {/* 退出登录 */}
            <Button
              className="w-full bg-destructive text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
