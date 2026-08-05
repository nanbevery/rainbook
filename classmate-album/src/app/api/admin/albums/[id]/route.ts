import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiMessage, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const album = await prisma.album.findUnique({ where: { id: parseInt(id) } })
    if (!album) return apiError('相册不存在', 404)

    await prisma.album.delete({ where: { id: parseInt(id) } })

    const ip = getClientIp(_req)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'DELETE_ALBUM',
        target: `相册 ${album.title}`,
        detail: `管理员删除相册: ${album.title}`,
        ip,
      },
    })

    return apiMessage('相册已删除')
  } catch (error) {
    console.error('Admin delete album error:', error)
    return apiError('删除相册失败', 500)
  }
}
