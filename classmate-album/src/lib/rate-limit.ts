import prisma from '@/lib/prisma'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const limits: Record<string, RateLimitConfig> = {
  'login': { maxRequests: 5, windowMs: 60000 },
  'register': { maxRequests: 3, windowMs: 3600000 },
  'upload': { maxRequests: 10, windowMs: 60000 },
  'general': { maxRequests: 100, windowMs: 60000 },
}

const rateStore = new Map<string, { count: number; resetAt: number }>()

const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateStore.entries()) {
    if (now >= entry.resetAt) rateStore.delete(key)
  }
  for (const [key, entry] of usernameLoginStore.entries()) {
    if (now >= entry.resetAt) usernameLoginStore.delete(key)
  }
}, 60000)

if (typeof process !== 'undefined') {
  process.on('exit', () => clearInterval(cleanupInterval))
}

function getClientIp(request: Request): string {
  const clientIp = request.headers.get('x-client-ip')
  if (clientIp) return clientIp
  return '127.0.0.1'
}

const usernameLoginStore = new Map<string, { count: number; resetAt: number }>()
const USERNAME_LOGIN_LIMIT = 10
const USERNAME_LOGIN_WINDOW_MS = 10 * 60 * 1000

export function checkUsernameLoginLimit(username: string): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `login:${username}`
  const now = Date.now()

  let entry = usernameLoginStore.get(key)
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + USERNAME_LOGIN_WINDOW_MS }
    usernameLoginStore.set(key, entry)
  }

  entry.count++
  return {
    allowed: entry.count <= USERNAME_LOGIN_LIMIT,
    remaining: Math.max(0, USERNAME_LOGIN_LIMIT - entry.count),
    resetAt: entry.resetAt,
  }
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const now = new Date()
  const block = await prisma.ipBlacklist.findFirst({
    where: {
      ip,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
  })
  return !!block
}

export async function checkRateLimit(
  request: Request,
  type: keyof typeof limits = 'general'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = getClientIp(request)

  const blocked = await isIpBlocked(ip)
  if (blocked) return { allowed: false, remaining: 0, resetAt: Infinity }

  const config = limits[type]
  const key = `${type}:${ip}`
  const now = Date.now()

  let entry = rateStore.get(key)
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    rateStore.set(key, entry)
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)

  if (entry.count > config.maxRequests) {
    await prisma.securityLog.create({
      data: { type: `rate_limit_${type}`, ip, detail: `超过接口限流: ${type}` },
    })
  }

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  }
}

export type { RateLimitConfig }
export { getClientIp }
