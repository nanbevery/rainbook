import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

async function resolveUserId(id: string): Promise<number | null> {
  const numericId = parseInt(id)
  if (!isNaN(numericId)) return numericId
  const user = await prisma.user.findUnique({ where: { username: id }, select: { id: true } })
  return user?.id ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await resolveUserId(id)
    if (!userId) return apiError('用户不存在', 404)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20))
    const skip = (page - 1) * pageSize

    const where = { userId }

    const [events, total] = await Promise.all([
      prisma.classEvent.findMany({
        where,
        include: {
          images: {
            include: {
              user: { select: { id: true, realName: true } },
            },
          },
          user: { select: { id: true, realName: true, avatar: true } },
        },
        orderBy: { eventDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.classEvent.count({ where }),
    ])

    return apiSuccess({
      list: events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('User events error:', error)
    return apiError('获取用户大事记失败', 500)
  }
}
