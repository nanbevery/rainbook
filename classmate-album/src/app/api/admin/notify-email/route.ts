import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError, apiMessage } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { generateEmailVerificationCode, setVerificationCode, verifyAndConsumeCode } from '@/lib/review-token'
import { sendEmail } from '@/lib/smtp'
import { emailVerificationCodeEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const { action, email, code, newEmail, adminPassword } = body

    const currentEmailSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_notify_email' } })
    const currentEmail = currentEmailSetting?.value || ''

    if (action === 'bind') {
      if (!email || !adminPassword) {
        return apiError('邮箱和管理员密码不能为空')
      }

      const admin = await prisma.admin.findUnique({ where: { id: currentAdmin.adminId } })
      if (!admin) {
        return apiError('管理员不存在', 404)
      }

      const valid = await bcrypt.compare(adminPassword, admin.password)
      if (!valid) {
        return apiError('管理员密码错误')
      }

      const verifyCode = generateEmailVerificationCode()
      await setVerificationCode(email, verifyCode)

      const result = await sendEmail(email, '同学录 - 邮箱验证', emailVerificationCodeEmail({ code: verifyCode, purpose: '绑定' }))
      if (!result.success) {
        return apiError(`验证码发送失败: ${result.error}`)
      }

      return apiMessage('验证码已发送，请查收邮件', { targetEmail: email })
    }

    if (action === 'verify-bind') {
      if (!email || !code) {
        return apiError('邮箱和验证码不能为空')
      }

      const verified = await verifyAndConsumeCode(email, code)
      if (!verified) {
        return apiError('验证码无效或已过期')
      }

      await prisma.systemSetting.upsert({
        where: { key: 'admin_notify_email' },
        update: { value: email },
        create: { key: 'admin_notify_email', value: email },
      })
      await prisma.systemSetting.upsert({
        where: { key: 'admin_notify_email_verified' },
        update: { value: 'true' },
        create: { key: 'admin_notify_email_verified', value: 'true' },
      })

      const ip = getClientIp(request)
      await prisma.adminOperationLog.create({
        data: {
          adminId: currentAdmin.adminId,
          action: 'BIND_NOTIFY_EMAIL',
          target: '通知邮箱',
          detail: `管理员绑定通知邮箱: ${email}`,
          ip,
        },
      })

      return apiSuccess({ message: '通知邮箱绑定成功', email })
    }

    if (action === 'send-change-code') {
      if (!newEmail) {
        return apiError('新邮箱不能为空')
      }

      if (!currentEmail) {
        return apiError('请先绑定邮箱')
      }

      const verifyCode = generateEmailVerificationCode()
      await setVerificationCode(newEmail, verifyCode)

      const newResult = await sendEmail(newEmail, '同学录 - 邮箱验证', emailVerificationCodeEmail({ code: verifyCode, purpose: '变更' }))
      if (!newResult.success) {
        return apiError(`新邮箱验证码发送失败: ${newResult.error}`)
      }

      const oldCode = generateEmailVerificationCode()
      await setVerificationCode(currentEmail, oldCode)

      const oldResult = await sendEmail(currentEmail, '同学录 - 邮箱验证', emailVerificationCodeEmail({ code: oldCode, purpose: '确认旧邮箱' }))
      if (!oldResult.success) {
        return apiError(`旧邮箱验证码发送失败: ${oldResult.error}`)
      }

      return apiMessage('验证码已发送至新旧邮箱，请分别查收', { oldEmail: currentEmail, newEmail })
    }

    if (action === 'verify-change') {
      const { oldCode } = body
      if (!newEmail || !code || !oldCode) {
        return apiError('新邮箱和旧邮箱的验证码不能为空')
      }

      if (!currentEmail) {
        return apiError('请先绑定邮箱')
      }

      const newVerified = await verifyAndConsumeCode(newEmail, code)
      if (!newVerified) {
        return apiError('新邮箱验证码无效或已过期')
      }

      const oldVerified = await verifyAndConsumeCode(currentEmail, oldCode)
      if (!oldVerified) {
        return apiError('旧邮箱验证码无效或已过期')
      }

      await prisma.systemSetting.upsert({
        where: { key: 'admin_notify_email' },
        update: { value: newEmail },
        create: { key: 'admin_notify_email', value: newEmail },
      })

      const ip = getClientIp(request)
      await prisma.adminOperationLog.create({
        data: {
          adminId: currentAdmin.adminId,
          action: 'CHANGE_NOTIFY_EMAIL',
          target: '通知邮箱',
          detail: `管理员变更通知邮箱: ${currentEmail} -> ${newEmail}`,
          ip,
        },
      })

      return apiSuccess({ message: '通知邮箱已变更', email: newEmail })
    }

    return apiError('无效的操作')
  } catch (error) {
    console.error('Notify email error:', error)
    return apiError('操作失败', 500)
  }
}
