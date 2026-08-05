import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return apiError('无效的用户ID')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return apiError('用户不存在', 404)
    }

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // empty body is fine, will auto-generate password
    }
    let { newPassword } = body as { newPassword?: string }

    if (!newPassword) {
      newPassword = '123456'
    }

    if (newPassword.length < 6 || newPassword.length > 50) {
      return apiError('新密码长度必须为6-50位')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: true },
    })

    const ip = getClientIp(request)
    try {
      await prisma.adminOperationLog.create({
        data: {
          adminId: currentAdmin.adminId,
          action: 'RESET_PASSWORD',
          target: `用户 ${user.username}`,
          detail: `管理员重置用户 ${user.username} 的密码`,
          ip,
        },
      })
    } catch {
      // 操作日志记录失败不影响密码重置
    }

    return apiSuccess({ message: '密码已重置', newPassword })
  } catch (error) {
    console.error('Admin reset password error:', error)
    return apiError('重置密码失败', 500)
  }
}
