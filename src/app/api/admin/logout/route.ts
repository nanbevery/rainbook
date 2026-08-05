import { cookies } from 'next/headers'
import { apiSuccess } from '@/lib/api-response'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return apiSuccess({ message: '已退出登录' })
  } catch (error) {
    console.error('Admin logout error:', error)
    return apiSuccess({ message: '已退出登录' })
  }
}
