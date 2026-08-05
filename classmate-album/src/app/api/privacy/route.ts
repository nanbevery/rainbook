import { NextRequest } from 'next/server'
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
    const validOptions = ['public', 'private', 'friends_only', 'custom']
    const privacyFields = [
      'phonePrivacy',
      'emailPrivacy',
      'wechatPrivacy',
      'weiboPrivacy',
      'douyinPrivacy',
      'bilibiliPrivacy',
    ]

    const data: Record<string, string> = {}
    for (const field of privacyFields) {
      if (body[field] !== undefined) {
        if (!validOptions.includes(body[field])) {
          return apiError(`${field} 值无效`)
        }
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0 && body.privacyOverrides === undefined) {
      return apiError('没有要更新的字段')
    }

    if (body.privacyOverrides !== undefined) {
      data.privacyOverrides = JSON.stringify(body.privacyOverrides)
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data,
    })

    return apiSuccess({ message: '隐私设置已保存' })
  } catch (error) {
    console.error('Privacy update error:', error)
    return apiError('保存隐私设置失败', 500)
  }
}
