import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const visibility = searchParams.get('visibility') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10') || 10))
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search }
    }
    if (visibility && ['public', 'private'].includes(visibility)) {
      where.visibility = visibility
    }

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true, realName: true } },
          _count: { select: { images: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.album.count({ where }),
    ])

    return apiSuccess({
      list: albums,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Admin list albums error:', error)
    return apiError('获取相册列表失败', 500)
  }
}
