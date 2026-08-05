import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const data: Record<string, boolean> = {}

    for (const key of ['notifyComment', 'notifyLike', 'notifyAudit', 'notifySystem'] as const) {
      if (typeof body[key] === 'boolean') {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiError('没有可更新的设置项')
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data,
    })

    return apiSuccess({ message: '通知设置已保存' })
  } catch (error) {
    console.error('Update notification settings error:', error)
    return apiError('保存失败', 500)
  }
}
