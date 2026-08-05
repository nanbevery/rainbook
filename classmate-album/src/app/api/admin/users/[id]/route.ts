import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function PUT(
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

    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'disabled'].includes(status)) {
      return apiError('状态值无效，仅支持 active 或 disabled')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        username: true,
        realName: true,
        status: true,
        updatedAt: true,
      },
    })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: status === 'disabled' ? 'DISABLE_USER' : 'ENABLE_USER',
        target: `用户 ${user.username}`,
        detail: `管理员将用户 ${user.username} 状态设为 ${status}`,
        ip,
      },
    })

    return apiSuccess(updatedUser)
  } catch (error) {
    console.error('Admin update user error:', error)
    return apiError('更新用户失败', 500)
  }
}

export async function DELETE(
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

    const body = await request.json().catch(() => ({}))
    const { adminPassword } = body

    if (!adminPassword) {
      return apiError('请输入管理员密码以确认删除')
    }

    const admin = await prisma.admin.findUnique({ where: { id: currentAdmin.adminId } })
    if (!admin) {
      return apiError('管理员不存在', 401)
    }

    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password)
    if (!isPasswordValid) {
      await prisma.adminOperationLog.create({
        data: {
          adminId: currentAdmin.adminId,
          action: 'DELETE_USER',
          target: `用户 ID:${userId}`,
          detail: '删除用户失败：管理员密码校验未通过',
          ip: getClientIp(request),
        },
      })
      return apiError('管理员密码错误', 401)
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return apiError('用户不存在', 404)
    }

    await prisma.user.delete({ where: { id: userId } })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'DELETE_USER',
        target: `用户 ${user.username}`,
        detail: `管理员删除用户: ${user.username}`,
        ip,
      },
    })

    return apiSuccess({ message: '用户已删除' })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return apiError('删除用户失败', 500)
  }
}
