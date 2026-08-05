import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    const albums = await prisma.album.findMany({
      where: currentUser
        ? { OR: [{ visibility: 'public' }, { creatorId: currentUser.userId }] }
        : { visibility: 'public' },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(albums)
  } catch (error) {
    console.error('List albums error:', error)
    return apiError('获取相册列表失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const body = await request.json()
    const { title, description, visibility, allowSave } = body

    if (!title || !title.trim()) return apiError('相册标题不能为空')

    const album = await prisma.album.create({
      data: {
        title: title.trim(),
        description: description || '',
        visibility: visibility === 'private' ? 'private' : 'public',
        allowSave: allowSave !== false,
        creatorId: currentUser.userId,
      },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
      },
    })

    return apiSuccess(album, 201)
  } catch (error) {
    console.error('Create album error:', error)
    return apiError('创建相册失败', 500)
  }
}
