const _MAX_FILE_SIZE = 1024 * 1024 // 1MB

// S3 配置（暂时保留配置结构，但不实际使用 AWS SDK）
function getS3Config() {
  return {
    endpoint: process.env.TARO_APP_S3_ENDPOINT,
    accessKeyId: process.env.TARO_APP_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.TARO_APP_S3_SECRET_ACCESS_KEY,
    bucket: process.env.TARO_APP_S3_BUCKET,
    region: process.env.TARO_APP_S3_REGION || 'auto',
    publicUrl: process.env.TARO_APP_S3_PUBLIC_URL
  }
}

export interface UploadFileInput {
  path: string
  size: number
  name?: string
  originalFileObj?: File
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// 生成唯一文件名
function _generateFileName(originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalPath.split('.').pop() || 'jpg'
  return `${timestamp}_${random}.${ext}`
}

// 上传文件（暂时禁用，返回错误提示）
export async function uploadFile(_file: UploadFileInput): Promise<UploadResult> {
  try {
    const config = getS3Config()

    // 检查 S3 配置
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      return {
        success: false,
        error: 'S3 配置不完整。注意：当前版本暂不支持 S3 上传，建议使用图片 URL'
      }
    }

    // AWS SDK 在小程序环境中不兼容，暂时返回错误
    return {
      success: false,
      error: '小程序环境暂不支持 S3 上传，请使用图片 URL 或等待后续版本支持'
    }
  } catch (error: any) {
    console.error('上传文件失败:', error)
    return {success: false, error: error.message || '上传失败'}
  }
}

// 选择并上传图片（暂时禁用上传功能）
export async function chooseAndUploadImage(): Promise<UploadResult> {
  return {
    success: false,
    error: '小程序环境暂不支持图片上传，请使用图片 URL'
  }
}

// 获取图片公开URL（兼容已有URL和路径）
export function getImageUrl(pathOrUrl: string): string {
  // 如果已经是完整URL，直接返回
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }

  // 否则构建 S3 公开URL
  const config = getS3Config()
  if (!config.publicUrl) {
    return pathOrUrl // 如果没有配置，返回原路径
  }
  return `${config.publicUrl}/${pathOrUrl}`
}

// 导出 uploadImage 作为 chooseAndUploadImage 的简化版本（返回 URL 字符串）
export async function uploadImage(_filePath?: string): Promise<string> {
  const result = await chooseAndUploadImage()
  if (result.success && result.url) {
    return result.url
  }
  throw new Error(result.error || '上传失败')
}
