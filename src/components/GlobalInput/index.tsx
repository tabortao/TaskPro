// 全局输入框组件
import {Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import TagSelector from '@/components/TagSelector'
import TopicSelector from '@/components/TopicSelector'
import {createComment, createTask, findOrCreateTag, getTags, getTopics} from '@/db/api'
import type {Tag, Topic} from '@/db/types'
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

  // 话题和标签选择器状态
  const [showTopicSelector, setShowTopicSelector] = useState(false)
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<Topic[]>([])
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])

  // 处理输入变化
  const handleInputChange = async (value: string) => {
    setContent(value)

    // 评论模式不需要自动补全
    if (mode === 'comment') return

    const userId = await getCurrentUserId()
    if (!userId) return

    // 检查是否输入了 @
    const atMatch = value.match(/@([^\s#]*)$/)
    if (atMatch) {
      const searchText = atMatch[1]
      const topics = await getTopics(userId, searchText, false)
      setSuggestedTopics(topics.slice(0, 5))
      setShowTopicSelector(topics.length > 0)
      setShowTagSelector(false)
      return
    }

    // 检查是否输入了 #
    const hashMatch = value.match(/#([^\s@]*)$/)
    if (hashMatch) {
      const searchText = hashMatch[1]
      // 获取所有标签
      const allTags = await getTags(userId)
      // 过滤匹配的标签
      const matchedTags = searchText
        ? allTags.filter((tag) => tag.name.toLowerCase().includes(searchText.toLowerCase()))
        : allTags
      setSuggestedTags(matchedTags.slice(0, 10))
      setShowTagSelector(matchedTags.length > 0)
      setShowTopicSelector(false)
      return
    }

    // 没有匹配，隐藏选择器
    setShowTopicSelector(false)
    setShowTagSelector(false)
  }

  // 选择话题
  const handleSelectTopic = (topic: Topic) => {
    const atMatch = content.match(/@([^\s#]*)$/)
    if (atMatch) {
      const beforeAt = content.substring(0, content.lastIndexOf('@'))
      setContent(`${beforeAt}@${topic.name} `)
    }
    setShowTopicSelector(false)
  }

  // 选择标签
  const handleSelectTag = (tag: Tag) => {
    const hashMatch = content.match(/#([^\s@]*)$/)
    if (hashMatch) {
      const beforeHash = content.substring(0, content.lastIndexOf('#'))
      setContent(`${beforeHash}#${tag.name} `)
    }
    setShowTagSelector(false)
  }

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
    <View className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-30">
      {/* 话题选择器 */}
      <TopicSelector topics={suggestedTopics} visible={showTopicSelector} onSelect={handleSelectTopic} />

      {/* 标签选择器 */}
      <TagSelector tags={suggestedTags} visible={showTagSelector} onSelect={handleSelectTag} />

      <View className="flex items-end gap-2">
        <Textarea
          className="flex-1 text-foreground text-base bg-transparent px-4 py-3 rounded-lg border border-border"
          style={{minHeight: '56px', maxHeight: '140px'}}
          placeholder={placeholder}
          value={content}
          onInput={(e) => handleInputChange(e.detail.value)}
          onConfirm={handleSubmit}
          onBlur={() => {
            // 延迟隐藏，以便点击选择器
            setTimeout(() => {
              setShowTopicSelector(false)
              setShowTagSelector(false)
            }, 200)
          }}
          autoHeight
          maxlength={500}
        />
        <View
          className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
            content.trim() && !submitting ? 'bg-primary' : 'bg-muted'
          }`}
          onClick={handleSubmit}>
          <View
            className={`i-mdi-send text-2xl ${content.trim() && !submitting ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          />
        </View>
      </View>
    </View>
  )
}
