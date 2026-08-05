import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const configs = await prisma.cacheConfig.findMany()
    return apiSuccess(configs)
  } catch (error) {
    console.error('Get cache config error:', error)
    return apiError('获取缓存配置失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const items = Array.isArray(body) ? body : [body]

    for (const item of items) {
      const moduleName = item.module || item.name
      const ttl = item.ttl || 3600
      const enabled = item.enabled !== undefined ? item.enabled : true
      await prisma.cacheConfig.upsert({
        where: { module: moduleName },
        update: { enabled, ttl },
        create: { module: moduleName, enabled, ttl },
      })
    }

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'UPDATE_CACHE_CONFIG',
        target: '缓存配置',
        detail: `管理员更新 ${items.length} 项缓存配置`,
        ip,
      },
    })

    return apiSuccess({ message: `已更新 ${items.length} 项缓存配置` })
  } catch (error) {
    console.error('Update cache config error:', error)
    return apiError('更新缓存配置失败', 500)
  }
}
