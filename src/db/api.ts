import {supabase} from '@/client/supabase'
import type {Attachment, Profile, Tag, Task, TaskWithTags, Topic} from './types'

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

// ==================== Tag API ====================

export async function getTags(userId: string) {
  const {data, error} = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: true})

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

export async function searchTags(userId: string, keyword: string) {
  const {data, error} = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${keyword}%`)
    .order('created_at', {ascending: false})
    .limit(10)

  if (error) throw error
  return (data || []) as Tag[]
}

export async function findOrCreateTag(userId: string, tagName: string, parentId: string | null = null) {
  // 先查找是否存在
  const {data: existing} = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .eq('name', tagName)
    .is('parent_id', parentId)
    .maybeSingle()

  if (existing) return existing as Tag

  // 不存在则创建（使用默认颜色）
  const {data, error} = await supabase
    .from('tags')
    .insert({user_id: userId, name: tagName, parent_id: parentId})
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
