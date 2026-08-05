import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'

const defaults = [
  { module: 'users', enabled: true, ttl: 3600 },
  { module: 'posts', enabled: true, ttl: 1800 },
  { module: 'notifications', enabled: true, ttl: 600 },
  { module: 'system_settings', enabled: true, ttl: 7200 },
  { module: 'class_events', enabled: true, ttl: 1800 },
]

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    for (const d of defaults) {
      await prisma.cacheConfig.upsert({
        where: { module: d.module },
        update: { enabled: d.enabled, ttl: d.ttl },
        create: d,
      })
    }

    const configs = await prisma.cacheConfig.findMany()
    return apiSuccess(configs)
  } catch (error) {
    console.error('Cache reset error:', error)
    return apiError('重置缓存配置失败', 500)
  }
}
