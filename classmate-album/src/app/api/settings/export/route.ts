import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const userId = currentUser.userId

    const [
      profile,
      albums,
      uploadedAlbumImages,
      events,
      uploadedEventImages,
      comments,
      likes,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          realName: true,
          className: true,
          avatar: true,
          signature: true,
          birthday: true,
          address: true,
          hobbies: true,
          phone: true,
          email: true,
          wechat: true,
          weibo: true,
          douyin: true,
          bilibili: true,
          coverImage: true,
          createdAt: true,
        },
      }),
      prisma.album.findMany({
        where: { creatorId: userId },
        include: { images: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.albumImage.findMany({
        where: { uploaderId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.classEvent.findMany({
        where: { userId },
        include: { images: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventImage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventImageComment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventImageLike.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      albums,
      uploadedAlbumImages,
      events,
      uploadedEventImages,
      comments,
      likes,
      notifications,
    }

    const json = JSON.stringify(data, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="user-data-${userId}.json"`,
      },
    })
  } catch (error) {
    console.error('Export user data error:', error)
    return apiError('导出失败', 500)
  }
}
