import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'disabled'].includes(status)) {
      return apiError('无效的状态值')
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: { id: true, username: true, realName: true, status: true },
    })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: status === 'active' ? 'ENABLE_USER' : 'DISABLE_USER',
        target: `用户 ${user.username}`,
        detail: `管理员${status === 'active' ? '启用' : '禁用'}用户: ${user.username}`,
        ip,
      },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('Toggle user status error:', error)
    return apiError('操作失败', 500)
  }
}
