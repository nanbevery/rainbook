import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { createNotification } from '@/lib/notification'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { imageId } = await params
    const imageIdNum = parseInt(imageId)

    const image = await prisma.eventImage.findUnique({
      where: { id: imageIdNum },
      select: { id: true, userId: true, eventId: true },
    })

    if (!image) {
      return apiError('图片不存在', 404)
    }

    const existing = await prisma.eventImageLike.findUnique({
      where: {
        imageId_userId: {
          imageId: imageIdNum,
          userId: currentUser.userId,
        },
      },
    })

    let liked: boolean

    if (existing) {
      await prisma.eventImageLike.delete({
        where: { id: existing.id },
      })
      liked = false
    } else {
      await prisma.eventImageLike.create({
        data: {
          imageId: imageIdNum,
          userId: currentUser.userId,
        },
      })
      liked = true

      if (image.userId !== currentUser.userId) {
        const actor = await prisma.user.findUnique({
          where: { id: currentUser.userId },
          select: { realName: true },
        })
        const actorName = actor?.realName || currentUser.username
        await createNotification({
          userId: image.userId,
          type: 'like',
          title: '收到新点赞',
          content: `${actorName} 赞了你的照片`,
          relatedId: image.eventId,
        })
      }
    }

    const count = await prisma.eventImageLike.count({
      where: { imageId: imageIdNum },
    })

    return apiSuccess({ liked, count })
  } catch (error) {
    console.error('Toggle like error:', error)
    return apiError('操作失败', 500)
  }
}
