import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return apiError('无效的大事记ID')
    }

    const event = await prisma.classEvent.findUnique({ where: { id: eventId } })
    if (!event) {
      return apiError('大事记不存在', 404)
    }

    const body = await request.json()
    const { images } = body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return apiError('请提供要上传的图片信息')
    }

    const safeImages = images.filter(
      (img: { url?: string }) =>
        img &&
        typeof img.url === 'string' &&
        img.url.startsWith('/uploads/')
    )

    if (safeImages.length === 0) {
      return apiError('图片链接不合法，仅支持本站上传的图片')
    }

    const createdImages = await prisma.eventImage.createMany({
      data: safeImages.map((img: { url: string; thumbnailUrl?: string }) => ({
        eventId,
        userId: currentUser.userId,
        imageType: 'SUPPLEMENT',
        url: img.url,
        thumbnailUrl: img.thumbnailUrl || img.url,
      })),
    })

    const updatedImages = await prisma.eventImage.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess({ count: createdImages.count, images: updatedImages }, 201)
  } catch (error) {
    console.error('Event images upload error:', error)
    return apiError('上传图片失败', 500)
  }
}
