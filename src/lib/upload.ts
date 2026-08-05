import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads'

export function getDatePath(): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  return path.join(year, month, day)
}

export function generateFileName(extension: string): string {
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`
  return `${uuidv4()}${ext}`
}

const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp', 'gif'] as const

export function imageFormatToExtension(format: string): string | null {
  switch (format) {
    case 'jpeg':
      return '.jpg'
    case 'png':
      return '.png'
    case 'webp':
      return '.webp'
    case 'gif':
      return '.gif'
    default:
      return null
  }
}

export function isAllowedImageFormat(format: string): boolean {
  return (ALLOWED_IMAGE_FORMATS as readonly string[]).includes(format)
}

export async function ensureDirectories(datePath: string): Promise<void> {
  const originalsDir = path.join(UPLOAD_DIR, 'originals', datePath)
  const thumbnailsDir = path.join(UPLOAD_DIR, 'thumbnails', datePath)
  await fs.mkdir(originalsDir, { recursive: true })
  await fs.mkdir(thumbnailsDir, { recursive: true })
}

export function getOriginalPath(datePath: string, fileName: string): string {
  return path.join(UPLOAD_DIR, 'originals', datePath, fileName)
}

export function getThumbnailPath(datePath: string, fileName: string): string {
  return path.join(UPLOAD_DIR, 'thumbnails', datePath, fileName)
}

export function getOriginalUrl(datePath: string, fileName: string): string {
  return `/uploads/originals/${datePath}/${fileName}`
}

export function getThumbnailUrl(datePath: string, fileName: string): string {
  return `/uploads/thumbnails/${datePath}/${fileName}`
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function isDocumentFile(mimeType: string): boolean {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ].includes(mimeType)
}

export function isArchiveFile(mimeType: string): boolean {
  return [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ].includes(mimeType)
}
