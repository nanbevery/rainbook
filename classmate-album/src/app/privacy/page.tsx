'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { Save, Loader2, ChevronLeft, Search, X, Eye, EyeOff, Users } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { PrivacyLevel } from '@/types'

const privacyLevels: { value: PrivacyLevel; label: string }[] = [
  { value: 'public', label: '公开' },
  { value: 'private', label: '私密' },
  { value: 'friends_only', label: '仅好友可见' },
  { value: 'custom', label: '自定义' },
]

const privacyDescriptions: Record<PrivacyLevel, string> = {
  public: '所有人可见',
  private: '完全隐藏',
  friends_only: '仅指定的好友可见',
  custom: '对指定的人隐藏',
}

interface PrivacyField {
  key: string
  label: string
  privacy: string
  selectedUsers: number[]
  excludedUsers: number[]
}

interface UserBrief {
  id: number
  realName: string
  username: string
  avatar: string
}

export default function PrivacyPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [allUsers, setAllUsers] = useState<UserBrief[]>([])

  const [fields, setFields] = useState<PrivacyField[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [customMode, setCustomMode] = useState<'include' | 'exclude'>('include')

  useEffect(() => {
    if (!user) return
    setFields([
      {
        key: 'phonePrivacy',
        label: '手机号',
        privacy: user.phonePrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
      {
        key: 'emailPrivacy',
        label: '邮箱',
        privacy: user.emailPrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
      {
        key: 'wechatPrivacy',
        label: '微信',
        privacy: user.wechatPrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
      {
        key: 'weiboPrivacy',
        label: '微博',
        privacy: user.weiboPrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
      {
        key: 'douyinPrivacy',
        label: '抖音',
        privacy: user.douyinPrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
      {
        key: 'bilibiliPrivacy',
        label: 'B站',
        privacy: user.bilibiliPrivacy,
        selectedUsers: [],
        excludedUsers: [],
      },
    ])

    apiFetch<UserBrief[]>('/api/users')
      .then((data) => setAllUsers(data.filter((u: UserBrief) => u.id !== user.id)))
      .catch(() => {})
  }, [user])

  const updateField = (key: string, updates: Partial<PrivacyField>) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updates } : f))
    )
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.realName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      const overrides: Record<string, { selected?: number[]; excluded?: number[] }> = {}

      for (const f of fields) {
        payload[f.key] = f.privacy
        if (f.privacy === 'friends_only' && f.selectedUsers.length > 0) {
          overrides[f.key] = { selected: f.selectedUsers }
        } else if (f.privacy === 'custom' && f.excludedUsers.length > 0) {
          overrides[f.key] = { excluded: f.excludedUsers }
        }
      }

      payload.privacyOverrides = overrides

      await apiFetch('/api/privacy', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      toast({ title: '隐私设置已保存' })
      refreshUser()
    } catch (err: any) {
      toast({ title: err.message || '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        请先登录
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">隐私设置</h1>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <Card key={field.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{field.label}</span>
                <Badge variant="outline" className="text-xs">
                  {field.privacy === 'public'
                    ? '公开'
                    : field.privacy === 'private'
                    ? '未公开'
                    : '受限'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={field.privacy}
                onValueChange={(val) => {
                  updateField(field.key, { privacy: val })
                  if (val === 'custom' || val === 'friends_only') {
                    setActiveField(field.key)
                    setCustomMode(val === 'friends_only' ? 'include' : 'exclude')
                  } else {
                    if (activeField === field.key) setActiveField(null)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {privacyLevels.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      <div className="flex items-center gap-2">
                        {l.value === 'public' && <Eye className="h-3 w-3" />}
                        {l.value === 'private' && <EyeOff className="h-3 w-3" />}
                        {(l.value === 'friends_only' || l.value === 'custom') && (
                          <Users className="h-3 w-3" />
                        )}
                        {l.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {privacyDescriptions[field.privacy as PrivacyLevel]}
              </p>

              {(field.privacy === 'friends_only' || field.privacy === 'custom') && (
                <div className="pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 text-center">无匹配用户</p>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = field.selectedUsers.includes(u.id)
                        const isExcluded = field.excludedUsers.includes(u.id)
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-3 py-3 px-2 hover:bg-accent cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={field.privacy === 'friends_only' ? isSelected : isExcluded}
                              onCheckedChange={(checked) => {
                                if (field.privacy === 'friends_only') {
                                  updateField(field.key, {
                                    selectedUsers: checked
                                      ? [...field.selectedUsers, u.id]
                                      : field.selectedUsers.filter((id) => id !== u.id),
                                  })
                                } else {
                                  updateField(field.key, {
                                    excludedUsers: checked
                                      ? [...field.excludedUsers, u.id]
                                      : field.excludedUsers.filter((id) => id !== u.id),
                                  })
                                }
                              }}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar} />
                              <AvatarFallback className="text-xs">
                                {u.realName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{u.realName || u.username}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  {field.privacy === 'friends_only' && field.selectedUsers.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {field.selectedUsers.map((id) => {
                        const u = allUsers.find((x) => x.id === id)
                        return u ? (
                          <Badge key={id} variant="secondary" className="gap-1">
                            {u.realName}
                            <button
                              onClick={() =>
                                updateField(field.key, {
                                  selectedUsers: field.selectedUsers.filter((x) => x !== id),
                                })
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                  {field.privacy === 'custom' && field.excludedUsers.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {field.excludedUsers.map((id) => {
                        const u = allUsers.find((x) => x.id === id)
                        return u ? (
                          <Badge key={id} variant="secondary" className="gap-1">
                            {u.realName}
                            <button
                              onClick={() =>
                                updateField(field.key, {
                                  excludedUsers: field.excludedUsers.filter((x) => x !== id),
                                })
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          保存隐私设置
        </Button>
      </div>
    </div>
  )
}
