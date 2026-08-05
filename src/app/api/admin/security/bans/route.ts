import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10') || 10))
    const skip = (page - 1) * pageSize

    const [bans, total] = await Promise.all([
      prisma.ipBlacklist.findMany({
        orderBy: { bannedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.ipBlacklist.count(),
    ])

    return apiSuccess({ list: bans, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error('Security bans error:', error)
    return apiError('获取封禁列表失败', 500)
  }
}
