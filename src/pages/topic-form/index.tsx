import {Button, Image, Input, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useLoad} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {createTopic, deleteTopic, getTopic, updateTopic} from '@/db/api'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import {chooseAndUploadImage, getImageUrl} from '@/utils/upload'
import './index.scss'

export default function TopicForm() {
  const [topicId, setTopicId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

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
        setIconUrl(data.icon_url || '')
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

  const handleChooseIcon = async () => {
    const result = await chooseAndUploadImage()
    if (result.success && result.url) {
      setIconUrl(result.url)
    }
  }

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
          icon_url: iconUrl || null
        })
        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        await createTopic({
          user_id: userId,
          name,
          description: description || null,
          icon_url: iconUrl || null
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
          } catch (error: any) {
            console.error('删除失败:', error)
            Taro.showToast({title: error.message || '删除失败', icon: 'none'})
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gradient-subtle p-4">
      {loading ? (
        <View className="flex flex-col items-center justify-center py-20">
          <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View>
          {/* 表单 */}
          <View className="bg-card rounded-xl p-4 mb-4 shadow-lg">
            {/* 话题图标 */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">话题图标</Text>
              <View className="flex items-center gap-4">
                {iconUrl ? (
                  <Image src={getImageUrl(iconUrl)} className="w-20 h-20 rounded-lg" mode="aspectFill" />
                ) : (
                  <View className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <View className="i-mdi-image text-3xl text-muted-foreground" />
                  </View>
                )}
                <Button
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg break-keep text-sm"
                  size="mini"
                  onClick={handleChooseIcon}>
                  {iconUrl ? '更换图标' : '选择图标'}
                </Button>
              </View>
            </View>

            {/* 话题名称 */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">话题名称 *</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入话题名称"
                  value={name}
                  onInput={(e) => setName(e.detail.value)}
                  maxlength={50}
                  disabled={saving}
                />
              </View>
            </View>

            {/* 话题简介 */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">话题简介</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Textarea
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent', minHeight: '80px'}}
                  placeholder="请输入话题简介（可选）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  maxlength={200}
                  autoHeight
                  disabled={saving}
                />
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex flex-col gap-3">
            <Button
              className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={saving ? undefined : handleSave}>
              {saving ? '保存中...' : isEdit ? '保存修改' : '创建话题'}
            </Button>

            {isEdit && (
              <Button
                className="w-full bg-destructive text-white py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={handleDelete}>
                删除话题
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
