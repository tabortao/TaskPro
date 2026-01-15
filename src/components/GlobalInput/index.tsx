// 全局输入框组件
import {Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import {createTask, findOrCreateTag, getTopic, getTopics} from '@/db/api'
import {getCurrentUserId} from '@/utils/auth'
import {parseTagsFromContent} from '@/utils/tags'

interface GlobalInputProps {
  topicId?: string // 如果在话题页面，传入话题 ID
  onTaskCreated?: () => void // 任务创建成功回调
}

export default function GlobalInput({topicId, onTaskCreated}: GlobalInputProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return

    try {
      setSubmitting(true)
      const userId = await getCurrentUserId()
      if (!userId) {
        Taro.showToast({title: '请先登录', icon: 'none'})
        return
      }

      // 解析内容：@话题名称 #标签 内容
      let targetTopicId = topicId
      let taskContent = content.trim()
      const tagMatches: string[] = []

      // 解析 @话题名称
      const topicMatch = taskContent.match(/@([^\s#]+)/)
      if (topicMatch) {
        const topicName = topicMatch[1]
        taskContent = taskContent.replace(topicMatch[0], '').trim()

        // 查找话题
        const topics = await getTopics(userId, topicName, false)
        const foundTopic = topics.find((t) => t.name === topicName)
        if (foundTopic) {
          targetTopicId = foundTopic.id
        } else {
          Taro.showToast({title: `话题"${topicName}"不存在`, icon: 'none'})
          return
        }
      }

      // 如果没有指定话题，提示用户
      if (!targetTopicId) {
        Taro.showToast({title: '请指定话题（@话题名称）', icon: 'none'})
        return
      }

      // 解析 #标签
      const parsedTags = parseTagsFromContent(taskContent)
      parsedTags.forEach((tag) => {
        tagMatches.push(tag)
        taskContent = taskContent.replace(`#${tag}`, '').trim()
      })

      // 创建任务
      const task = await createTask({
        topic_id: targetTopicId,
        content: taskContent,
        user_id: userId,
        is_completed: false,
        is_pinned: false,
        is_favorite: false
      })

      // 添加标签
      if (task && tagMatches.length > 0) {
        const topic = await getTopic(targetTopicId)
        if (topic) {
          for (const tagStr of tagMatches) {
            const tag = await findOrCreateTag(userId, targetTopicId, tagStr)
            if (tag) {
              const {addTaskTags} = await import('@/db/api')
              await addTaskTags(task.id, [tag.id])
            }
          }
        }
      }

      setContent('')
      Taro.showToast({title: '创建成功', icon: 'success'})
      onTaskCreated?.()
    } catch (error) {
      console.error('创建任务失败:', error)
      Taro.showToast({title: '创建失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  const _handleKeyDown = (e: any) => {
    // 检测 Enter 键（小程序环境可能不支持，但保留逻辑）
    if (e.detail?.keyCode === 13 && !e.detail?.shiftKey) {
      e.preventDefault?.()
      handleSubmit()
    }
  }

  return (
    <View className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-30">
      <View className="flex items-end gap-2">
        <View className="flex-1 bg-input rounded-lg border border-border px-3 py-2">
          <Textarea
            className="w-full text-foreground text-sm"
            style={{minHeight: '40px', maxHeight: '120px', padding: 0, border: 'none', background: 'transparent'}}
            placeholder={topicId ? '输入 #标签 内容' : '输入 @话题名称 #标签 内容'}
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            onConfirm={handleSubmit}
            autoHeight
            maxlength={500}
          />
        </View>
        <View
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            content.trim() && !submitting ? 'bg-primary' : 'bg-muted'
          }`}
          onClick={handleSubmit}>
          <View
            className={`i-mdi-send text-xl ${content.trim() && !submitting ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          />
        </View>
      </View>
      <View className="mt-2 text-xs text-muted-foreground">
        {topicId
          ? '提示：支持 #标签 和 Markdown 图片语法 ![](url)'
          : '提示：支持 @话题 #标签 和 Markdown 图片语法 ![](url)'}
      </View>
    </View>
  )
}
