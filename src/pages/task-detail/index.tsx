import {Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useLoad} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import GlobalInput from '@/components/GlobalInput'
import {deleteComment, getCommentsByTaskId, getTaskById, updateTask} from '@/db/api'
import type {CommentWithUser, TaskWithTags} from '@/db/types'
import {getCurrentUserId} from '@/utils/auth'
import {getImageUrl} from '@/utils/upload'

export default function TaskDetail() {
  const [task, setTask] = useState<TaskWithTags | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useLoad((options) => {
    if (options.taskId) {
      setTaskId(options.taskId)
    }
  })

  const loadData = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      // 获取当前用户 ID
      const currentUserId = await getCurrentUserId()
      setUserId(currentUserId)

      const taskData = await getTaskById(taskId)
      setTask(taskData)

      const commentsData = await getCommentsByTaskId(taskId)
      setComments(commentsData)
    } catch (error) {
      console.error('加载任务详情失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleFavorite = async () => {
    if (!task || !userId) return

    try {
      await updateTask(task.id, {is_favorite: !task.is_favorite})
      setTask({...task, is_favorite: !task.is_favorite})
      Taro.showToast({title: task.is_favorite ? '取消收藏' : '已收藏', icon: 'success'})
    } catch (error) {
      console.error('更新收藏状态失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？'
    })

    if (!result.confirm) return

    try {
      await deleteComment(commentId)
      await loadData()
      Taro.showToast({title: '删除成功', icon: 'success'})
    } catch (error) {
      console.error('删除评论失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // 解析内容中的图片
  const imageRegex = /\[图片:(https?:\/\/[^\]]+)\]/g
  const images: string[] = []
  if (task) {
    const matches = task.content.matchAll(imageRegex)
    for (const match of matches) {
      images.push(match[1])
    }
  }

  // 移除图片和标签，只显示纯文本内容
  let contentWithoutImagesAndTags = task?.content.replace(imageRegex, '') || ''
  contentWithoutImagesAndTags = contentWithoutImagesAndTags.replace(/#[^\s#]+/g, '').trim()

  // 解析超链接
  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={index}
            className="text-primary underline break-all"
            onClick={() => {
              Taro.setClipboardData({
                data: part,
                success: () => {
                  Taro.showModal({
                    title: '打开链接',
                    content: `链接已复制到剪贴板：${part}\n\n小程序无法直接打开外部链接，请在浏览器中粘贴访问。`,
                    showCancel: false
                  })
                }
              })
            }}>
            {part}
          </Text>
        )
      }
      return (
        <Text key={index} className="break-all">
          {part}
        </Text>
      )
    })
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
      {/* 任务内容 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 120px)'}}>
        <View className="p-4">
          {/* 任务卡片 */}
          <View className="bg-card rounded-xl p-4 shadow-md border border-border mb-4">
            {/* 任务状态和收藏 */}
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.is_completed ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                  {task.is_completed && <View className="i-mdi-check text-white text-sm" />}
                </View>
                <Text className="text-sm text-muted-foreground">{task.is_completed ? '已完成' : '进行中'}</Text>
              </View>
              <View
                className="i-mdi-star text-2xl"
                style={{color: task.is_favorite ? '#F39C12' : '#ccc'}}
                onClick={handleToggleFavorite}
              />
            </View>

            {/* 任务内容 */}
            <View className="mb-3">
              <Text className="text-base text-foreground break-keep">
                {renderContentWithLinks(contentWithoutImagesAndTags)}
              </Text>
            </View>

            {/* 标签 */}
            {task.tags && task.tags.length > 0 && (
              <View className="flex flex-wrap gap-2 mb-3">
                {task.tags.map((tag) => (
                  <View
                    key={tag.id}
                    className="px-2 py-1 rounded flex items-center gap-1"
                    style={{backgroundColor: `${tag.color}30`}}>
                    {tag.emoji && <Text className="text-xs">{tag.emoji}</Text>}
                    <Text className="text-xs font-semibold" style={{color: tag.color}}>
                      {tag.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 图片 */}
            {images.length > 0 && (
              <View className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <Image
                    key={index}
                    src={getImageUrl(img)}
                    className="w-24 h-24 rounded"
                    mode="aspectFill"
                    onClick={() => {
                      Taro.previewImage({
                        urls: images.map((i) => getImageUrl(i)),
                        current: getImageUrl(img)
                      })
                    }}
                  />
                ))}
              </View>
            )}

            {/* 创建时间 */}
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted-foreground">
                创建于 {new Date(task.created_at).toLocaleString('zh-CN')}
              </Text>
            </View>
          </View>

          {/* 评论列表 */}
          <View className="bg-card rounded-xl p-4 shadow-md border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">评论 ({comments.length})</Text>

            {comments.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-10">
                <View className="i-mdi-comment-outline text-4xl text-muted-foreground mb-2" />
                <Text className="text-muted-foreground">暂无评论</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <View key={comment.id} className="bg-secondary rounded-lg p-3">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Text className="text-white text-sm">{comment.user?.nickname?.[0] || '用'}</Text>
                        </View>
                        <Text className="text-sm font-semibold text-foreground">
                          {comment.user?.nickname || '匿名用户'}
                        </Text>
                      </View>
                      {userId && comment.user_id === userId && (
                        <View
                          className="i-mdi-delete text-lg text-muted-foreground"
                          onClick={() => handleDeleteComment(comment.id)}
                        />
                      )}
                    </View>
                    <Text className="text-sm text-foreground break-keep">{comment.content}</Text>
                    <Text className="text-xs text-muted-foreground mt-2">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 全局输入框（评论模式） */}
      <GlobalInput mode="comment" taskId={taskId} onCommentCreated={loadData} />
    </View>
  )
}
