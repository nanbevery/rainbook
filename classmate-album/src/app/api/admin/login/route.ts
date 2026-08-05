import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { signAdminToken } from '@/lib/auth'
import { withRateLimit } from '@/lib/with-rate-limit'
import { getClientIp, checkUsernameLoginLimit } from '@/lib/rate-limit'

async function recordLoginFailure(request: NextRequest, detail: string) {
  try {
    await prisma.securityLog.create({
      data: {
        type: 'login_failed',
        ip: getClientIp(request),
        detail,
      },
    })
  } catch {}
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return apiError('用户名和密码不能为空')
    }

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) {
      const limit = checkUsernameLoginLimit(username)
      if (!limit.allowed) return apiError('尝试次数过多，请稍后再试', 429)
      await recordLoginFailure(request, `管理端登录失败：用户不存在（${username}）`)
      return apiError('用户名或密码错误', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      const limit = checkUsernameLoginLimit(username)
      if (!limit.allowed) return apiError('尝试次数过多，请稍后再试', 429)
      await recordLoginFailure(request, `管理端登录失败：密码错误（用户 ${admin.username}）`)
      return apiError('用户名或密码错误', 401)
    }

    const token = signAdminToken({ adminId: admin.id, username: admin.username, role: admin.role })

    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return apiSuccess({
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return apiError('登录失败，请稍后重试', 500)
  }
}

export const POST = withRateLimit('login')(handlePOST)
