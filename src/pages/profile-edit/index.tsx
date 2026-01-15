import {Button, Image, Input, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useState} from 'react'
import {getProfile, updateProfile} from '@/db/api'
import type {Profile} from '@/db/types'
import {getCurrentUserId} from '@/utils/auth'
import {getImageUrl, uploadImage} from '@/utils/upload'

// 常用 Emoji 头像
const AVATAR_EMOJIS = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '🤣',
  '😂',
  '🙂',
  '🙃',
  '😉',
  '😊',
  '😇',
  '🥰',
  '😍',
  '🤩',
  '😘',
  '😗',
  '☺️',
  '😚'
]

export default function ProfileEdit() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>('emoji')
  const [avatarEmoji, setAvatarEmoji] = useState('😀')
  const [avatarImage, setAvatarImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

        // 判断头像类型
        if (profileData.avatar_url) {
          if (profileData.avatar_url.startsWith('emoji:')) {
            setAvatarType('emoji')
            setAvatarEmoji(profileData.avatar_url.replace('emoji:', ''))
          } else {
            setAvatarType('image')
            setAvatarImage(profileData.avatar_url)
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

  const handleUploadAvatar = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths.length > 0) {
        Taro.showLoading({title: '上传中...'})
        const imageUrl = await uploadImage(res.tempFilePaths[0])
        setAvatarImage(imageUrl)
        setAvatarType('image')
        Taro.hideLoading()
        Taro.showToast({title: '上传成功', icon: 'success'})
      }
    } catch (error) {
      console.error('上传头像失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '上传失败', icon: 'none'})
    }
  }

  const handleSave = async () => {
    if (!profile) return

    if (!nickname.trim()) {
      Taro.showToast({title: '请输入昵称', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const avatarUrl = avatarType === 'emoji' ? `emoji:${avatarEmoji}` : avatarImage

      await updateProfile(profile.id, {
        nickname: nickname.trim(),
        avatar_url: avatarUrl
      })

      Taro.showToast({title: '保存成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
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
        <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-subtle">
      <View className="p-4">
        {/* 头像设置 */}
        <View className="bg-card rounded-xl p-4 shadow-md border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">头像设置</Text>

          {/* 头像类型选择 */}
          <View className="flex items-center gap-3 mb-4">
            <View
              className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                avatarType === 'emoji' ? 'bg-primary' : 'bg-secondary'
              }`}
              onClick={() => setAvatarType('emoji')}>
              <Text className={`text-base break-keep ${avatarType === 'emoji' ? 'text-white' : 'text-foreground'}`}>
                Emoji 头像
              </Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                avatarType === 'image' ? 'bg-primary' : 'bg-secondary'
              }`}
              onClick={() => setAvatarType('image')}>
              <Text className={`text-base break-keep ${avatarType === 'image' ? 'text-white' : 'text-foreground'}`}>
                图片头像
              </Text>
            </View>
          </View>

          {/* Emoji 选择 */}
          {avatarType === 'emoji' && (
            <View>
              <View className="flex items-center justify-center mb-3">
                <Text className="text-6xl">{avatarEmoji}</Text>
              </View>
              <View className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <View
                    key={emoji}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      avatarEmoji === emoji ? 'bg-primary' : 'bg-secondary'
                    }`}
                    onClick={() => setAvatarEmoji(emoji)}>
                    <Text className="text-2xl">{emoji}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 图片上传 */}
          {avatarType === 'image' && (
            <View>
              {avatarImage ? (
                <View className="flex flex-col items-center gap-3">
                  <Image src={getImageUrl(avatarImage)} className="w-32 h-32 rounded-full" mode="aspectFill" />
                  <Button
                    className="w-full bg-primary text-white py-3 rounded-lg break-keep text-base"
                    size="default"
                    onClick={handleUploadAvatar}>
                    重新上传
                  </Button>
                </View>
              ) : (
                <View className="flex flex-col items-center gap-3 py-8">
                  <View className="i-mdi-image-plus text-6xl text-muted-foreground" />
                  <Button
                    className="w-full bg-primary text-white py-3 rounded-lg break-keep text-base"
                    size="default"
                    onClick={handleUploadAvatar}>
                    上传头像
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 昵称设置 */}
        <View className="bg-card rounded-xl p-4 shadow-md border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">昵称</Text>
          <View className="bg-input rounded-lg border border-border px-3 py-2">
            <Input
              className="w-full text-foreground"
              style={{padding: 0, border: 'none', background: 'transparent'}}
              placeholder="请输入昵称"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              maxlength={20}
            />
          </View>
        </View>

        {/* 保存按钮 */}
        <Button
          className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
          size="default"
          onClick={submitting ? undefined : handleSave}>
          {submitting ? '保存中...' : '保存'}
        </Button>
      </View>
    </View>
  )
}
