import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { generateUsername } from '@/lib/username-generator'

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const reviewStatus = searchParams.get('reviewStatus') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { realName: { contains: search } },
        { username: { contains: search } },
        { className: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (reviewStatus) {
      where.reviewStatus = reviewStatus
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          className: true,
          avatar: true,
          phone: true,
          email: true,
          status: true,
          reviewStatus: true,
          onlineStatus: true,
          lastActiveAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return apiSuccess({
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return apiError('获取用户列表失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const body = await request.json()
    const { realName, password, className, status } = body

    if (!realName || !password) {
      return apiError('姓名和密码为必填项')
    }

    const username = await generateUsername(realName)

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        realName,
        password: hashedPassword,
        className: className || '',
        status: status || 'active',
      },
      select: {
        id: true,
        username: true,
        realName: true,
        className: true,
        status: true,
        createdAt: true,
      },
    })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'CREATE_USER',
        target: `用户 ${username}`,
        detail: `管理员创建用户: ${username}`,
        ip,
      },
    })

    return apiSuccess(user, 201)
  } catch (error) {
    console.error('Admin create user error:', error)
    return apiError('创建用户失败', 500)
  }
}
