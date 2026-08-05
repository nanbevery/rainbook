import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || '6b6e9a411348a1922b1d9c58fe62acaba2876129262afd8ecdb57a42280032b4'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || '2e6eafe442db5fd774c95fab257d75883da6ab685af13e52f6e33d8ff889874e'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '8h'

export interface UserPayload {
  userId: number
  username: string
}

export interface AdminPayload {
  adminId: number
  username: string
  role: string
}

export function signUserToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null

  const payload = verifyUserToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { status: true, reviewStatus: true },
  })
  if (!user || user.status !== 'active' || user.reviewStatus !== 'approved') return null

  return payload
}

export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}
