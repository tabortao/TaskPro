import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

const BUCKET_NAME = 'app-8y2p9eqmj5dt_taskpro_images'
const MAX_FILE_SIZE = 1024 * 1024 // 1MB

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

// 上传文件到 Supabase Storage
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

    // 上传到 Supabase
    const fileContent = file.originalFileObj || ({tempFilePath: filePath} as any)

    const {data, error} = await supabase.storage.from(BUCKET_NAME).upload(fileName, fileContent, {
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      console.error('上传失败:', error)
      return {success: false, error: error.message}
    }

    // 获取公开URL
    const {data: urlData} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

    return {success: true, url: urlData.publicUrl}
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

  // 否则从 Supabase Storage 获取公开URL
  const {data} = supabase.storage.from(BUCKET_NAME).getPublicUrl(pathOrUrl)

  return data.publicUrl
}
