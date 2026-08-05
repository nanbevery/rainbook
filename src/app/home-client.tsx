'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useSocket, useSocketNotification } from '@/hooks/use-socket'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Bell, Loader2, Users } from 'lucide-react'
import { cn, formatLastActive } from '@/lib/utils'
import type { UserInfo } from '@/types'

const MAX_RETRIES = 3

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

function UsersGrid({ users }: { users: UserInfo[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {users.map((user, i) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={`/user/${user.username}`}>
            <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={user.avatar} loading="lazy" />
                      <AvatarFallback className="text-lg">
                        {user.realName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background',
                        user.onlineStatus ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-400'
                      )}
                    />
                  </div>
                  <span className="font-medium text-sm truncate max-w-full">
                    {user.realName || user.username}
                  </span>
                  {user.onlineStatus ? (
                    <span className="text-[10px] text-emerald-600 font-medium">在线</span>
                  ) : user.lastActiveAt ? (
                    <span className="text-[10px] text-muted-foreground">
                      {formatLastActive(user.lastActiveAt)}
                    </span>
                  ) : null}
                  {user.className && (
                    <Badge variant="secondary" className="text-xs">
                      {user.className}
                    </Badge>
                  )}
                  {user.signature && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-1">
                      {user.signature}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

export function HomeClient() {
  const router = useRouter()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' })
        const json = await res.json()
        if (json.success) setUnreadCount(json.data?.unreadCount || 0)
      } catch {
        // ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useSocketNotification(() => {
    setUnreadCount((prev) => prev + 1)
  })

  const fetchUsers = useCallback(async (pageNum: number) => {
    const isFirstPage = pageNum === 1
    if (isFirstPage) setLoading(true)
    else setLoadingMore(true)
    setError(false)
    try {
      const res = await fetch(`/api/users?page=${pageNum}&pageSize=24`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      const list = json.data?.list ?? json.data ?? []
      const newTotal = json.data?.total ?? list.length
      setTotal(newTotal)
      if (isFirstPage) {
        setUsers(list)
        setFilteredUsers(list)
      } else {
        setUsers((prev) => [...prev, ...list])
        setFilteredUsers((prev) => [...prev, ...list])
      }
      setHasMore(pageNum * 24 < newTotal)
      setPage(pageNum)
    } catch {
      if (retryCount < MAX_RETRIES - 1) {
        setRetryCount((c) => c + 1)
      } else {
        setError(true)
        toast({ title: '加载失败', description: '请检查网络后重试', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [retryCount])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchUsers(page + 1)
    }
  }

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users)
      return
    }
    const q = search.toLowerCase()
    setFilteredUsers(
      users.filter(
        (u) =>
          u.realName?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.className?.toLowerCase().includes(q)
      )
    )
  }, [search, users])

  const handleRetry = () => {
    setRetryCount(0)
    fetchUsers(1)
  }

  if (error) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">加载失败，请重试</p>
        <Button onClick={handleRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">同学录</h1>
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索同学姓名或用户名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
          aria-label="通知中心"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {renderContent()}

      {!search.trim() && hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {`加载更多 (${users.length}/${total})`}
          </Button>
        </div>
      )}
    </div>
  )

  function renderContent() {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-20 text-muted-foreground">
          {search ? (
            <>
              <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
              没有找到匹配的同学
            </>
          ) : (
            <>
              <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
              还没有同学注册
            </>
          )}
        </div>
      )
    }

    return <UsersGrid users={filteredUsers} />
  }
}
