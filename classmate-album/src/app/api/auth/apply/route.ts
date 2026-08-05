import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getClientIp } from '@/lib/api-response'
import { isValidChineseName, isValidEmail } from '@/lib/validators'
import { generateUsername } from '@/lib/username-generator'
import { generateReviewToken } from '@/lib/review-token'
import { sendEmailToAdmin } from '@/lib/smtp'
import { newApplicationEmail } from '@/lib/email-templates'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { withRateLimit } from '@/lib/with-rate-limit'

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    const { realName, password, email } = body

    if (!realName) {
      return apiError('姓名不能为空')
    }

    if (!isValidChineseName(realName)) {
      return apiError('姓名必须为 2-10 个中文字符')
    }

    if (!password || password.length < 6) {
      return apiError('密码长度至少 6 位')
    }

    if (email && !isValidEmail(email)) {
      return apiError('邮箱格式不正确')
    }

    const username = await generateUsername(realName)

    const hashedPassword = await bcrypt.hash(password, 10)

    const ip = getClientIp(request)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email: email || '',
        reviewStatus: 'pending',
        status: 'disabled',
      },
    })

    const appliedAt = format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })

    const approveUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/approve?token=${generateReviewToken(user.id, 'approve')}`
    const rejectUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/reject?token=${generateReviewToken(user.id, 'reject')}`

    const emailSent = await sendEmailToAdmin(
      `[${realName}] 申请加入同学录`,
      newApplicationEmail({
        realName,
        username,
        email: email || '',
        appliedAt,
        ipLocation: ip || '未知',
        approveUrl,
        rejectUrl,
      })
    )

    return apiSuccess({
      username,
      realName,
      email: email || '',
      emailSent: emailSent.success,
      message: email
        ? `申请已提交，管理员审核后将发送邮件通知至 ${email}`
        : '申请已提交。您未填写邮箱，请自行登录查看审核结果。',
    }, 201)
  } catch (error) {
    console.error('Apply error:', error)
    return apiError('申请提交失败，请稍后重试', 500)
  }
}

export const POST = withRateLimit('register')(handlePOST)
