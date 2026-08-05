import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

const ALLOWED_SETTING_KEYS = new Set([
  'siteName',
  'siteDescription',
  'wsEnabled',
  'autoBackupEnabled',
  'autoBackupDays',
  'ipBanThreshold',
  'ipBanDuration',
  'logRetentionDays',
])

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const settings = await prisma.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return apiSuccess(settingsMap)
  } catch (error) {
    console.error('Get settings error:', error)
    return apiError('获取配置失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return apiError('无效的配置数据')
    }

    const entries = Object.entries(body).filter(([key]) => ALLOWED_SETTING_KEYS.has(key))

    if (entries.length === 0) {
      return apiError('没有可保存的配置项')
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    )

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'UPDATE_SETTINGS',
        target: '系统配置',
        detail: `管理员更新 ${entries.length} 项配置`,
        ip,
      },
    })

    return apiSuccess({ message: `已更新 ${entries.length} 项配置` })
  } catch (error) {
    console.error('Update settings error:', error)
    return apiError('更新配置失败', 500)
  }
}
