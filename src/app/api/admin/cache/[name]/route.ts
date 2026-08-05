import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { clearModuleCache } from '@/lib/redis'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    await clearModuleCache(name)

    const ip = getClientIp(_req)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'CLEAR_CACHE',
        target: `缓存 ${name}`,
        detail: `管理员清空模块缓存: ${name}`,
        ip,
      },
    })

    return apiSuccess({ message: `已清空 ${name} 缓存` })
  } catch (error) {
    console.error('Cache delete error:', error)
    return apiError('操作失败', 500)
  }
}
