import cron from 'node-cron'
import prisma from './prisma'

let jobsStarted = false

async function getSettingValue(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } })
    return setting?.value ?? null
  } catch {
    return null
  }
}

export function startCronJobs() {
  if (jobsStarted) return
  jobsStarted = true

  cron.schedule('*/10 * * * *', async () => {
    try {
      const thresholdRaw = await getSettingValue('ipBanThreshold')
      const threshold = Math.max(1, parseInt(thresholdRaw || '10'))
      const durationRaw = await getSettingValue('ipBanDuration')
      const durationMinutes = Math.max(1, parseInt(durationRaw || '1440'))

      const logs = await prisma.securityLog.groupBy({
        by: ['ip'],
        where: {
          type: 'login_failed',
          createdAt: { gte: new Date(Date.now() - 30 * 60000) },
        },
        _count: { ip: true },
        having: { ip: { _count: { gte: threshold } } },
      })

      for (const log of logs) {
        const exists = await prisma.ipBlacklist.findFirst({
          where: { ip: log.ip, isActive: true },
        })
        if (!exists) {
          await prisma.ipBlacklist.create({
            data: {
              ip: log.ip,
              reason: `自动封禁: 30分钟内登录失败${log._count.ip}次`,
              expiresAt: new Date(Date.now() + durationMinutes * 60000),
            },
          })
          await prisma.securityLog.create({
            data: {
              type: 'ip_auto_ban',
              ip: log.ip,
              detail: `自动封禁IP，30分钟内登录失败${log._count.ip}次`,
            },
          })
        }
      }
    } catch {}
  })

  cron.schedule('0 2 * * *', async () => {
    try {
      const retentionRaw = await getSettingValue('logRetentionDays')
      const logRetentionDays = Math.max(1, parseInt(retentionRaw || '90'))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - logRetentionDays)

      await prisma.securityLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      })
    } catch {}
  })

  cron.schedule('*/90 * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - 90000)
      await prisma.user.updateMany({
        where: {
          onlineStatus: true,
          lastHeartbeatAt: { lt: threshold },
        },
        data: { onlineStatus: false },
      })
    } catch {}
  })

  cron.schedule('0 3 * * *', async () => {
    try {
      const backupEnabled = await getSettingValue('autoBackupEnabled')
      if (backupEnabled !== 'true') return

      const retentionRaw = await getSettingValue('autoBackupDays')
      const days = Math.max(1, parseInt(retentionRaw || '30'))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      await prisma.securityLog.create({
        data: {
          type: 'auto_backup',
          ip: 'system',
          detail: `每日自动备份执行，保留${days}天内备份`,
        },
      })
    } catch {}
  })
}
