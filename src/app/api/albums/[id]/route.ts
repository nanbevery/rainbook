import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError, apiMessage } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const album = await prisma.album.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
        images: {
          include: { uploader: { select: { id: true, username: true, realName: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!album) return apiError('相册不存在', 404)

    if (album.visibility === 'private' && (!currentUser || album.creatorId !== currentUser.userId)) {
      return apiError('无权访问此相册', 403)
    }

    return apiSuccess(album)
  } catch (error) {
    console.error('Get album error:', error)
    return apiError('获取相册详情失败', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)
    if (album.creatorId !== currentUser.userId) return apiError('无权编辑此相册', 403)

    const body = await request.json()
    const { title, description, visibility, allowSave } = body

    const updated = await prisma.album.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(visibility !== undefined && { visibility: visibility === 'private' ? 'private' : 'public' }),
        ...(allowSave !== undefined && { allowSave }),
      },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Update album error:', error)
    return apiError('更新相册失败', 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)
    if (album.creatorId !== currentUser.userId) return apiError('无权删除此相册', 403)

    await prisma.album.delete({ where: { id: parseInt(id) } })
    return apiMessage('相册已删除')
  } catch (error) {
    console.error('Delete album error:', error)
    return apiError('删除相册失败', 500)
  }
}
