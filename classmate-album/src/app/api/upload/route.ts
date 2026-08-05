import { NextRequest } from 'next/server'
import sharp from 'sharp'
import fs from 'fs/promises'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { getDatePath, generateFileName, ensureDirectories, getOriginalPath, getThumbnailPath, getOriginalUrl, getThumbnailUrl, isImageFile, imageFormatToExtension } from '@/lib/upload'
import { withRateLimit } from '@/lib/with-rate-limit'

async function handlePOST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('请选择要上传的文件')
    }

    if (!isImageFile(file.type)) {
      return apiError('仅支持上传图片文件', 400)
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return apiError('文件大小不能超过10MB')
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let imageFormat: string
    try {
      const metadata = await sharp(buffer, { failOn: 'error' }).metadata()
      imageFormat = metadata.format ?? ''
    } catch {
      return apiError('文件不是有效的图片', 400)
    }

    const extension = imageFormatToExtension(imageFormat)
    if (!extension) {
      return apiError('仅支持 JPG/PNG/WebP/GIF 格式的图片', 400)
    }

    const datePath = getDatePath()
    const fileName = generateFileName(extension)
    await ensureDirectories(datePath)

    const originalPath = getOriginalPath(datePath, fileName)
    await fs.writeFile(originalPath, buffer)

    const url = getOriginalUrl(datePath, fileName)
    let thumbnailUrl = url

    try {
      const thumbnailPath = getThumbnailPath(datePath, fileName)
      await sharp(buffer)
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)
      thumbnailUrl = getThumbnailUrl(datePath, fileName)
    } catch (sharpError) {
      console.error('Thumbnail generation error:', sharpError)
    }

    return apiSuccess({ url, thumbnailUrl, fileName: file.name, fileSize: file.size, fileType: file.type }, 201)
  } catch (error) {
    console.error('Upload error:', error)
    return apiError('文件上传失败', 500)
  }
}

export const POST = withRateLimit('upload')(handlePOST)
