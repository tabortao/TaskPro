import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import Taro from '@tarojs/taro'

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

// S3 配置
const S3_CONFIG = {
  endpoint: (import.meta as any).env.TARO_APP_S3_ENDPOINT,
  accessKeyId: (import.meta as any).env.TARO_APP_S3_ACCESS_KEY_ID,
  secretAccessKey: (import.meta as any).env.TARO_APP_S3_SECRET_ACCESS_KEY,
  bucket: (import.meta as any).env.TARO_APP_S3_BUCKET,
  region: (import.meta as any).env.TARO_APP_S3_REGION || 'auto',
  publicUrl: (import.meta as any).env.TARO_APP_S3_PUBLIC_URL
}

// 创建 S3 客户端
const s3Client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey
  }
})

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
function generateFileName(originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalPath.split('.').pop() || 'jpg'
  return `${timestamp}_${random}.${ext}`
}

// 压缩图片
async function compressImage(filePath: string, quality = 0.8): Promise<string> {
  try {
    const result = await Taro.compressImage({
      src: filePath,
      quality: quality * 100
    })
    return result.tempFilePath
  } catch (error) {
    console.error('图片压缩失败:', error)
    return filePath
  }
}

// 读取文件内容
async function readFileContent(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fs = Taro.getFileSystemManager()
    fs.readFile({
      filePath,
      success: (res) => {
        resolve(res.data as ArrayBuffer)
      },
      fail: reject
    })
  })
}

// 上传文件到 S3
export async function uploadFile(file: UploadFileInput): Promise<UploadResult> {
  try {
    // 检查文件大小
    let filePath = file.path
    let fileSize = file.size

    if (fileSize > MAX_FILE_SIZE) {
      // 尝试压缩
      Taro.showLoading({title: '压缩中...'})
      filePath = await compressImage(file.path, 0.8)

      // 重新检查大小
      const fileInfo = await Taro.getFileInfo({filePath})
      if ('size' in fileInfo) {
        fileSize = fileInfo.size
      }

      if (fileSize > MAX_FILE_SIZE) {
        // 再次压缩
        filePath = await compressImage(filePath, 0.6)
        const fileInfo2 = await Taro.getFileInfo({filePath})
        if ('size' in fileInfo2) {
          fileSize = fileInfo2.size
        }

        if (fileSize > MAX_FILE_SIZE) {
          Taro.hideLoading()
          return {success: false, error: '图片过大，压缩后仍超过1MB'}
        }
      }

      Taro.hideLoading()
    }

    // 生成文件名
    const fileName = file.name || generateFileName(file.path)

    // 验证文件名（只允许英文字母和数字）
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      return {success: false, error: '文件名只能包含英文字母和数字'}
    }

    // 读取文件内容
    let fileContent: ArrayBuffer | File

    if (file.originalFileObj) {
      // H5 环境，直接使用 File 对象
      fileContent = file.originalFileObj
    } else {
      // 小程序环境，读取文件内容
      fileContent = await readFileContent(filePath)
    }

    // 上传到 S3
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileName,
      Body: fileContent as any,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000'
    })

    await s3Client.send(command)

    // 构建公开URL
    const publicUrl = `${S3_CONFIG.publicUrl}/${fileName}`

    return {success: true, url: publicUrl}
  } catch (error: any) {
    console.error('上传文件失败:', error)
    return {success: false, error: error.message || '上传失败'}
  }
}

// 选择并上传图片
export async function chooseAndUploadImage(): Promise<UploadResult> {
  try {
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    if (res.tempFiles.length === 0) {
      return {success: false, error: '未选择图片'}
    }

    const file = res.tempFiles[0]
    const uploadFileInput: UploadFileInput = {
      path: file.path,
      size: file.size || 0,
      name: `image_${Date.now()}.jpg`,
      originalFileObj: (file as any).originalFileObj
    }

    Taro.showLoading({title: '上传中...'})
    const result = await uploadFile(uploadFileInput)
    Taro.hideLoading()

    if (result.success) {
      Taro.showToast({title: '上传成功', icon: 'success'})
    } else {
      Taro.showToast({title: result.error || '上传失败', icon: 'none'})
    }

    return result
  } catch (error: any) {
    Taro.hideLoading()
    console.error('选择图片失败:', error)
    return {success: false, error: error.message || '选择图片失败'}
  }
}

// 获取图片公开URL（兼容已有URL和路径）
export function getImageUrl(pathOrUrl: string): string {
  // 如果已经是完整URL，直接返回
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }

  // 否则构建 S3 公开URL
  return `${S3_CONFIG.publicUrl}/${pathOrUrl}`
}

// 导出 uploadImage 作为 chooseAndUploadImage 的简化版本（返回 URL 字符串）
export async function uploadImage(filePath?: string): Promise<string> {
  if (filePath) {
    // 如果提供了文件路径，直接上传
    const uploadFileInput: UploadFileInput = {
      path: filePath,
      size: 0,
      name: `image_${Date.now()}.jpg`
    }
    const result = await uploadFile(uploadFileInput)
    if (result.success && result.url) {
      return result.url
    }
    throw new Error(result.error || '上传失败')
  } else {
    // 否则选择并上传
    const result = await chooseAndUploadImage()
    if (result.success && result.url) {
      return result.url
    }
    throw new Error(result.error || '上传失败')
  }
}
