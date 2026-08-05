'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Search,
  Bell,
  CheckCircle2,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationInfo } from '@/types'

const typeLabels: Record<string, string> = {
  comment: '评论',
  like: '点赞',
  audit: '审核',
  system: '系统',
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return '今天'
  if (isYesterday(date)) return '昨天'
  return format(date, 'yyyy-MM-dd', { locale: zhCN })
}

function groupByDate(notifications: NotificationInfo[]): Record<string, NotificationInfo[]> {
  const groups: Record<string, NotificationInfo[]> = {}
  notifications.forEach((n) => {
    const key = formatDateGroup(n.createdAt)
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<{ list: NotificationInfo[] }>('/api/notifications')
      setNotifications(data.list)
    } catch {
      toast({ title: '加载通知失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user, fetchNotifications])

  const filtered = useMemo(() => {
    let list = notifications
    if (filter !== 'all') {
      if (filter === 'unread') {
        list = list.filter((n) => !n.isRead)
      } else {
        list = list.filter((n) => n.type === filter)
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q)
      )
    }
    return list
  }, [notifications, filter, search])

  const groupedNotifications = useMemo(() => groupByDate(filtered), [filtered])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await apiFetch('/api/notifications', { method: 'PUT' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast({ title: '已全部标记为已读' })
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    } finally {
      setMarkingAll(false)
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
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">通知</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} 条未读
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            全部已读
          </Button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索通知..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="unread">未读</SelectItem>
            <SelectItem value="comment">评论</SelectItem>
            <SelectItem value="like">点赞</SelectItem>
            <SelectItem value="audit">审核</SelectItem>
            <SelectItem value="system">系统</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : Object.keys(groupedNotifications).length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-40" />
          暂无通知
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([dateGroup, items]) => (
            <div key={dateGroup}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 md:top-14 bg-background py-1 z-10">
                {dateGroup}
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-accent/50',
                          !n.isRead && 'border-l-2 border-l-primary bg-primary/5'
                        )}
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n.id)
                          if (n.type === 'comment' || n.type === 'like') {
                            n.relatedId && router.push(`/events/${n.relatedId}`)
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {typeLabels[n.type] || n.type}
                                </Badge>
                                {!n.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <h4 className="text-sm font-medium">{n.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {n.content}
                              </p>
                            </div>
                            {!n.isRead && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkRead(n.id)
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
