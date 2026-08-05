import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        username: true,
        realName: true,
        className: true,
        avatar: true,
        signature: true,
        birthday: true,
        address: true,
        hobbies: true,
        phone: true,
        email: true,
        wechat: true,
        weibo: true,
        douyin: true,
        bilibili: true,
        coverImage: true,
        cardBackground: true,
        cardBgColor: true,
        cardBgImage: true,
        phonePrivacy: true,
        emailPrivacy: true,
        wechatPrivacy: true,
        weiboPrivacy: true,
        douyinPrivacy: true,
        bilibiliPrivacy: true,
        status: true,
        onlineStatus: true,
        lastActiveAt: true,
        notifyComment: true,
        notifyLike: true,
        notifyAudit: true,
        notifySystem: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return apiError('用户不存在', 404)
    }

    return apiSuccess(user)
  } catch (error) {
    console.error('Get me error:', error)
    return apiError('获取用户信息失败', 500)
  }
}
