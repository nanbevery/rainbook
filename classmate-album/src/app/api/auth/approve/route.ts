import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyReviewToken } from '@/lib/review-token'
import { sendEmail } from '@/lib/smtp'
import { applicationApprovedUserEmail, approvalSuccessPage, approvalConfirmPage } from '@/lib/email-templates'
import { createNotification } from '@/lib/notification'

function getToken(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get('token')
}

function invalidPage() {
  return new Response(
    approvalSuccessPage('无效链接', '审批链接无效或已过期。'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function handledPage() {
  return new Response(
    approvalSuccessPage('已处理', '该申请已被处理，无需重复操作。'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) return invalidPage()

    const payload = verifyReviewToken(token)
    if (!payload || payload.action !== 'approve') return invalidPage()

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.reviewStatus !== 'pending') return handledPage()

    const postUrl = `${request.nextUrl.pathname}?token=${encodeURIComponent(token)}`
    return new Response(
      approvalConfirmPage('approve', user.realName, postUrl),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error) {
    console.error('Approve confirm page error:', error)
    return new Response(
      approvalSuccessPage('操作失败', '系统内部错误，请稍后重试。'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) return invalidPage()

    const payload = verifyReviewToken(token)
    if (!payload || payload.action !== 'approve') return invalidPage()

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.reviewStatus !== 'pending') return handledPage()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reviewStatus: 'approved',
        status: 'active',
      },
    })

    await createNotification({
      userId: user.id,
      type: 'audit',
      title: '注册申请已通过',
      content: '您的注册申请已通过审核，现在可以登录同学录了。',
      relatedId: user.id,
    })

    if (user.email) {
      const loginUrl = `${request.nextUrl.origin}/login`
      await sendEmail(
        user.email,
        '同学录注册申请已通过',
        applicationApprovedUserEmail({
          realName: user.realName,
          username: user.username,
          password: '您在申请注册时填写的密码',
          loginUrl,
        })
      )
    }

    return new Response(
      approvalSuccessPage(
        '审核通过',
        `${user.realName} 的注册申请已通过审核，系统已发送通知邮件${user.email ? `至 ${user.email}` : ''}。`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error) {
    console.error('Approve error:', error)
    return new Response(
      approvalSuccessPage('操作失败', '系统内部错误，请稍后重试。'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
