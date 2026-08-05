import crypto from 'crypto'

const SECRET_KEY = process.env.REVIEW_TOKEN_SECRET || '1517db7ec6815273c2dc0956dcea9fec499afc0e3bddb2f9d3582b32cdfd90dc'

interface ReviewTokenPayload {
  userId: number
  action: 'approve' | 'reject'
  exp: number
}

function base64urlEncode(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8')
}

export function generateReviewToken(userId: number, action: 'approve' | 'reject'): string {
  const payload: ReviewTokenPayload = {
    userId,
    action,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const payloadStr = base64urlEncode(JSON.stringify(payload))
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(payloadStr)
  const signature = base64urlEncode(hmac.digest('base64'))
  return `${payloadStr}.${signature}`
}

export function verifyReviewToken(token: string): ReviewTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadStr, signature] = parts
    const hmac = crypto.createHmac('sha256', SECRET_KEY)
    hmac.update(payloadStr)
    const expectedSig = base64urlEncode(hmac.digest('base64'))

    if (signature !== expectedSig) return null

    const payload: ReviewTokenPayload = JSON.parse(base64urlDecode(payloadStr))

    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}

export function generateEmailVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function setVerificationCode(email: string, code: string): Promise<void> {
  const { default: prisma } = await import('@/lib/prisma')
  const expiresAt = Date.now() + 10 * 60 * 1000
  const key = `email_verify:${email}`
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify({ code, email, expiresAt }) },
    create: { key, value: JSON.stringify({ code, email, expiresAt }) },
  })
}

export async function verifyAndConsumeCode(email: string, code: string): Promise<boolean> {
  const { default: prisma } = await import('@/lib/prisma')
  const key = `email_verify:${email}`
  const setting = await prisma.systemSetting.findUnique({ where: { key } })
  if (!setting?.value) return false

  try {
    const data = JSON.parse(setting.value) as { code: string; email: string; expiresAt: number }
    if (data.email !== email || data.code !== code) return false
    if (Date.now() > data.expiresAt) return false

    await prisma.systemSetting.delete({ where: { key } })
    return true
  } catch {
    return false
  }
}
