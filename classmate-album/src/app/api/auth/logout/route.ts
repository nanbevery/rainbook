import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { apiSuccess } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { onlineStatus: false, lastActiveAt: new Date() },
      })
    }

    const cookieStore = await cookies()
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return apiSuccess({ message: '已退出登录' })
  } catch (error) {
    console.error('Logout error:', error)
    return apiSuccess({ message: '已退出登录' })
  }
}
