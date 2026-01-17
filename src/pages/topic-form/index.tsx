import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useLoad} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import EmojiPicker from '@/components/EmojiPicker'
import {createTopic, deleteTopic, getTopic, updateTopic} from '@/db/api'
import {authGuard, getCurrentUserId} from '@/utils/auth'

export default function TopicForm() {
  const [topicId, setTopicId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconEmoji, setIconEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useLoad((options) => {
    if (options.topicId) {
      setTopicId(options.topicId)
      setIsEdit(true)
    }
  })

  const loadTopic = useCallback(async () => {
    if (!topicId) return

    try {
      setLoading(true)
      const data = await getTopic(topicId)

      if (data) {
        setName(data.name)
        setDescription(data.description || '')
        setIconEmoji(data.icon_url || '')
      }
    } catch (error) {
      console.error('加载话题失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useDidShow(() => {
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    authGuard(currentPath).then((isAuth) => {
      if (isAuth && topicId) {
        loadTopic()
      }
    })
  })

  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({title: '请输入话题名称', icon: 'none'})
      return
    }

    setSaving(true)

    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      if (isEdit) {
        await updateTopic(topicId, {
          name,
          description: description || null,
          icon_url: iconEmoji || null
        })
        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        await createTopic({
          user_id: userId,
          name,
          description: description || null,
          icon_url: iconEmoji || null,
          is_archived: false,
          is_pinned: false
        })
        Taro.showToast({title: '创建成功', icon: 'success'})
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error: any) {
      console.error('保存失败:', error)
      Taro.showToast({title: error.message || '保存失败', icon: 'none'})
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除话题后，该话题下的所有任务也会被删除，确定要删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteTopic(topicId)
            Taro.showToast({title: '删除成功', icon: 'success'})
            setTimeout(() => {
              Taro.navigateBack()
            }, 500)
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({title: '删除失败', icon: 'none'})
          }
        }
      }
    })
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
          <Text className="text-sm text-muted-foreground mb-2">话题图标</Text>
          <View className="flex items-center gap-4">
            <View
              className="w-20 h-20 bg-gradient-primary rounded-xl flex items-center justify-center cursor-pointer"
              onClick={() => setShowEmojiPicker(true)}>
              {iconEmoji ? (
                <Text className="text-4xl">{iconEmoji}</Text>
              ) : (
                <View className="i-mdi-emoticon-outline text-4xl text-white" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm text-foreground mb-1">点击选择 Emoji 图标</Text>
              <Text className="text-xs text-muted-foreground">或直接在下方输入框输入 Emoji</Text>
            </View>
          </View>
          <View className="mt-3">
            <Input
              className="w-full bg-input rounded-lg border border-border px-3 py-2 text-foreground"
              placeholder="或直接输入 Emoji"
              value={iconEmoji}
              onInput={(e) => setIconEmoji(e.detail.value)}
            />
          </View>
        </View>

        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-2">话题名称 *</Text>
          <Input
            className="w-full bg-input rounded-lg border border-border px-3 py-2 text-foreground"
            placeholder="请输入话题名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-2">话题描述</Text>
          <View className="bg-input rounded-lg border border-border px-3 py-2">
            <Textarea
              className="w-full text-foreground"
              style={{minHeight: '80px', padding: 0, border: 'none', background: 'transparent'}}
              placeholder="请输入话题描述（可选）"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>

        <View className="flex gap-3 pt-4">
          <Button
            className="flex-1 bg-primary text-white py-4 rounded-xl break-keep text-base"
            size="default"
            onClick={handleSave}
            disabled={saving}>
            {saving ? '保存中...' : isEdit ? '更新话题' : '创建话题'}
          </Button>
          {isEdit && (
            <Button
              className="bg-destructive text-destructive-foreground py-4 px-6 rounded-xl break-keep text-base"
              size="default"
              onClick={handleDelete}>
              删除
            </Button>
          )}
        </View>
      </View>

      {showEmojiPicker && (
        <EmojiPicker
          selectedEmoji={iconEmoji}
          onSelect={(emoji) => {
            setIconEmoji(emoji)
            setShowEmojiPicker(false)
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </ScrollView>
  )
}
