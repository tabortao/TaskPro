// 数据库类型定义

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string | null
  email: string | null
  openid: string | null
  nickname: string | null
  avatar_url: string | null
  role: UserRole
  s3_endpoint: string | null
  s3_access_key: string | null
  s3_secret_key: string | null
  s3_bucket: string | null
  s3_region: string | null
  created_at: string
}

export interface Topic {
  id: string
  user_id: string
  name: string
  description: string | null
  icon_url: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  topic_id: string
  user_id: string
  content: string
  is_completed: boolean
  is_pinned: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface TaskTag {
  task_id: string
  tag_id: string
}

export interface Attachment {
  id: string
  task_id: string
  user_id: string
  file_url: string
  file_type: string | null
  file_name: string | null
  created_at: string
}

// 扩展类型，包含关联数据
export interface TaskWithTags extends Task {
  tags?: Tag[]
  attachments?: Attachment[]
}

export interface TagWithParent extends Tag {
  parent?: Tag | null
}
