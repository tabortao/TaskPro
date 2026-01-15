import type {Tag} from '@/db/types'

// 解析任务内容中的标签
// 支持格式：#标签 或 #父标签/子标签
export function parseTagsFromContent(content: string): string[] {
  const tagRegex = /#([^\s#]+)/g
  const matches = content.match(tagRegex)

  if (!matches) return []

  return matches.map((tag) => tag.substring(1)) // 移除 # 符号
}

// 从标签字符串中提取父标签和子标签
// 例如：'工作/紧急' => { parent: '工作', child: '紧急' }
export function parseTagHierarchy(tagStr: string): {parent: string | null; child: string} {
  const parts = tagStr.split('/')

  if (parts.length === 1) {
    return {parent: null, child: parts[0]}
  }

  return {parent: parts[0], child: parts[1]}
}

// 构建标签的完整路径
export function getTagFullPath(tag: Tag, allTags: Tag[]): string {
  if (!tag.parent_id) return tag.name

  const parent = allTags.find((t) => t.id === tag.parent_id)
  if (!parent) return tag.name

  return `${parent.name}/${tag.name}`
}

// 高亮任务内容中的标签
export function highlightTags(content: string): {text: string; isTag: boolean}[] {
  const parts: {text: string; isTag: boolean}[] = []
  const tagRegex = /#([^\s#]+)/g

  let lastIndex = 0
  const matches = content.matchAll(tagRegex)

  for (const match of matches) {
    // 添加标签前的文本
    if (match.index !== undefined && match.index > lastIndex) {
      parts.push({text: content.substring(lastIndex, match.index), isTag: false})
    }

    // 添加标签
    parts.push({text: match[0], isTag: true})

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length
    }
  }

  // 添加剩余文本
  if (lastIndex < content.length) {
    parts.push({text: content.substring(lastIndex), isTag: false})
  }

  return parts
}
