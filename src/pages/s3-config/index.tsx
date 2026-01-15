import {Button, Input, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getProfile, updateProfile} from '@/db/api'
import type {Profile} from '@/db/types'
import {authGuard, getCurrentUserId} from '@/utils/auth'
import './index.scss'

export default function S3Config() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [endpoint, setEndpoint] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [bucket, setBucket] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const userId = await getCurrentUserId()
      if (!userId) return

      const data = await getProfile(userId)
      setProfile(data)

      if (data) {
        setEndpoint(data.s3_endpoint || '')
        setAccessKey(data.s3_access_key || '')
        setSecretKey(data.s3_secret_key || '')
        setBucket(data.s3_bucket || '')
        setRegion(data.s3_region || '')
      }
    } catch (error) {
      console.error('加载配置失败:', error)
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

  const handleSave = async () => {
    if (!endpoint.trim() || !accessKey.trim() || !secretKey.trim() || !bucket.trim()) {
      Taro.showToast({title: '请填写完整的配置信息', icon: 'none'})
      return
    }

    setSaving(true)

    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      await updateProfile(userId, {
        s3_endpoint: endpoint,
        s3_access_key: accessKey,
        s3_secret_key: secretKey,
        s3_bucket: bucket,
        s3_region: region || null
      })

      Taro.showToast({title: '保存成功', icon: 'success'})

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

  const handleClear = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除 S3 配置吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const userId = await getCurrentUserId()
            if (!userId) return

            await updateProfile(userId, {
              s3_endpoint: null,
              s3_access_key: null,
              s3_secret_key: null,
              s3_bucket: null,
              s3_region: null
            })

            setEndpoint('')
            setAccessKey('')
            setSecretKey('')
            setBucket('')
            setRegion('')

            Taro.showToast({title: '已清除配置', icon: 'success'})
          } catch (error: any) {
            console.error('清除失败:', error)
            Taro.showToast({title: error.message || '清除失败', icon: 'none'})
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
          {/* 说明 */}
          <View className="bg-accent rounded-xl p-4 mb-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-xl text-accent-foreground mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-accent-foreground leading-relaxed">
                  配置您自己的 S3 存储服务，用于存储任务附件和图片。如不配置，将使用默认的 Supabase Storage。
                </Text>
              </View>
            </View>
          </View>

          {/* 配置表单 */}
          <View className="bg-card rounded-xl p-4 mb-4 shadow-lg">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Endpoint *</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="例如：s3.amazonaws.com"
                  value={endpoint}
                  onInput={(e) => setEndpoint(e.detail.value)}
                  disabled={saving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Access Key *</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入 Access Key"
                  value={accessKey}
                  onInput={(e) => setAccessKey(e.detail.value)}
                  disabled={saving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Secret Key *</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  password
                  placeholder="请输入 Secret Key"
                  value={secretKey}
                  onInput={(e) => setSecretKey(e.detail.value)}
                  disabled={saving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Bucket Name *</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入存储桶名称"
                  value={bucket}
                  onInput={(e) => setBucket(e.detail.value)}
                  disabled={saving}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Region（可选）</Text>
              <View className="bg-input rounded-lg border border-border px-3 py-2">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="例如：us-east-1"
                  value={region}
                  onInput={(e) => setRegion(e.detail.value)}
                  disabled={saving}
                />
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3">
            <Button
              className="flex-1 bg-primary text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={saving ? undefined : handleSave}>
              {saving ? '保存中...' : '保存配置'}
            </Button>

            {profile?.s3_endpoint && (
              <Button
                className="bg-destructive text-white px-6 py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={handleClear}>
                清除
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
