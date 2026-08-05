import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiMessage, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)

    const image = await prisma.albumImage.findUnique({ where: { id: parseInt(imageId) } })
    if (!image || image.albumId !== parseInt(id)) return apiError('图片不存在', 404)

    if (image.uploaderId !== currentUser.userId && album.creatorId !== currentUser.userId) {
      return apiError('无权删除此图片', 403)
    }

    await prisma.albumImage.delete({ where: { id: parseInt(imageId) } })
    return apiMessage('图片已删除')
  } catch (error) {
    console.error('Delete album image error:', error)
    return apiError('删除图片失败', 500)
  }
}
