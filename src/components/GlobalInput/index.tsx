// 全局输入框组件
import {Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import {createComment, createTask, findOrCreateTag, getTopics} from '@/db/api'
import {getCurrentUserId} from '@/utils/auth'
import {parseTagsFromContent} from '@/utils/tags'

interface GlobalInputProps {
  mode?: 'task' | 'comment' // 模式：任务创建或评论创建
  topicId?: string // 如果在话题页面，传入话题 ID
  taskId?: string // 如果是评论模式，传入任务 ID
  onTaskCreated?: () => void // 任务创建成功回调
  onCommentCreated?: () => void // 评论创建成功回调
}

export default function GlobalInput({
  mode = 'task',
  topicId,
  taskId,
  onTaskCreated,
  onCommentCreated
}: GlobalInputProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!content.trim() || !taskId) return

    try {
      setSubmitting(true)
      const userId = await getCurrentUserId()
      if (!userId) {
        Taro.showToast({title: '请先登录', icon: 'none'})
        return
      }

      // 处理 Markdown 图片语法
      let commentContent = content.trim()
      commentContent = commentContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[图片:$2]')
      commentContent = commentContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

      await createComment({
        task_id: taskId,
        user_id: userId,
        content: commentContent
      })

      setContent('')
      Taro.showToast({title: '评论成功', icon: 'success'})
      onCommentCreated?.()
    } catch (error: any) {
      console.error('创建评论失败:', error)
      Taro.showToast({title: error.message || '评论失败', icon: 'none', duration: 2000})
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitTask = async () => {
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

      // 如果没有指定话题，自动使用第一个话题
      if (!targetTopicId) {
        const topics = await getTopics(userId, '', false)
        if (topics.length === 0) {
          Taro.showToast({title: '请先创建话题', icon: 'none', duration: 2000})
          return
        }
        targetTopicId = topics[0].id
        console.log('自动使用第一个话题:', topics[0].name, topics[0].id)
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

      console.log('开始创建任务，话题ID:', targetTopicId, '内容:', taskContent, '标签:', tagMatches)

      // 创建任务
      const task = await createTask({
        topic_id: targetTopicId,
        content: taskContent,
        user_id: userId,
        is_completed: false,
        is_pinned: false,
        is_favorite: false
      })

      console.log('任务创建成功:', task)

      // 添加标签
      if (task && tagMatches.length > 0) {
        console.log('开始添加标签:', tagMatches)
        for (const tagStr of tagMatches) {
          // findOrCreateTag 参数：userId, tagName, parentId, topicId
          const tag = await findOrCreateTag(userId, tagStr, null, targetTopicId)
          console.log('标签创建/查找成功:', tag)
          if (tag) {
            const {addTaskTags} = await import('@/db/api')
            await addTaskTags(task.id, [tag.id])
            console.log('标签已添加到任务')
          }
        }
      }

      setContent('')
      Taro.showToast({title: '创建成功', icon: 'success'})
      onTaskCreated?.()
    } catch (error: any) {
      console.error('创建任务失败:', error)
      Taro.showToast({title: error.message || '创建失败', icon: 'none', duration: 2000})
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'comment') {
      handleSubmitComment()
    } else {
      handleSubmitTask()
    }
  }

  const _handleKeyDown = (e: any) => {
    // 检测 Enter 键（小程序环境可能不支持，但保留逻辑）
    if (e.detail?.keyCode === 13 && !e.detail?.shiftKey) {
      e.preventDefault?.()
      handleSubmit()
    }
  }

  const placeholder =
    mode === 'comment'
      ? '写下你的评论...'
      : topicId
        ? '输入 #标签 内容'
        : '输入 @话题名称 #标签 内容（不输入@则自动创建到第一个话题）'

  return (
    <View className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-30">
      <View className="flex items-end gap-2">
        <Textarea
          className="flex-1 text-foreground text-sm bg-transparent px-3 py-2 rounded-lg border border-border"
          style={{minHeight: '44px', maxHeight: '120px'}}
          placeholder={placeholder}
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
