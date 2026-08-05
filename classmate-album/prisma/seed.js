const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化种子数据...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'super_admin',
    },
  })
  console.log('默认管理员创建成功 (admin / admin123)')

  const settings = [
    { key: 'site_name', value: '同学录' },
    { key: 'site_description', value: '班级同学录系统' },
    { key: 'websocket_enabled', value: 'true' },
    { key: 'backup_retention_days', value: '30' },
    { key: 'auto_backup_enabled', value: 'true' },
    { key: 'auto_ban_threshold', value: '10' },
    { key: 'auto_ban_duration_hours', value: '24' },
    { key: 'log_retention_days', value: '90' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('系统默认配置创建成功')

  const cacheConfigs = [
    { module: 'users', enabled: true, ttl: 3600 },
    { module: 'posts', enabled: true, ttl: 1800 },
    { module: 'notifications', enabled: true, ttl: 600 },
    { module: 'system_settings', enabled: true, ttl: 7200 },
    { module: 'class_events', enabled: true, ttl: 1800 },
  ]

  for (const config of cacheConfigs) {
    await prisma.cacheConfig.upsert({
      where: { module: config.module },
      update: {},
      create: config,
    })
  }
  console.log('缓存配置创建成功')

  console.log('种子数据初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
