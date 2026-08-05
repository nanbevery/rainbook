import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

let cachedConfig: SmtpConfig | null = null
let cachedAt = 0

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const now = Date.now()
  if (cachedConfig && now - cachedAt < 60000) return cachedConfig

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] },
    },
  })

  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  if (!map.smtp_host || !map.smtp_port || !map.smtp_user || !map.smtp_pass) {
    return null
  }

  cachedConfig = {
    host: map.smtp_host,
    port: Number(map.smtp_port) || 587,
    user: map.smtp_user,
    pass: map.smtp_pass,
    from: map.smtp_from || map.smtp_user,
  }
  cachedAt = now
  return cachedConfig
}

export function clearSmtpCache() {
  cachedConfig = null
  cachedAt = 0
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const config = await getSmtpConfig()
  if (!config) {
    return { success: false, error: 'SMTP 未配置' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    await transporter.sendMail({
      from: `"同学录" <${config.from}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Send email error:', error)
    return { success: false, error: error.message || '邮件发送失败' }
  }
}

export async function sendEmailToAdmin(subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'admin_notify_email' } })
  if (!setting?.value) {
    return { success: false, error: '管理员通知邮箱未设置' }
  }
  return sendEmail(setting.value, subject, html)
}
