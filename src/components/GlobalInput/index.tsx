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
        console.log('解析到话题名称:', topicName)
        taskContent = taskContent.replace(topicMatch[0], '').trim()

        // 查找话题（搜索所有话题，不限制搜索词）
        const topics = await getTopics(userId, '', false)
        console.log(
          '查找到的话题列表:',
          topics.map((t) => t.name)
        )
        const foundTopic = topics.find((t) => t.name === topicName)
        if (foundTopic) {
          targetTopicId = foundTopic.id
          console.log('找到话题:', foundTopic.name, foundTopic.id)
        } else {
          console.error('话题不存在:', topicName)
          Taro.showToast({title: `话题"${topicName}"不存在`, icon: 'none', duration: 2000})
          return
        }
      }

      // 如果没有指定话题，提示用户
      if (!targetTopicId) {
        Taro.showToast({title: '请指定话题（@话题名称）', icon: 'none', duration: 2000})
        return
      }

      // 解析 #标签
      const parsedTags = parseTagsFromContent(taskContent)
      parsedTags.forEach((tag) => {
        tagMatches.push(tag)
        taskContent = taskContent.replace(`#${tag}`, '').trim()
      })

      // 处理 Markdown 图片语法：![alt](url) 转换为 [图片:url]
      taskContent = taskContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[图片:$2]')

      // 处理 Markdown 超链接语法：[text](url) 转换为 text (url)
      taskContent = taskContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

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
    <View className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-30">
      <View className="flex items-end gap-2">
        <Textarea
          className="flex-1 text-foreground text-sm bg-transparent px-3 py-2 rounded-lg border border-border"
          style={{minHeight: '44px', maxHeight: '120px'}}
          placeholder={topicId ? '输入 #标签 内容' : '输入 @话题名称 #标签 内容'}
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          onConfirm={handleSubmit}
          autoHeight
          maxlength={500}
        />
        <View
          className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
            content.trim() && !submitting ? 'bg-primary' : 'bg-muted'
          }`}
          onClick={handleSubmit}>
          <View
            className={`i-mdi-send text-xl ${content.trim() && !submitting ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          />
        </View>
      </View>
    </View>
  )
}
