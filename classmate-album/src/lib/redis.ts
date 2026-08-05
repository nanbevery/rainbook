let redisClient: any = null

export async function getRedisClient() {
  if (redisClient) return redisClient
  if (!process.env.REDIS_URL) return null

  try {
    const Redis = (await import('ioredis')).default
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
    })
    await redisClient.connect()
    return redisClient
  } catch {
    return null
  }
}

export async function getCache(key: string): Promise<string | null> {
  const redis = await getRedisClient()
  if (!redis) return null
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: string, ttl?: number): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return
  try {
    if (ttl) {
      await redis.setex(key, ttl, value)
    } else {
      await redis.set(key, value)
    }
  } catch {
    // Redis failure is non-critical
  }
}

export async function deleteCache(key: string): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // Redis failure is non-critical
  }
}

export async function clearModuleCache(module: string): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return
  try {
    const keys = await redis.keys(`cache:${module}:*`)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Redis failure is non-critical
  }
}

export async function clearAllCache(): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return
  try {
    const keys = await redis.keys('cache:*')
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Redis failure is non-critical
  }
}
