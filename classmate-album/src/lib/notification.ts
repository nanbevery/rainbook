import prisma from '@/lib/prisma'
import { sendNotification } from '@/lib/socket'

interface NotificationInput {
  userId: number
  type: 'comment' | 'like' | 'audit' | 'system'
  title: string
  content: string
  relatedId?: number
}

const typeSwitchMap: Record<NotificationInput['type'], keyof {
  notifyComment: boolean
  notifyLike: boolean
  notifyAudit: boolean
  notifySystem: boolean
}> = {
  comment: 'notifyComment',
  like: 'notifyLike',
  audit: 'notifyAudit',
  system: 'notifySystem',
}

export async function createNotification(input: NotificationInput) {
  const recipient = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      status: true,
      notifyComment: true,
      notifyLike: true,
      notifyAudit: true,
      notifySystem: true,
    },
  })

  if (!recipient || recipient.status !== 'active') return null

  const switchKey = typeSwitchMap[input.type]
  if (!recipient[switchKey]) return null

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      relatedId: input.relatedId ?? null,
    },
  })

  sendNotification(input.userId, {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    createdAt: notification.createdAt.toISOString(),
  })

  return notification
}
