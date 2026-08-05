import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20))
    const skip = (page - 1) * pageSize

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: currentUser.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId: currentUser.userId } }),
      prisma.notification.count({
        where: { userId: currentUser.userId, isRead: false },
      }),
    ])

    return apiSuccess({
      list: notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Notifications list error:', error)
    return apiError('获取通知列表失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    await prisma.notification.updateMany({
      where: { userId: currentUser.userId, isRead: false },
      data: { isRead: true },
    })

    return apiSuccess({ message: '所有通知已标记为已读' })
  } catch (error) {
    console.error('Notifications mark all read error:', error)
    return apiError('操作失败', 500)
  }
}
