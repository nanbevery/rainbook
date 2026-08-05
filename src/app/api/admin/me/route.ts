import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const admin = await prisma.admin.findUnique({
      where: { id: currentAdmin.adminId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return apiError('管理员不存在', 404)
    }

    return apiSuccess(admin)
  } catch (error) {
    console.error('Get admin error:', error)
    return apiError('获取管理员信息失败', 500)
  }
}
