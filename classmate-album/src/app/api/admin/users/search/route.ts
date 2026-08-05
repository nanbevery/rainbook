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

    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        OR: [
          { realName: { contains: search } },
          { username: { contains: search } },
        ],
      },
      select: {
        id: true,
        realName: true,
        username: true,
        avatar: true,
      },
      take: 20,
    })

    return apiSuccess(users)
  } catch (error) {
    console.error('User search error:', error)
    return apiError('搜索失败', 500)
  }
}
