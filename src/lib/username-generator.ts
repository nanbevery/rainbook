import { pinyin } from 'pinyin-pro'
import prisma from '@/lib/prisma'

function chineseToPinyin(name: string): string {
  return pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase()
}

export async function generateUsername(realName: string): Promise<string> {
  const base = chineseToPinyin(realName)

  const existing = await prisma.user.findUnique({ where: { username: base } })
  if (!existing) return base

  const letters = 'abcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < letters.length; i++) {
    const candidate = base + letters[i]
    const dup = await prisma.user.findUnique({ where: { username: candidate } })
    if (!dup) return candidate
  }

  for (let i = 0; i < letters.length; i++) {
    const candidate = base + '1' + letters[i]
    const dup = await prisma.user.findUnique({ where: { username: candidate } })
    if (!dup) return candidate
  }

  return base + Math.random().toString(36).substring(2, 6)
}
