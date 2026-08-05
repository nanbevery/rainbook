import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { sendNotification } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const body = await request.json()
    const { title, content, mode, userIds } = body

    if (!title || !content) return apiError('标题和内容不能为空')

    let targetUsers: { id: number }[]

    if (mode === 'all') {
      targetUsers = await prisma.user.findMany({ where: { status: 'active' }, select: { id: true } })
    } else if (userIds && userIds.length > 0) {
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, status: 'active' },
        select: { id: true },
      })
    } else {
      return apiError('请选择推送用户')
    }

    const notifications = await Promise.all(
      targetUsers.map((u) =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'system',
            title,
            content,
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

    return apiSuccess({ sentCount: notifications.length })
  } catch (error) {
    console.error('Send notification error:', error)
    return apiError('推送失败', 500)
  }
}
