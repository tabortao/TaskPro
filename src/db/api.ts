import {supabase} from '@/client/supabase'
import type {Attachment, Comment, CommentWithUser, Profile, Tag, Task, TaskWithTags, Topic} from './types'

// ==================== Profile API ====================

export async function getProfile(userId: string) {
  const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const {data, error} = await supabase.from('profiles').update(updates).eq('id', userId).select().maybeSingle()

  if (error) throw error
  return data as Profile | null
}

// ==================== Topic API ====================

export async function getTopics(userId: string, searchQuery?: string, isArchived = false) {
  let query = supabase
    .from('topics')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', isArchived)
    .order('updated_at', {ascending: false})

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const {data, error} = await query

  if (error) throw error
  return (data || []) as Topic[]
}

export async function getTopic(topicId: string) {
  const {data, error} = await supabase.from('topics').select('*').eq('id', topicId).maybeSingle()

  if (error) throw error
  return data as Topic | null
}

export async function createTopic(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>) {
  const {data, error} = await supabase.from('topics').insert(topic).select().maybeSingle()

  if (error) throw error
  return data as Topic | null
}

export async function updateTopic(topicId: string, updates: Partial<Topic>) {
  const {data, error} = await supabase
    .from('topics')
    .update({...updates, updated_at: new Date().toISOString()})
    .eq('id', topicId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data as Topic | null
}

export async function deleteTopic(topicId: string) {
  const {error} = await supabase.from('topics').delete().eq('id', topicId)

  if (error) throw error
}

// ==================== Task API ====================

export async function getTasks(topicId: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select(`
      *,
      task_tags(tag_id),
      attachments(*)
    `)
    .eq('topic_id', topicId)
    .order('is_pinned', {ascending: false})
    .order('created_at', {ascending: false})

  if (error) throw error

  // 获取所有标签信息
  const tasks = data || []
  const tagIds = tasks.flatMap((t) => (t.task_tags || []).map((tt: any) => tt.tag_id))

  if (tagIds.length > 0) {
    const {data: tagsData} = await supabase.from('tags').select('*').in('id', tagIds)

    const tagsMap = new Map((tagsData || []).map((tag) => [tag.id, tag]))

    return tasks.map((task) => ({
      ...task,
      tags: (task.task_tags || []).map((tt: any) => tagsMap.get(tt.tag_id)).filter(Boolean),
      task_tags: undefined
    })) as TaskWithTags[]
  }

  return tasks.map((task) => ({...task, tags: [], task_tags: undefined})) as TaskWithTags[]
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
  const {data, error} = await supabase.from('tasks').insert(task).select().maybeSingle()

  if (error) throw error
  return data as Task | null
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const {data, error} = await supabase
    .from('tasks')
    .update({...updates, updated_at: new Date().toISOString()})
    .eq('id', taskId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data as Task | null
}

export async function deleteTask(taskId: string) {
  const {error} = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) throw error
}

export async function getTaskById(taskId: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select(
      `
      *,
      tags:task_tags(tag:tags(*)),
      attachments(*)
    `
    )
    .eq('id', taskId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  // 转换数据结构
  const task: TaskWithTags = {
    ...data,
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
    attachments: data.attachments || []
  }

  return task
}

// 全局搜索任务（搜索所有话题的任务）
export async function searchAllTasks(userId: string, keyword: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select(
      `
      *,
      topics!inner(id, name, icon_url),
      tags:task_tags(tag:tags(*))
    `
    )
    .eq('user_id', userId)
    .ilike('content', `%${keyword}%`)
    .order('created_at', {ascending: false})
    .limit(50)

  if (error) throw error

  // 转换数据格式
  const tasks = (data || []).map((task: any) => ({
    ...task,
    topic: task.topics,
    tags: task.tags?.map((t: any) => t.tag).filter(Boolean) || []
  }))

  return tasks as (TaskWithTags & {topic: Topic})[]
}

// 获取所有正在进行的任务（未完成的任务）
export async function getOngoingTasks(userId: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select(
      `
      *,
      topics!inner(id, name, icon_url, is_archived),
      tags:task_tags(tag:tags(*))
    `
    )
    .eq('user_id', userId)
    .eq('is_completed', false)
    .eq('topics.is_archived', false)
    .order('created_at', {ascending: false})

  if (error) throw error

  // 转换数据格式
  const tasks = (data || []).map((task: any) => ({
    ...task,
    topic: task.topics,
    tags: task.tags?.map((t: any) => t.tag).filter(Boolean) || []
  }))

  return tasks as (TaskWithTags & {topic: Topic})[]
}

// ==================== Tag API ====================

export async function getTags(userId: string, topicId?: string | null) {
  let query = supabase.from('tags').select('*').eq('user_id', userId).order('created_at', {ascending: true})

  // 如果指定了 topicId，只查询该话题的标签
  if (topicId !== undefined) {
    if (topicId === null) {
      query = query.is('topic_id', null)
    } else {
      query = query.eq('topic_id', topicId)
    }
  }

  const {data, error} = await query

  if (error) throw error
  return (data || []) as Tag[]
}

export async function getRecentTags(userId: string, limit = 10) {
  // 获取最近使用的标签（通过 task_tags 关联查询）
  const {data, error} = await supabase
    .from('task_tags')
    .select('tag_id, created_at, tags(*)')
    .eq('tags.user_id', userId)
    .order('created_at', {ascending: false})
    .limit(limit * 3) // 多获取一些以便去重

  if (error) throw error

  // 去重并限制数量
  const uniqueTags: Tag[] = []
  const seenIds = new Set<string>()

  for (const item of data || []) {
    const tag = (item as any).tags
    if (tag && !seenIds.has(tag.id)) {
      seenIds.add(tag.id)
      uniqueTags.push(tag)
      if (uniqueTags.length >= limit) break
    }
  }

  return uniqueTags
}

export async function searchTags(userId: string, keyword: string, topicId?: string | null) {
  let query = supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${keyword}%`)
    .order('created_at', {ascending: false})
    .limit(10)

  // 如果指定了 topicId，只搜索该话题的标签
  if (topicId !== undefined) {
    if (topicId === null) {
      query = query.is('topic_id', null)
    } else {
      query = query.eq('topic_id', topicId)
    }
  }

  const {data, error} = await query

  if (error) throw error
  return (data || []) as Tag[]
}

// 常用 Emoji 列表（用于自动分配）
const COMMON_EMOJIS = [
  '📌',
  '⭐',
  '🔥',
  '💡',
  '📝',
  '🎯',
  '✅',
  '⚡',
  '🚀',
  '💼',
  '🏠',
  '🎨',
  '📚',
  '💰',
  '🎮',
  '🌟',
  '💪',
  '🎉',
  '📱',
  '⏰'
]

// 随机选择一个 emoji
function getRandomEmoji(): string {
  return COMMON_EMOJIS[Math.floor(Math.random() * COMMON_EMOJIS.length)]
}

export async function findOrCreateTag(
  userId: string,
  tagName: string,
  parentId: string | null = null,
  topicId?: string | null
) {
  // 先查找是否存在
  let query = supabase.from('tags').select('*').eq('user_id', userId).eq('name', tagName).is('parent_id', parentId)

  // 添加 topic_id 查询条件
  if (topicId !== undefined) {
    if (topicId === null) {
      query = query.is('topic_id', null)
    } else {
      query = query.eq('topic_id', topicId)
    }
  }

  const {data: existing} = await query.maybeSingle()

  if (existing) {
    // 如果标签存在但没有 emoji，自动分配一个
    if (!existing.emoji) {
      const emoji = getRandomEmoji()
      await supabase.from('tags').update({emoji}).eq('id', existing.id)
      return {...existing, emoji} as Tag
    }
    return existing as Tag
  }

  // 不存在则创建（使用默认颜色和随机 emoji）
  const {data, error} = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      topic_id: topicId !== undefined ? topicId : null,
      name: tagName,
      parent_id: parentId,
      emoji: getRandomEmoji()
    })
    .select()
    .maybeSingle()

  if (error) throw error
  return data as Tag
}

export async function updateTag(tagId: string, updates: Partial<Pick<Tag, 'name' | 'emoji' | 'color'>>) {
  const {data, error} = await supabase.from('tags').update(updates).eq('id', tagId).select().maybeSingle()

  if (error) throw error
  return data as Tag | null
}

export async function createTag(tag: Omit<Tag, 'id' | 'created_at'>) {
  const {data, error} = await supabase.from('tags').insert(tag).select().maybeSingle()

  if (error) throw error
  return data as Tag | null
}

export async function deleteTag(tagId: string) {
  const {error} = await supabase.from('tags').delete().eq('id', tagId)

  if (error) throw error
}

// ==================== 评论相关 API ====================

export async function getCommentsByTaskId(taskId: string) {
  // 先获取评论
  const {data: comments, error: commentsError} = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', {ascending: true})

  if (commentsError) throw commentsError
  if (!comments || comments.length === 0) return []

  // 获取所有评论者的 user_id
  const userIds = [...new Set(comments.map((c) => c.user_id))]

  // 获取用户信息
  const {data: profiles, error: profilesError} = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .in('id', userIds)

  if (profilesError) throw profilesError

  // 创建用户信息映射
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  // 组合数据
  const commentsWithUser: CommentWithUser[] = comments.map((comment) => ({
    ...comment,
    user: profileMap.get(comment.user_id)
  }))

  return commentsWithUser
}

export async function createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) {
  const {data, error} = await supabase.from('comments').insert(comment).select().maybeSingle()

  if (error) throw error
  return data as Comment | null
}

export async function updateComment(commentId: string, content: string) {
  const {data, error} = await supabase
    .from('comments')
    .update({content, updated_at: new Date().toISOString()})
    .eq('id', commentId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data as Comment | null
}

export async function deleteComment(commentId: string) {
  const {error} = await supabase.from('comments').delete().eq('id', commentId)

  if (error) throw error
}

// ==================== TaskTag API ====================

export async function addTaskTags(taskId: string, tagIds: string[]) {
  const taskTags = tagIds.map((tagId) => ({task_id: taskId, tag_id: tagId}))

  const {error} = await supabase.from('task_tags').insert(taskTags)

  if (error) throw error
}

export async function removeTaskTags(taskId: string) {
  const {error} = await supabase.from('task_tags').delete().eq('task_id', taskId)

  if (error) throw error
}

// ==================== Attachment API ====================

export async function createAttachment(attachment: Omit<Attachment, 'id' | 'created_at'>) {
  const {data, error} = await supabase.from('attachments').insert(attachment).select().maybeSingle()

  if (error) throw error
  return data as Attachment | null
}

export async function deleteAttachment(attachmentId: string) {
  const {error} = await supabase.from('attachments').delete().eq('id', attachmentId)

  if (error) throw error
}
