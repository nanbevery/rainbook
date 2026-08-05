'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const router = useRouter()
  const { setUser } = useAuth()

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!username.trim()) errors.username = '请输入用户名'
    if (!password) errors.password = '请输入密码'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (!json.success) {
        setFormError(json.error || '登录失败')
        return
      }
      setUser(json.data.user)
      if (json.data.needChangePassword) {
        toast({ title: '请修改默认密码', description: '首次登录请修改密码' })
        router.push('/settings?changePassword=1')
      } else {
        toast({ title: '登录成功' })
        router.push('/')
      }
    } catch {
      setFormError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>使用系统生成的用户名登录</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="username" className="sr-only">用户名或姓名</Label>
                <Input
                  id="username"
                  placeholder="用户名或真实姓名"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: '' })) }}
                  autoComplete="username"
                  className={fieldErrors.username ? 'border-red-500' : ''}
                />
                {fieldErrors.username && (
                  <p className="text-xs text-red-500">{fieldErrors.username}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="sr-only">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
                  autoComplete="current-password"
                  className={fieldErrors.password ? 'border-red-500' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                登录
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              还没有账号？{' '}
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
