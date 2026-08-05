import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { imageId } = await params
    const imageIdNum = parseInt(imageId)

    const image = await prisma.eventImage.findUnique({
      where: { id: imageIdNum },
    })

    if (!image) {
      return apiError('图片不存在', 404)
    }

    if (image.userId !== currentUser.userId) {
      return apiError('只能删除自己上传的图片', 403)
    }

    await prisma.eventImage.delete({
      where: { id: imageIdNum },
    })

    return apiSuccess({ message: '已删除' })
  } catch (error) {
    console.error('Delete event image error:', error)
    return apiError('删除图片失败', 500)
  }
}
