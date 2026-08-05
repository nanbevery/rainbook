import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string; commentId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return apiError('未登录', 401)
    }

    const { commentId } = await params
    const commentIdNum = parseInt(commentId)

    const comment = await prisma.eventImageComment.findUnique({
      where: { id: commentIdNum },
    })

    if (!comment) {
      return apiError('评论不存在', 404)
    }

    if (comment.userId !== currentUser.userId) {
      return apiError('只能删除自己的评论', 403)
    }

    await prisma.eventImageComment.delete({
      where: { id: commentIdNum },
    })

    return apiSuccess({ message: '评论已删除' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return apiError('删除评论失败', 500)
  }
}
