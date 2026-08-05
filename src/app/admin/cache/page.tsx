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
import { Trash2, RotateCcw } from 'lucide-react'

interface CacheModule {
  name: string
  label: string
  enabled: boolean
  ttl: number
}

export default function CachePage() {
  const [modules, setModules] = useState<CacheModule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    apiFetch<CacheModule[]>('/api/admin/cache')
      .then(setModules)
      .catch(() => toast({ title: '获取缓存配置失败', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  async function saveModule(index: number, mod: CacheModule) {
    setSaving(true)
    try {
      await apiFetch('/api/admin/cache', {
        method: 'PUT',
        body: JSON.stringify(mod),
      })
      const next = [...modules]
      next[index] = mod
      setModules(next)
      toast({ title: '配置已更新' })
    } catch {
      toast({ title: '更新失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function clearModule(name: string) {
    try {
      await apiFetch(`/api/admin/cache/${name}`, { method: 'DELETE' })
      toast({ title: `已清空 ${name} 缓存` })
    } catch {
      toast({ title: '清空失败', variant: 'destructive' })
    }
  }

  async function clearAll() {
    try {
      await apiFetch('/api/admin/cache/clear-all', { method: 'POST' })
      toast({ title: '已清空全部缓存' })
    } catch {
      toast({ title: '清空失败', variant: 'destructive' })
    }
  }

  async function resetDefaults() {
    try {
      const data = await apiFetch<CacheModule[]>('/api/admin/cache/reset', { method: 'POST' })
      setModules(data)
      toast({ title: '已恢复默认配置' })
    } catch {
      toast({ title: '重置失败', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">缓存管理</h1>
          <p className="text-muted-foreground mt-1">管理系统各模块缓存配置</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDefaults}>
            <RotateCcw className="w-4 h-4 mr-1" />
            恢复默认
          </Button>
          <Button variant="destructive" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空全部缓存
          </Button>
        </div>
      </div>

      {modules.map((mod, index) => (
        <Card key={`cache-${mod.name}-${index}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{mod.label}</CardTitle>
                <CardDescription>{mod.name}</CardDescription>
              </div>
              <Switch
                checked={mod.enabled}
                onCheckedChange={(v) => {
                  const next = { ...mod, enabled: v }
                  const newModules = [...modules]
                  newModules[index] = next
                  setModules(newModules)
                  saveModule(index, next)
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-2 flex-1">
                <Label>TTL（秒）</Label>
                <Input
                  type="number"
                  min={1}
                  value={mod.ttl}
                  onChange={(e) => {
                    const next = { ...mod, ttl: Number(e.target.value) }
                    const newModules = [...modules]
                    newModules[index] = next
                    setModules(newModules)
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = { ...mod, ttl: mod.ttl }
                  const newModules = [...modules]
                  newModules[index] = next
                  setModules(newModules)
                  saveModule(index, newModules[index])
                }}
                disabled={saving}
              >
                保存
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearModule(mod.name)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
