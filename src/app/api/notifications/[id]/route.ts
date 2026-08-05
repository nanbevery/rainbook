import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const notificationId = parseInt(id)

    if (isNaN(notificationId)) {
      return apiError('无效的通知ID')
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return apiError('通知不存在', 404)
    }

    if (notification.userId !== currentUser.userId) {
      return apiError('无权操作', 403)
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return apiSuccess({ message: '已标记为已读' })
  } catch (error) {
    console.error('Notification mark read error:', error)
    return apiError('操作失败', 500)
  }
}
