import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useLoad} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import {getTaskById, updateTask} from '@/db/api'
import type {TaskWithTags} from '@/db/types'

export default function TaskEdit() {
  const [task, setTask] = useState<TaskWithTags | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskId, setTaskId] = useState('')

  useLoad((options) => {
    if (options.taskId) {
      setTaskId(options.taskId)
    }
  })

  const loadData = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      console.log('[任务编辑] 开始加载，taskId:', taskId)
      const taskData = await getTaskById(taskId)
      console.log('[任务编辑] 任务数据:', taskData)
      if (taskData) {
        setTask(taskData)
        setContent(taskData.content)
      }
    } catch (error: any) {
      console.error('[任务编辑] 加载失败:', error)
      Taro.showToast({
        title: `加载失败: ${error?.message || '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!task || !content.trim()) {
      Taro.showToast({title: '请输入任务内容', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      console.log('[任务编辑] 开始保存，内容:', content)
      await updateTask(task.id, {content: content.trim()})
      console.log('[任务编辑] 保存成功')
      Taro.showToast({title: '保存成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error: any) {
      console.error('[任务编辑] 保存失败:', error)
      Taro.showToast({
        title: `保存失败: ${error?.message || '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
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

  if (!task) {
    return (
      <View className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4" />
        <Text className="text-muted-foreground">任务不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-subtle flex flex-col">
      <ScrollView scrollY className="flex-1 p-4">
        {/* 编辑表单 */}
        <View className="bg-card rounded-xl p-4 shadow-md border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">编辑任务</Text>

          {/* 任务内容 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2">任务内容</Text>
            <View className="bg-input rounded-lg border border-border p-3">
              <Textarea
                className="w-full text-foreground text-base"
                style={{minHeight: '120px', padding: 0, border: 'none', background: 'transparent'}}
                value={content}
                onInput={(e) => setContent(e.detail.value)}
                placeholder="请输入任务内容"
                maxlength={-1}
              />
            </View>
          </View>

          {/* 标签显示 */}
          {task.tags && task.tags.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2">标签</Text>
              <View className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <View
                    key={tag.id}
                    className="px-3 py-1 rounded-lg flex items-center gap-1"
                    style={{backgroundColor: `${tag.color}30`}}>
                    <View className="w-2 h-2 rounded-full" style={{backgroundColor: tag.color}} />
                    <Text className="text-sm" style={{color: tag.color}}>
                      {tag.name}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-muted-foreground mt-2">提示：标签编辑功能开发中</Text>
            </View>
          )}

          {/* 保存按钮 */}
          <Button
            className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base mt-4"
            size="default"
            onClick={submitting ? undefined : handleSave}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
