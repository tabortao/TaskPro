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
  const [showMenu, setShowMenu] = useState(false)

  useLoad((options) => {
    if (options.taskId) {
      setTaskId(options.taskId)
    }
  })

  const loadData = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      console.log('[任务详情] 开始加载，taskId:', taskId)

      // 获取当前用户 ID
      const currentUserId = await getCurrentUserId()
      console.log('[任务详情] 当前用户 ID:', currentUserId)
      setUserId(currentUserId)

      console.log('[任务详情] 开始获取任务数据...')
      const taskData = await getTaskById(taskId)
      console.log('[任务详情] 任务数据:', taskData)
      setTask(taskData)

      console.log('[任务详情] 开始获取评论数据...')
      const commentsData = await getCommentsByTaskId(taskId)
      console.log('[任务详情] 评论数据:', commentsData)
      setComments(commentsData)

      console.log('[任务详情] 加载完成')
    } catch (error: any) {
      console.error('[任务详情] 加载失败:', error)
      console.error('[任务详情] 错误详情:', error?.message, error?.details, error?.hint)
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

  const handleToggleComplete = async () => {
    if (!task || !userId) return

    try {
      await updateTask(task.id, {is_completed: !task.is_completed})
      setTask({...task, is_completed: !task.is_completed})
      Taro.showToast({title: task.is_completed ? '标记为未完成' : '标记为已完成', icon: 'success'})
    } catch (error) {
      console.error('更新完成状态失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleTogglePin = async () => {
    if (!task || !userId) return

    try {
      await updateTask(task.id, {is_pinned: !task.is_pinned})
      setTask({...task, is_pinned: !task.is_pinned})
      Taro.showToast({title: task.is_pinned ? '取消置顶' : '已置顶', icon: 'success'})
      setShowMenu(false)
    } catch (error) {
      console.error('更新置顶状态失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleEdit = async () => {
    if (!task) return

    setShowMenu(false)

    // 使用 Taro.prompt 编辑任务内容（H5 环境）
    // 小程序环境暂时提示功能开发中
    Taro.showModal({
      title: '编辑任务',
      content: `当前任务内容：\n${task.content}\n\n小程序暂不支持直接编辑，请在任务列表中重新创建任务。`,
      showCancel: true,
      confirmText: '知道了'
    })
  }

  const handleDelete = async () => {
    if (!task || !userId) return

    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？'
    })

    if (!result.confirm) return

    try {
      const {deleteTask} = await import('@/db/api')
      await deleteTask(task.id)
      Taro.showToast({title: '删除成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('删除任务失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
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
      {/* 遮罩层 - 点击关闭菜单 */}
      {showMenu && (
        <View className="fixed inset-0 z-40" style={{background: 'transparent'}} onClick={() => setShowMenu(false)} />
      )}

      {/* 任务内容 */}
      <ScrollView scrollY className="flex-1" style={{height: 'calc(100vh - 120px)'}}>
        <View className="p-4">
          {/* 任务卡片 */}
          <View className="bg-card rounded-xl p-4 shadow-md border border-border mb-4">
            {/* 任务状态、收藏和菜单 */}
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                    task.is_completed ? 'bg-primary border-primary' : 'border-border'
                  }`}
                  onClick={handleToggleComplete}>
                  {task.is_completed && <View className="i-mdi-check text-white text-sm" />}
                </View>
                <Text className="text-sm text-muted-foreground">{task.is_completed ? '已完成' : '进行中'}</Text>
              </View>
              <View className="flex items-center gap-2">
                <View
                  className="i-mdi-star text-2xl"
                  style={{color: task.is_favorite ? '#F39C12' : '#ccc'}}
                  onClick={handleToggleFavorite}
                />
                {/* 菜单按钮 */}
                <View className="relative">
                  <View
                    className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center"
                    onClick={() => setShowMenu(!showMenu)}>
                    <View className="i-mdi-dots-vertical text-lg text-secondary-foreground" />
                  </View>

                  {/* 菜单选项 */}
                  {showMenu && (
                    <View className="absolute top-10 right-0 bg-card rounded-xl shadow-xl border border-border overflow-hidden min-w-32 z-50">
                      <View
                        className="px-4 py-3 flex items-center gap-2 hover:bg-accent active:bg-accent border-b border-border"
                        onClick={handleTogglePin}>
                        <View className={`i-mdi-pin text-lg ${task.is_pinned ? 'text-primary' : 'text-foreground'}`} />
                        <Text className="text-sm text-foreground">{task.is_pinned ? '取消置顶' : '置顶'}</Text>
                      </View>
                      <View
                        className="px-4 py-3 flex items-center gap-2 hover:bg-accent active:bg-accent border-b border-border"
                        onClick={handleEdit}>
                        <View className="i-mdi-pencil text-lg text-foreground" />
                        <Text className="text-sm text-foreground">编辑</Text>
                      </View>
                      <View
                        className="px-4 py-3 flex items-center gap-2 hover:bg-accent active:bg-accent border-b border-border"
                        onClick={handleToggleFavorite}>
                        <View
                          className={`i-mdi-star text-lg ${task.is_favorite ? 'text-primary' : 'text-foreground'}`}
                        />
                        <Text className="text-sm text-foreground">{task.is_favorite ? '取消收藏' : '收藏'}</Text>
                      </View>
                      <View
                        className="px-4 py-3 flex items-center gap-2 hover:bg-accent active:bg-accent"
                        onClick={handleDelete}>
                        <View className="i-mdi-delete text-lg text-destructive" />
                        <Text className="text-sm text-destructive">删除</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
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
