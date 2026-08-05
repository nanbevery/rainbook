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
    const data: Record<string, unknown> = {}

    if (body.realName !== undefined) data.realName = body.realName
    if (body.className !== undefined) data.className = body.className
    if (body.signature !== undefined) data.signature = body.signature
    if (body.birthday !== undefined) data.birthday = body.birthday
    if (body.address !== undefined) data.address = body.address
    if (body.hobbies !== undefined) data.hobbies = body.hobbies
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.coverImage !== undefined) data.coverImage = body.coverImage
    if (body.cardBackground !== undefined) data.cardBackground = body.cardBackground
    if (body.cardBgColor !== undefined) data.cardBgColor = body.cardBgColor
    if (body.cardBgImage !== undefined) data.cardBgImage = body.cardBgImage

    const socialFields = ['phone', 'email', 'wechat', 'weibo', 'douyin', 'bilibili']
    for (const field of socialFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data,
    })

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, username: true, realName: true, avatar: true, coverImage: true, status: true, reviewStatus: true },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('Update profile error:', error)
    return apiError('保存失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const formData = await request.formData()
    const data: Record<string, unknown> = {}

    const avatarFile = formData.get('avatar') as File | null
    const coverFile = formData.get('coverImage') as File | null

    if (avatarFile && avatarFile.size > 0) {
      const uploadForm = new FormData()
      uploadForm.append('file', avatarFile)
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/upload`, {
        method: 'POST',
        body: uploadForm,
        headers: { Cookie: request.headers.get('cookie') || '' },
      })
      const uploadJson = await uploadRes.json()
      if (uploadJson.success) {
        data.avatar = uploadJson.data.thumbnailUrl || uploadJson.data.url
      }
    }

    if (coverFile && coverFile.size > 0) {
      const uploadForm = new FormData()
      uploadForm.append('file', coverFile)
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/upload`, {
        method: 'POST',
        body: uploadForm,
        headers: { Cookie: request.headers.get('cookie') || '' },
      })
      const uploadJson = await uploadRes.json()
      if (uploadJson.success) {
        data.coverImage = uploadJson.data.url
      }
    }

    const textFields: string[] = ['realName', 'className', 'signature', 'birthday', 'address', 'hobbies']
    for (const field of textFields) {
      const val = formData.get(field)
      if (val && typeof val === 'string') data[field] = val
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data,
    })

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, username: true, realName: true, avatar: true, coverImage: true, status: true, reviewStatus: true },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('Upload profile error:', error)
    return apiError('保存失败', 500)
  }
}
