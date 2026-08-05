import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { isValidPhone, isValidEmail, sanitizeString } from '@/lib/validators'

type PrivacyMap = Record<string, { selected?: number[]; excluded?: number[] }>

function shouldShowField(
  privacy: string,
  fieldKey: string,
  viewerId: number | null,
  ownerId: number,
  overrides: PrivacyMap
): boolean {
  if (viewerId === ownerId) return true
  if (privacy === 'public') return true
  if (privacy === 'private') return false
  if (!viewerId) return false

  const override = overrides[fieldKey]
  if (privacy === 'friends_only') {
    return (override?.selected || []).includes(viewerId)
  }
  if (privacy === 'custom') {
    return !(override?.excluded || []).includes(viewerId)
  }
  return false
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    const isNumericId = !isNaN(userId)

    const userWhere = isNumericId
      ? { id: userId }
      : { username: id }

    if (!isNumericId && !id) {
      return apiError('无效的用户标识')
    }

    const currentUser = await getCurrentUser()

    const user = await prisma.user.findUnique({
      where: userWhere,
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
        privacyOverrides: true,
        onlineStatus: true,
        lastActiveAt: true,
        status: true,
        createdAt: true,
      },
    })

    if (!user || user.status !== 'active') {
      return apiError('用户不存在', 404)
    }

    const viewerId = currentUser?.userId ?? null
    const overrides: PrivacyMap = user.privacyOverrides ? JSON.parse(user.privacyOverrides) : {}
    const fieldMap = {
      phone: user.phonePrivacy,
      email: user.emailPrivacy,
      wechat: user.wechatPrivacy,
      weibo: user.weiboPrivacy,
      douyin: user.douyinPrivacy,
      bilibili: user.bilibiliPrivacy,
    }

    for (const [field, privacy] of Object.entries(fieldMap)) {
      if (!shouldShowField(privacy, field + 'Privacy', viewerId, user.id, overrides)) {
        ;(user as any)[field] = ''
      }
    }

    delete (user as any).privacyOverrides

    return apiSuccess(user)
  } catch (error) {
    console.error('User detail error:', error)
    return apiError('获取用户详情失败', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return apiError('无效的用户ID')
    }

    if (currentUser.userId !== userId) {
      return apiError('只能修改自己的信息', 403)
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.realName !== undefined) data.realName = sanitizeString(body.realName)
    if (body.className !== undefined) data.className = sanitizeString(body.className)
    if (body.signature !== undefined) data.signature = sanitizeString(body.signature)
    if (body.birthday !== undefined) data.birthday = body.birthday
    if (body.address !== undefined) data.address = sanitizeString(body.address)
    if (body.hobbies !== undefined) data.hobbies = sanitizeString(body.hobbies)
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.coverImage !== undefined) data.coverImage = body.coverImage
    if (body.cardBackground !== undefined) data.cardBackground = body.cardBackground
    if (body.cardBgColor !== undefined) data.cardBgColor = body.cardBgColor
    if (body.cardBgImage !== undefined) data.cardBgImage = body.cardBgImage

    if (body.phone !== undefined) {
      if (body.phone && !isValidPhone(body.phone)) {
        return apiError('手机号格式不正确')
      }
      data.phone = body.phone
    }
    if (body.email !== undefined) {
      if (body.email && !isValidEmail(body.email)) {
        return apiError('邮箱格式不正确')
      }
      data.email = body.email
    }

    const privacyFields = ['phonePrivacy', 'emailPrivacy', 'wechatPrivacy', 'weiboPrivacy', 'douyinPrivacy', 'bilibiliPrivacy']
    for (const field of privacyFields) {
      if (body[field] !== undefined) {
        const validOptions = ['public', 'private', 'friends_only', 'custom']
        if (!validOptions.includes(body[field])) {
          return apiError(`${field} 值无效`)
        }
        data[field] = body[field]
      }
    }

    const socialFields = ['wechat', 'weibo', 'douyin', 'bilibili']
    for (const field of socialFields) {
      if (body[field] !== undefined) {
        data[field] = sanitizeString(body[field])
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
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
        onlineStatus: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('User update error:', error)
    return apiError('更新用户信息失败', 500)
  }
}
