import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { createNotification } from '@/lib/notification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params
    const imageIdNum = parseInt(imageId)

    const comments = await prisma.eventImageComment.findMany({
      where: { imageId: imageIdNum },
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
    })

    return apiSuccess(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    return apiError('获取评论失败', 500)
  }
}

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

    const body = await request.json()
    const content = (body.content || '').trim()

    if (!content || content.length > 500) {
      return apiError(content.length > 500 ? '评论内容过长' : '评论内容不能为空')
    }

    const comment = await prisma.eventImageComment.create({
      data: {
        imageId: imageIdNum,
        userId: currentUser.userId,
        content,
      },
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
    })

    if (image.userId !== currentUser.userId) {
      const actor = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { realName: true },
      })
      const actorName = actor?.realName || currentUser.username
      await createNotification({
        userId: image.userId,
        type: 'comment',
        title: '收到新评论',
        content: `${actorName} 评论了你的照片：${content}`,
        relatedId: image.eventId,
      })
    }

    return apiSuccess(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return apiError('发表评论失败', 500)
  }
}
