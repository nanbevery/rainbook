'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

interface SystemSettings {
  siteName: string
  siteDescription: string
  wsEnabled: boolean
  autoBackupEnabled: boolean
  autoBackupDays: number
  ipBanThreshold: number
  ipBanDuration: number
  logRetentionDays: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    apiFetch<Record<string, string>>('/api/admin/settings')
      .then((raw) => {
        const parsed: SystemSettings = {
          siteName: raw.siteName || '',
          siteDescription: raw.siteDescription || '',
          wsEnabled: raw.wsEnabled === 'true',
          autoBackupEnabled: raw.autoBackupEnabled === 'true',
          autoBackupDays: Number(raw.autoBackupDays) || 7,
          ipBanThreshold: Number(raw.ipBanThreshold) || 5,
          ipBanDuration: Number(raw.ipBanDuration) || 60,
          logRetentionDays: Number(raw.logRetentionDays) || 30,
        }
        setSettings(parsed)
      })
      .catch(() => toast({ title: '获取系统设置失败', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      toast({ title: '设置已保存' })
    } catch {
      toast({ title: '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function update(key: keyof SystemSettings, value: any) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-muted-foreground mt-1">全局系统参数配置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本设置</CardTitle>
          <CardDescription>站点基本信息和功能开关</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>站点名称</Label>
            <Input
              value={settings?.siteName || ''}
              onChange={(e) => update('siteName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>站点描述</Label>
            <Input
              value={settings?.siteDescription || ''}
              onChange={(e) => update('siteDescription', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="mr-4 flex-1">
              <Label>WebSocket</Label>
              <p className="text-sm text-muted-foreground">启用实时消息推送</p>
            </div>
            <Switch
              checked={settings?.wsEnabled ?? true}
              onCheckedChange={(v) => update('wsEnabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>备份设置</CardTitle>
          <CardDescription>自动备份相关配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="mr-4 flex-1">
              <Label>自动备份</Label>
              <p className="text-sm text-muted-foreground">定时自动备份数据库</p>
            </div>
            <Switch
              checked={settings?.autoBackupEnabled ?? false}
              onCheckedChange={(v) => update('autoBackupEnabled', v)}
            />
          </div>
          <div className="space-y-2">
            <Label>备份保留天数</Label>
            <Input
              type="number"
              min={1}
              value={settings?.autoBackupDays ?? 7}
              onChange={(e) => update('autoBackupDays', Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
          <CardDescription>IP 封禁和日志保留</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IP 自动封禁阈值（次）</Label>
              <Input
                type="number"
                min={1}
                value={settings?.ipBanThreshold ?? 5}
                onChange={(e) => update('ipBanThreshold', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>封禁时长（分钟）</Label>
              <Input
                type="number"
                min={1}
                value={settings?.ipBanDuration ?? 60}
                onChange={(e) => update('ipBanDuration', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>日志保留天数</Label>
            <Input
              type="number"
              min={1}
              value={settings?.logRetentionDays ?? 30}
              onChange={(e) => update('logRetentionDays', Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          保存设置
        </Button>
      </div>
    </div>
  )
}
