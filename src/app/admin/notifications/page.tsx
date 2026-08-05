'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Send, Users, UserPlus } from 'lucide-react'

interface UserOption {
  id: number
  username: string
  realName: string
  className: string
}

export default function NotificationsPage() {
  const [pushMode, setPushMode] = useState<'all' | 'targeted'>('all')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetUsers, setTargetUsers] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserOption[]>([])
  const [sending, setSending] = useState(false)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: searchQuery })
        const data = await apiFetch<UserOption[]>(`/api/admin/users/search?${params}`)
        setSearchResults(data)
      } catch {
        // ignore
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function toggleUser(userId: number) {
    setTargetUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  async function sendPush() {
    if (!title.trim()) {
      toast({ title: '请输入推送标题', variant: 'destructive' })
      return
    }
    if (!content.trim()) {
      toast({ title: '请输入推送内容', variant: 'destructive' })
      return
    }
    if (pushMode === 'all') {
      setConfirmAllOpen(true)
      return
    }
    doSendPush()
  }

  async function doSendPush() {
    setSending(true)
    try {
      await apiFetch('/api/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          mode: pushMode,
          userIds: pushMode === 'targeted' ? targetUsers : undefined,
        }),
      })
      toast({ title: '推送已发送' })
      setTitle('')
      setContent('')
      setTargetUsers([])
    } catch {
      toast({ title: '推送失败', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">消息推送</h1>
        <p className="text-muted-foreground mt-1">向用户发送系统通知</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>推送设置</CardTitle>
          <CardDescription>选择推送范围和内容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>推送模式</Label>
            <Select value={pushMode} onValueChange={(v) => setPushMode(v as 'all' | 'targeted')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> 全员推送
                  </span>
                </SelectItem>
                <SelectItem value="targeted">
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> 定向推送
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pushMode === 'targeted' && (
            <div className="space-y-2">
              <Label>选择用户</Label>
              <Input
                placeholder="搜索用户姓名或用户名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={targetUsers.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{user.realName}</span>
                      <span className="text-sm text-muted-foreground">@{user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.className}</span>
                    </label>
                  ))}
                </div>
              )}
              {targetUsers.length > 0 && (
                <p className="text-sm text-muted-foreground">已选择 {targetUsers.length} 位用户</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>推送标题</Label>
            <Input
              placeholder="推送标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>推送内容</Label>
            <Textarea
              placeholder="推送内容..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <Button onClick={sendPush} disabled={sending} className="w-full">
            <Send className="w-4 h-4 mr-1" />
            {sending ? '发送中...' : '发送推送'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认全员推送</AlertDialogTitle>
            <AlertDialogDescription>
              确定要推送给所有用户吗？此操作不可撤回。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={doSendPush}>确认发送</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
