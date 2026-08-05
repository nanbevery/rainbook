import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { signUserToken } from '@/lib/auth'
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
      return apiError('用户名/姓名和密码不能为空')
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { realName: username }],
      },
    })
    if (!user) {
      const limit = checkUsernameLoginLimit(username)
      if (!limit.allowed) return apiError('尝试次数过多，请稍后再试', 429)
      await recordLoginFailure(request, `登录失败：用户不存在（${username}）`)
      return apiError('用户名或密码错误', 401)
    }

    if (user.reviewStatus === 'pending') {
      return apiError('账号审核中，请等待管理员审核通过后再登录', 403)
    }

    if (user.reviewStatus === 'rejected') {
      return apiError('注册申请未通过，请联系管理员', 403)
    }

    if (user.status === 'disabled') {
      return apiError('账号已被禁用，请联系管理员', 403)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      const limit = checkUsernameLoginLimit(username)
      if (!limit.allowed) return apiError('尝试次数过多，请稍后再试', 429)
      await recordLoginFailure(request, `登录失败：密码错误（用户 ${user.username}）`)
      return apiError('用户名或密码错误', 401)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date(), onlineStatus: true },
    })

    const token = signUserToken({ userId: user.id, username: user.username })

    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return apiSuccess({
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        status: user.status,
        reviewStatus: user.reviewStatus,
      },
      needChangePassword: user.mustChangePassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return apiError('登录失败，请稍后重试', 500)
  }
}

export const POST = withRateLimit('login')(handlePOST)
