import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentAdmin } from '@/lib/auth'
import { getClientIp } from '@/lib/api-response'
import { sanitizeString } from '@/lib/validators'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return apiError('无效的大事记ID')
    }

    const event = await prisma.classEvent.findUnique({ where: { id: eventId } })
    if (!event) {
      return apiError('大事记不存在', 404)
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = sanitizeString(body.title)
    if (body.description !== undefined) data.description = sanitizeString(body.description)
    if (body.eventDate !== undefined) data.eventDate = new Date(body.eventDate)

    const updatedEvent = await prisma.classEvent.update({
      where: { id: eventId },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
        images: {
          include: {
            user: {
              select: {
                id: true,
                realName: true,
              },
            },
          },
        },
      },
    })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'UPDATE_EVENT',
        target: `大事记 #${eventId}`,
        detail: `管理员编辑大事记: ${event.title}`,
        ip,
      },
    })

    return apiSuccess(updatedEvent)
  } catch (error) {
    console.error('Admin update event error:', error)
    return apiError('编辑大事记失败', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return apiError('未登录', 401)
    }

    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return apiError('无效的大事记ID')
    }

    const event = await prisma.classEvent.findUnique({ where: { id: eventId } })
    if (!event) {
      return apiError('大事记不存在', 404)
    }

    await prisma.classEvent.delete({ where: { id: eventId } })

    const ip = getClientIp(request)
    await prisma.adminOperationLog.create({
      data: {
        adminId: currentAdmin.adminId,
        action: 'DELETE_EVENT',
        target: `大事记 ${event.title}`,
        detail: `管理员删除大事记: ${event.title}`,
        ip,
      },
    })

    return apiSuccess({ message: '大事记已删除' })
  } catch (error) {
    console.error('Admin delete event error:', error)
    return apiError('删除大事记失败', 500)
  }
}
