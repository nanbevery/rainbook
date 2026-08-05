import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    await prisma.ipBlacklist.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    const ip = getClientIp(_req)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'UNBAN_IP',
        target: `封禁记录 ${id}`,
        detail: `管理员解封IP封禁记录: ${id}`,
        ip,
      },
    })

    return apiSuccess(null)
  } catch (error) {
    console.error('Unban error:', error)
    return apiError('解封失败', 500)
  }
}
