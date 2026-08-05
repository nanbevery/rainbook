import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { clearAllCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    await clearAllCache()
    return apiSuccess(null)
  } catch (error) {
    console.error('Cache clear-all error:', error)
    return apiError('清空缓存失败', 500)
  }
}
