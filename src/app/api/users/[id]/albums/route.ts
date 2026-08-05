import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

async function resolveUserId(id: string): Promise<number | null> {
  const numericId = parseInt(id)
  if (!isNaN(numericId)) return numericId
  const user = await prisma.user.findUnique({ where: { username: id }, select: { id: true } })
  return user?.id ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await resolveUserId(id)
    if (!userId) return apiError('用户不存在', 404)

    const currentUser = await getCurrentUser()
    const isSelf = currentUser?.userId === userId

    const albums = await prisma.album.findMany({
      where: { creatorId: userId, ...(isSelf ? {} : { visibility: 'public' }) },
      include: {
        creator: { select: { id: true, username: true, realName: true, avatar: true } },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(albums)
  } catch (error) {
    console.error('User albums error:', error)
    return apiError('获取用户相册失败', 500)
  }
}
