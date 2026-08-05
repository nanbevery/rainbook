import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20))
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = { status: 'active' }

    if (search) {
      where.OR = [
        { realName: { contains: search } },
        { username: { contains: search } },
        { className: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          className: true,
          avatar: true,
          signature: true,
          onlineStatus: true,
          lastActiveAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return apiSuccess({
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Users list error:', error)
    return apiError('获取用户列表失败', 500)
  }
}
