import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { sendEmail } from '@/lib/smtp'
import { applicationApprovedUserEmail, applicationRejectedUserEmail } from '@/lib/email-templates'
import { createNotification } from '@/lib/notification'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) return apiError('未登录', 401)

    const body = await request.json()
    const { reviewStatus } = body

    if (!reviewStatus || !['approved', 'pending', 'rejected'].includes(reviewStatus)) {
      return apiError('无效的审核状态')
    }

    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!existingUser) return apiError('用户不存在', 404)

    const updateData: Record<string, unknown> = { reviewStatus }

    if (reviewStatus === 'approved') {
      updateData.status = 'active'

      if (existingUser.email) {
        await sendEmail(
          existingUser.email,
          '同学录注册申请已通过',
          applicationApprovedUserEmail({
            realName: existingUser.realName,
            username: existingUser.username,
            password: '您在申请注册时填写的密码',
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/login`,
          })
        )
      }

      await createNotification({
        userId: existingUser.id,
        type: 'audit',
        title: '注册申请已通过',
        content: `恭喜，您的注册申请已通过审核，现在可以使用注册时填写的姓名和密码登录同学录。`,
      })
    } else if (reviewStatus === 'rejected') {
      updateData.status = 'disabled'
      if (existingUser.email) {
        await sendEmail(
          existingUser.email,
          '同学录注册申请未通过',
          applicationRejectedUserEmail({ realName: existingUser.realName })
        )
      }

      await createNotification({
        userId: existingUser.id,
        type: 'audit',
        title: '注册申请未通过',
        content: `很遗憾，您的注册申请未通过审核。如有疑问请联系班级管理员。`,
      })
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, username: true, realName: true, reviewStatus: true, status: true },
    })

    const ip = getClientIp(request)
    const statusLabels: Record<string, string> = { approved: '通过', pending: '待审核', rejected: '拒绝' }
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'REVIEW_USER',
        target: `用户 ${user.username}`,
        detail: `管理员${statusLabels[reviewStatus]}用户审核: ${user.username}`,
        ip,
      },
    })

    return apiSuccess(user)
  } catch (error) {
    console.error('Update review status error:', error)
    return apiError('操作失败', 500)
  }
}
