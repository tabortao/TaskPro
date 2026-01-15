import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useState} from 'react'
import EmojiPicker from '@/components/EmojiPicker'
import {getProfile, updateProfile} from '@/db/api'
import type {Profile} from '@/db/types'
import {getCurrentUserId} from '@/utils/auth'

export default function ProfileEdit() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('😀')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        Taro.showToast({title: '请先登录', icon: 'none'})
        Taro.navigateBack()
        return
      }

      const profileData = await getProfile(userId)
      if (profileData) {
        setProfile(profileData)
        setNickname(profileData.nickname || '')

        if (profileData.avatar_url) {
          if (profileData.avatar_url.startsWith('emoji:')) {
            setAvatarEmoji(profileData.avatar_url.replace('emoji:', ''))
          } else {
            setAvatarEmoji(profileData.avatar_url)
          }
        }
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({title: '请输入昵称', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const avatarUrl = avatarEmoji.startsWith('emoji:') ? avatarEmoji : `emoji:${avatarEmoji}`

      await updateProfile(userId, {
        nickname: nickname.trim(),
        avatar_url: avatarUrl
      })

      Taro.showToast({title: '保存成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <View className="i-mdi-loading animate-spin text-4xl text-primary" />
      </View>
    )
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-gradient-subtle">
      <View className="p-4 space-y-4">
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-3">头像</Text>
          <View className="flex items-center gap-4">
            <View
              className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => setShowEmojiPicker(true)}>
              <Text className="text-4xl">{avatarEmoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-foreground mb-1">点击选择 Emoji 头像</Text>
              <Text className="text-xs text-muted-foreground">或直接在下方输入框输入 Emoji</Text>
            </View>
          </View>
          <View className="mt-3">
            <Input
              className="w-full bg-input rounded-lg border border-border px-3 py-2 text-foreground"
              placeholder="或直接输入 Emoji"
              value={avatarEmoji}
              onInput={(e) => setAvatarEmoji(e.detail.value)}
            />
          </View>
        </View>

        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-2">昵称 *</Text>
          <Input
            className="w-full bg-input rounded-lg border border-border px-3 py-2 text-foreground"
            placeholder="请输入昵称"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-2">邮箱</Text>
          <Text className="text-foreground">{profile?.email || '未设置'}</Text>
        </View>

        <Button
          className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base mt-6"
          size="default"
          onClick={handleSave}
          disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </Button>
      </View>

      {showEmojiPicker && (
        <EmojiPicker
          selectedEmoji={avatarEmoji}
          onSelect={(emoji) => {
            setAvatarEmoji(emoji)
            setShowEmojiPicker(false)
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </ScrollView>
  )
}
