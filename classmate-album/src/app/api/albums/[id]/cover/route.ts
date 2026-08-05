import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) return apiError('请先登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)
    if (album.creatorId !== currentUser.userId) return apiError('无权设置封面', 403)

    const body = await _req.json()
    const { imageUrl } = body

    if (!imageUrl) return apiError('封面图片URL不能为空')

    const image = await prisma.albumImage.findFirst({
      where: { albumId: parseInt(id), url: imageUrl },
    })
    if (!image) {
      await prisma.album.update({
        where: { id: parseInt(id) },
        data: { coverImage: imageUrl },
      })
    }

    const updated = await prisma.album.update({
      where: { id: parseInt(id) },
      data: { coverImage: imageUrl },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Set album cover error:', error)
    return apiError('设置封面失败', 500)
  }
}
