import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return apiError('无效的大事记ID')
    }

    const currentUser = await getCurrentUser()

    const event = await prisma.classEvent.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
        images: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                realName: true,
              },
            },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    realName: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    })

    if (!event) {
      return apiError('大事记不存在', 404)
    }

    const userLikes = currentUser
      ? await prisma.eventImageLike.findMany({
          where: {
            userId: currentUser.userId,
            imageId: { in: event.images.map((img) => img.id) },
          },
          select: { imageId: true },
        })
      : []

    const likedImageIds = new Set(userLikes.map((l) => l.imageId))

    const imagesWithLiked = event.images.map((img) => ({
      ...img,
      liked: likedImageIds.has(img.id),
    }))

    return apiSuccess({ ...event, images: imagesWithLiked })
  } catch (error) {
    console.error('Event detail error:', error)
    return apiError('获取大事记详情失败', 500)
  }
}

export async function DELETE(
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

    if (event.userId !== currentUser.userId) {
      return apiError('只能删除自己创建的大事记', 403)
    }

    await prisma.classEvent.delete({ where: { id: eventId } })

    return apiSuccess({ message: '大事记已删除' })
  } catch (error) {
    console.error('Event delete error:', error)
    return apiError('删除大事记失败', 500)
  }
}
