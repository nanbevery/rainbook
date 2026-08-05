import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)
    if (album.visibility === 'private' && album.creatorId !== currentUser.userId) {
      return apiError('无权在此相册上传图片', 403)
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
      return apiError('图片链接不合法，仅支持本站上传的图片')
    }

    const image = await prisma.albumImage.create({
      data: {
        albumId: parseInt(id),
        url,
        uploaderId: currentUser.userId,
      },
      include: {
        uploader: { select: { id: true, username: true, realName: true, avatar: true } },
      },
    })

    return apiSuccess(image, 201)
  } catch (error) {
    console.error('Upload album image error:', error)
    return apiError('上传图片失败', 500)
  }
}
