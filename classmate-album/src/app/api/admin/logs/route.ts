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

    const { searchParams } = new URL(request.url)
    const mainType = searchParams.get('category') || searchParams.get('type') || 'operation'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50))
    const skip = (page - 1) * pageSize

    if (mainType === 'admin' || mainType === 'operation') {
      const where: Record<string, unknown> = {}
      const adminId = searchParams.get('adminId')
      if (adminId) {
        where.adminId = parseInt(adminId)
      }

      const [logs, total] = await Promise.all([
        prisma.adminOperationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.adminOperationLog.count({ where }),
      ])

      return apiSuccess({
        list: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    }

    if (mainType === 'security') {
      const where: Record<string, unknown> = {}
      const logType = searchParams.get('subType') || searchParams.get('logType') || searchParams.get('type') || undefined
      if (logType) {
        where.type = logType
      }

      const [logs, total] = await Promise.all([
        prisma.securityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.securityLog.count({ where }),
      ])

      return apiSuccess({
        list: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    }

    return apiError('无效的日志类型，仅支持 admin/operation 或 security')
  } catch (error) {
    console.error('Get logs error:', error)
    return apiError('获取日志失败', 500)
  }
}
