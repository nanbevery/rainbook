'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'

const CHINESE_NAME_REGEX = /^[\u4e00-\u9fa5·]{2,10}$/

export default function RegisterPage() {
  const [realName, setRealName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [resultInfo, setResultInfo] = useState<{ username: string; realName: string; email: string; emailSent: boolean; message: string } | null>(null)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!realName.trim()) {
      errors.realName = '请填写真实姓名'
    } else if (!CHINESE_NAME_REGEX.test(realName.trim())) {
      errors.realName = '请输入正确的中文姓名（2-10 个汉字）'
    }
    if (!password) {
      errors.password = '请设置登录密码'
    } else if (password.length < 6) {
      errors.password = '密码长度至少 6 位'
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = '邮箱格式不正确'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateAndConfirm(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setConfirmOpen(true)
  }

  async function handleSubmit() {
    setConfirmOpen(false)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ realName, password, email: email || undefined }),
      })
      const json = await res.json()
      if (!json.success) {
        setFormError(json.error || '申请失败')
        return
      }
      setResultInfo(json.data)
      setSubmitted(true)
    } catch {
      setFormError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (submitted && resultInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">申请已提交</CardTitle>
              <CardDescription>请耐心等待管理员审核</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="rounded-lg bg-primary/5 p-6 space-y-3">
                <p className="text-lg font-medium">{resultInfo.realName}</p>
                <p className="text-sm text-muted-foreground">
                  系统用户名：<span className="font-mono font-medium text-foreground">{resultInfo.username}</span>
                </p>
                {resultInfo.emailSent ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    审核结果将发送至 {resultInfo.email || ''}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    未填写邮箱，请自行登录查看审核结果
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{resultInfo.message}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">前往登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">申请加入</CardTitle>
            <CardDescription>填写姓名后提交申请，等待管理员审核</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={validateAndConfirm} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="realName" className="sr-only">真实姓名</Label>
                <Input
                  id="realName"
                  placeholder="真实姓名（中文）"
                  value={realName}
                  onChange={(e) => { setRealName(e.target.value); setFieldErrors((p) => ({ ...p, realName: '' })) }}
                  className={fieldErrors.realName ? 'border-red-500' : ''}
                />
                {fieldErrors.realName && (
                  <p className="text-xs text-red-500">{fieldErrors.realName}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="sr-only">登录密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="登录密码（至少 6 位）"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
                  autoComplete="new-password"
                  className={fieldErrors.password ? 'border-red-500' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="sr-only">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })) }}
                  autoComplete="new-password"
                  className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="sr-only">邮箱（选填）</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="邮箱（选填，用于接收审核结果）"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })) }}
                  autoComplete="email"
                  className={fieldErrors.email ? 'border-red-500' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                提交申请
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              已有账号？{' '}
              <Link href="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认申请信息</DialogTitle>
            <DialogDescription>请核对您的信息，提交后将由管理员审核</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">姓名</span>
              <span className="font-medium">{realName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">邮箱</span>
              <span className="font-medium">{email || '未填写'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">密码强度</span>
              <span className={`font-medium ${password.length >= 10 ? 'text-green-600' : password.length >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                {password.length >= 10 ? '强' : password.length >= 6 ? '中' : '弱'}
              </span>
            </div>
            {!email && (
              <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  ⚠️ 您未填写邮箱，审核结果将无法通过邮件通知。请自行登录查看审核状态。
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>返回修改</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
