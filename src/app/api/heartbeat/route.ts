import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        lastHeartbeatAt: new Date(),
        onlineStatus: true,
      },
    })

    return apiSuccess({ message: '心跳已更新', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return apiError('心跳上报失败', 500)
  }
}
