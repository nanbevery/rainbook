import { checkRateLimit } from './rate-limit'

type RateLimitType = 'login' | 'register' | 'upload' | 'general'

export function withRateLimit<T extends (...args: any[]) => Promise<Response>>(
  type: RateLimitType = 'general'
): (handler: T) => T {
  return (handler) => {
    return (async (...args: any[]) => {
      const request = args[0] as Request
      const result = await checkRateLimit(request, type)
      if (!result.allowed) {
        return new Response(
          JSON.stringify({ success: false, error: '请求过于频繁，请稍后再试' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }

      const response = await handler(...args)
      response.headers.set('X-RateLimit-Remaining', String(result.remaining))
      return response
    }) as unknown as T
  }
}
