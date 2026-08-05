import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const body = await request.json()
    const { ip, duration, reason } = body

    if (!ip) return apiError('IP地址不能为空')

    let expiresAt: Date | null = null
    if (duration && duration > 0) {
      expiresAt = new Date(Date.now() + duration * 60 * 1000)
    }

    const ban = await prisma.ipBlacklist.create({
      data: {
        ip,
        reason: reason || '',
        expiresAt,
        isActive: true,
      },
    })

    const adminIp = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'BAN_IP',
        target: `IP ${ip}`,
        detail: `管理员封禁IP: ${ip}, 原因: ${reason || '无'}`,
        ip: adminIp,
      },
    })

    return apiSuccess(ban, 201)
  } catch (error) {
    console.error('Ban IP error:', error)
    return apiError('封禁失败', 500)
  }
}
