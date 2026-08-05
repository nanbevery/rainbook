export function isValidChineseName(name: string): boolean {
  return /^[\u4e00-\u9fa5]{2,10}$/.test(name)
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 50
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true
  return /^1[3-9]\d{9}$/.test(phone)
}

export function isValidEmail(email: string): boolean {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim()
}

export function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
