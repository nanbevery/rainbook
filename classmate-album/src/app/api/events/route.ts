import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeString } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20))
    const skip = (page - 1) * pageSize

    const [events, total] = await Promise.all([
      prisma.classEvent.findMany({
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
            include: {
              user: {
                select: {
                  id: true,
                  realName: true,
                },
              },
            },
          },
        },
        orderBy: { eventDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.classEvent.count(),
    ])

    return apiSuccess({
      list: events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Events list error:', error)
    return apiError('获取大事记列表失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const { title, description, eventDate, imageUrls } = body

    if (!title || !title.trim()) {
      return apiError('标题不能为空')
    }

    const safeImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter(
          (img: { url?: string }) =>
            img &&
            typeof img.url === 'string' &&
            img.url.startsWith('/uploads/')
        )
      : []

    const event = await prisma.classEvent.create({
      data: {
        userId: currentUser.userId,
        title: sanitizeString(title),
        description: sanitizeString(description || ''),
        eventDate: eventDate ? new Date(eventDate) : new Date(),
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
        images: true,
      },
    })

    if (safeImageUrls.length > 0) {
      await prisma.eventImage.createMany({
        data: safeImageUrls.map((img: { url: string; thumbnailUrl?: string }) => ({
          eventId: event.id,
          userId: currentUser.userId,
          imageType: 'MAIN',
          url: img.url,
          thumbnailUrl: img.thumbnailUrl || img.url,
        })),
      })

      const updatedEvent = await prisma.classEvent.findUnique({
        where: { id: event.id },
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
            include: {
              user: {
                select: {
                  id: true,
                  realName: true,
                },
              },
            },
          },
        },
      })

      return apiSuccess(updatedEvent, 201)
    }

    return apiSuccess(event, 201)
  } catch (error) {
    console.error('Event create error:', error)
    return apiError('创建大事记失败', 500)
  }
}
