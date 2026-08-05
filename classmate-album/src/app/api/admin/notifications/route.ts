import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { sanitizeString } from '@/lib/validators'
import { sendNotification } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const { title, content, userIds } = body

    if (!title || !title.trim()) {
      return apiError('通知标题不能为空')
    }

    if (!content || !content.trim()) {
      return apiError('通知内容不能为空')
    }

    let targetUserIds: number[] = []

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds
    } else {
      const allUsers = await prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      targetUserIds = allUsers.map((u) => u.id)
    }

    if (targetUserIds.length === 0) {
      return apiError('没有可推送的目标用户')
    }

    const notifications = await Promise.all(
      targetUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type: 'system',
            title: sanitizeString(title),
            content: sanitizeString(content),
          },
        })
      )
    )

    for (const n of notifications) {
      sendNotification(n.userId, {
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })
    }

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'SEND_NOTIFICATION',
        target: '全员通知',
        detail: `管理员推送通知: ${title}，覆盖 ${targetUserIds.length} 人`,
        ip,
      },
    })

    return apiSuccess({
      message: `通知已推送`,
      recipientCount: targetUserIds.length,
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return apiError('推送通知失败', 500)
  }
}
