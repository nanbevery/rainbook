import { NextResponse } from 'next/server'

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function apiMessage(message: string, data?: unknown, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-client-ip') || '127.0.0.1'
}
