'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Check } from 'lucide-react'

interface SmtpConfig {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  adminNotifyEmail: string
  adminNotifyEmailVerified: boolean
}

export default function SmtpPage() {
  const [config, setConfig] = useState<SmtpConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bindEmail, setBindEmail] = useState('')
  const [bindPassword, setBindPassword] = useState('')
  const [bindStep, setBindStep] = useState<'idle' | 'awaiting-code'>('idle')
  const [bindCode, setBindCode] = useState('')
  const [bindLoading, setBindLoading] = useState(false)
  const [targetBindEmail, setTargetBindEmail] = useState('')
  const [changeEmail, setChangeEmail] = useState('')
  const [changeStep, setChangeStep] = useState<'idle' | 'awaiting-codes'>('idle')
  const [oldCode, setOldCode] = useState('')
  const [newCode, setNewCode] = useState('')
  const [changeLoading, setChangeLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    apiFetch<SmtpConfig>('/api/admin/smtp')
      .then(setConfig)
      .catch(() => toast({ title: '获取配置失败', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  async function saveSmtp() {
    if (!config) return
    setSaving(true)
    try {
      await apiFetch('/api/admin/smtp', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      toast({ title: 'SMTP 配置已保存' })
    } catch {
      toast({ title: '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function update(key: keyof SmtpConfig, value: string) {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  async function sendBindCode() {
    if (!bindEmail || !bindPassword) {
      toast({ title: '请填写邮箱和管理员密码', variant: 'destructive' })
      return
    }
    setBindLoading(true)
    try {
      await apiFetch('/api/admin/notify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'bind', email: bindEmail, adminPassword: bindPassword }),
      })
      setTargetBindEmail(bindEmail)
      setBindStep('awaiting-code')
      toast({ title: '验证码已发送' })
    } catch (e: any) {
      toast({ title: e.message || '发送失败', variant: 'destructive' })
    } finally {
      setBindLoading(false)
    }
  }

  async function verifyBind() {
    if (!bindCode) {
      toast({ title: '请输入验证码', variant: 'destructive' })
      return
    }
    setBindLoading(true)
    try {
      await apiFetch('/api/admin/notify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'verify-bind', email: targetBindEmail, code: bindCode }),
      })
      toast({ title: '邮箱绑定成功' })
      setBindStep('idle')
      setBindEmail('')
      setBindPassword('')
      setBindCode('')
      const data = await apiFetch<SmtpConfig>('/api/admin/smtp')
      setConfig(data)
    } catch (e: any) {
      toast({ title: e.message || '验证失败', variant: 'destructive' })
    } finally {
      setBindLoading(false)
    }
  }

  async function sendChangeCodes() {
    if (!changeEmail) {
      toast({ title: '请输入新邮箱', variant: 'destructive' })
      return
    }
    setChangeLoading(true)
    try {
      await apiFetch('/api/admin/notify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'send-change-code', newEmail: changeEmail }),
      })
      setChangeStep('awaiting-codes')
      toast({ title: '验证码已发送至新旧邮箱' })
    } catch (e: any) {
      toast({ title: e.message || '发送失败', variant: 'destructive' })
    } finally {
      setChangeLoading(false)
    }
  }

  async function verifyChange() {
    if (!newCode || !oldCode) {
      toast({ title: '请输入新旧邮箱的验证码', variant: 'destructive' })
      return
    }
    setChangeLoading(true)
    try {
      await apiFetch('/api/admin/notify-email', {
        method: 'POST',
        body: JSON.stringify({ action: 'verify-change', newEmail: changeEmail, code: newCode, oldCode }),
      })
      toast({ title: '邮箱变更成功' })
      setChangeStep('idle')
      setChangeEmail('')
      setOldCode('')
      setNewCode('')
      const data = await apiFetch<SmtpConfig>('/api/admin/smtp')
      setConfig(data)
    } catch (e: any) {
      toast({ title: e.message || '验证失败', variant: 'destructive' })
    } finally {
      setChangeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">邮件配置</h1>
        <p className="text-muted-foreground mt-1">SMTP 发信设置与管理员通知邮箱</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP 服务器</CardTitle>
          <CardDescription>配置发信服务器参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP 地址</Label>
              <Input
                placeholder="smtp.example.com"
                value={config?.smtpHost || ''}
                onChange={(e) => update('smtpHost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>端口</Label>
              <Input
                type="number"
                placeholder="587"
                value={config?.smtpPort || ''}
                onChange={(e) => update('smtpPort', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>发信账号</Label>
            <Input
              placeholder="user@example.com"
              value={config?.smtpUser || ''}
              onChange={(e) => update('smtpUser', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>发信密码</Label>
            <Input
              type="password"
              placeholder="SMTP 授权码"
              value={config?.smtpPass || ''}
              onChange={(e) => update('smtpPass', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>发件人地址</Label>
            <Input
              placeholder="noreply@example.com"
              value={config?.smtpFrom || ''}
              onChange={(e) => update('smtpFrom', e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveSmtp} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              保存 SMTP 配置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            管理员通知邮箱
            {config?.adminNotifyEmailVerified && (
              <Badge variant="default" className="ml-2">
                <Check className="w-3 h-3 mr-1" />
                已验证
              </Badge>
            )}
          </CardTitle>
          <CardDescription>接收注册申请通知的邮箱地址</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.adminNotifyEmail ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">当前邮箱：</span>
                <span className="font-medium break-all">{config.adminNotifyEmail}</span>
              </div>
              {changeStep === 'idle' ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>变更邮箱</Label>
                    <Input
                      type="email"
                      placeholder="输入新邮箱地址"
                      value={changeEmail}
                      onChange={(e) => setChangeEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={sendChangeCodes} disabled={changeLoading}>
                    {changeLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    发送验证码
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Label>新邮箱验证码</Label>
                    <Input
                      placeholder="输入新邮箱收到的验证码"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setChangeStep('idle')}>取消</Button>
                    <Button onClick={verifyChange} disabled={changeLoading}>
                      {changeLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                      确认变更
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : bindStep === 'idle' ? (
            <div className="space-y-3 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">尚未绑定通知邮箱，请先绑定以接收注册申请通知。</p>
              <div className="space-y-2">
                <Label>通知邮箱</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={bindEmail}
                  onChange={(e) => setBindEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>管理员密码（验证身份）</Label>
                <Input
                  type="password"
                  placeholder="输入管理员密码"
                  value={bindPassword}
                  onChange={(e) => setBindPassword(e.target.value)}
                />
              </div>
              <Button onClick={sendBindCode} disabled={bindLoading}>
                {bindLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                发送验证码
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label>验证码（已发送至 {targetBindEmail}）</Label>
                <Input
                  placeholder="输入验证码"
                  value={bindCode}
                  onChange={(e) => setBindCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBindStep('idle')}>取消</Button>
                <Button onClick={verifyBind} disabled={bindLoading}>
                  {bindLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  确认绑定
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
