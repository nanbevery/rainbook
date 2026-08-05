import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const [totalUsers, activeUsers, totalAlbums, totalAlbumImages, totalEvents, todayNewUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.album.count(),
      prisma.albumImage.count(),
      prisma.classEvent.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    const onlineUsers = await prisma.user.count({ where: { onlineStatus: true } })

    return apiSuccess({
      totalUsers,
      activeUsers,
      onlineUsers,
      totalAlbums,
      totalAlbumImages,
      totalEvents,
      todayNewUsers,
      date: format(new Date(), 'yyyy-MM-dd'),
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return apiError('获取统计数据失败', 500)
  }
}
