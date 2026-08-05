import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '6b6e9a411348a1922b1d9c58fe62acaba2876129262afd8ecdb57a42280032b4'

interface SocketUserPayload {
  userId: number
  username: string
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!cookieHeader) return result
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    result[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return result
}

function verifyToken(token: string | undefined): SocketUserPayload | null {
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SocketUserPayload
    if (typeof payload?.userId !== 'number') return null
    return payload
  } catch {
    return null
  }
}

let io: Server | null = null

export function getIO(): Server | null {
  return io
}

export function initSocketServer(httpServer: any): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie
    const token = parseCookies(cookieHeader).auth_token
    const payload = verifyToken(token)

    if (!payload) {
      return next(new Error('unauthorized'))
    }

    socket.data.userId = payload.userId
    socket.data.username = payload.username
    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as number | undefined
    if (userId) {
      socket.join(`user:${userId}`)
    }
  })

  return io
}

export function sendNotification(userId: number, notification: {
  id: number
  type: string
  title: string
  content: string
  createdAt: string
}) {
  if (!io) return
  io.to(`user:${userId}`).emit('notification', notification)
}

export function isWebSocketEnabled(): boolean {
  if (!globalThis.__wsEnabled) return true
  return globalThis.__wsEnabled !== 'false'
}

declare global {
  var __wsEnabled: string | undefined
}
