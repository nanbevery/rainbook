import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { clearSmtpCache } from '@/lib/smtp'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'admin_notify_email', 'admin_notify_email_verified'] },
      },
    })

    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    return apiSuccess({
      smtpHost: map.smtp_host || '',
      smtpPort: map.smtp_port || '587',
      smtpUser: map.smtp_user || '',
      smtpPass: map.smtp_pass ? '******' : '',
      smtpFrom: map.smtp_from || '',
      adminNotifyEmail: map.admin_notify_email || '',
      adminNotifyEmailVerified: map.admin_notify_email_verified === 'true',
    })
  } catch (error) {
    console.error('Get SMTP config error:', error)
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
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = body

    const upserts = [
      { key: 'smtp_host', value: smtpHost || '' },
      { key: 'smtp_port', value: String(smtpPort || '587') },
      { key: 'smtp_user', value: smtpUser || '' },
      { key: 'smtp_from', value: smtpFrom || '' },
    ]

    if (smtpPass && smtpPass !== '******') {
      upserts.push({ key: 'smtp_pass', value: smtpPass })
    }

    await prisma.$transaction(
      upserts.map(({ key, value }) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    clearSmtpCache()

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'UPDATE_SMTP',
        target: 'SMTP 配置',
        detail: '管理员更新 SMTP 邮件配置',
        ip,
      },
    })

    return apiSuccess({ message: 'SMTP 配置已保存' })
  } catch (error) {
    console.error('Update SMTP config error:', error)
    return apiError('更新配置失败', 500)
  }
}
