import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { clearAllCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    await clearAllCache()

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'CLEAR_CACHE',
        target: '全部缓存',
        detail: '管理员清空全部缓存',
        ip,
      },
    })

    return apiSuccess({ message: '缓存已清空' })
  } catch (error) {
    console.error('Clear cache error:', error)
    return apiError('清空缓存失败', 500)
  }
}
