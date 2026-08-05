import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    if (!newPassword) {
      return apiError('请填写新密码')
    }

    if (newPassword.length < 6) {
      return apiError('新密码至少6位')
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } })
    if (!user) {
      return apiError('用户不存在', 404)
    }

    if (user.mustChangePassword) {
      // 强制修改密码：不需要验证旧密码
    } else {
      if (!oldPassword) {
        return apiError('请填写旧密码')
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
      if (!isPasswordValid) {
        return apiError('旧密码错误')
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    })

    return apiSuccess({ message: '密码修改成功' })
  } catch (error) {
    console.error('Change password error:', error)
    return apiError('修改密码失败', 500)
  }
}
