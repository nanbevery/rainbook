'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from '@/hooks/use-toast'
import {
  Settings,
  Shield,
  LogOut,
  CalendarDays,
  Image as ImageIcon,
  ChevronRight,
  Edit,
} from 'lucide-react'

export default function MePage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [albumCount, setAlbumCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    if (!user) return
    apiFetch<{ length?: number }>('/api/users/' + user.id + '/albums')
      .then((data) => setAlbumCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
    apiFetch<{ total?: number }>('/api/users/' + user.id + '/events')
      .then((data) => setEventCount(data?.total ?? 0))
      .catch(() => {})
  }, [user])

  if (authLoading) {
    return (
      <div className="container py-6 max-w-3xl">
        <Skeleton className="h-52 sm:h-64 rounded-2xl mb-4" />
        <div className="relative -mt-16 mb-4 flex items-end gap-4 px-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 mb-1" />
        </div>
        <Skeleton className="h-16 rounded-xl mb-4" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">请先登录</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
    toast({ title: '已退出登录' })
    router.push('/')
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 cursor-pointer group" onClick={() => router.push('/settings')} title="点击编辑资料">
        {user.coverImage && (
          <>
            <Image src={user.coverImage} alt="" fill sizes="768px" className="object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/25" />
          </>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 ring-4 ring-white/90 shadow-lg">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                {user.realName?.charAt(0) || user.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl font-bold text-white drop-shadow-sm">
              {user.realName || user.username}
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-1 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-gray-700 shadow"
              onClick={() => router.push('/settings')}
            >
              <Edit className="h-4 w-4 mr-1" />编辑资料
            </Button>
          </div>
        </div>
      </div>

      {user.signature && (
        <p className="text-sm text-muted-foreground text-center mt-4 mb-6 px-4">
          {user.signature}
        </p>
      )}
      {!user.signature && <div className="mt-2 mb-4" />}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/albums">
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <CardContent className="p-4 text-center">
              <ImageIcon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{albumCount}</p>
              <p className="text-xs text-muted-foreground">相册</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/events">
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <CardContent className="p-4 text-center">
              <CalendarDays className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold">{eventCount}</p>
              <p className="text-xs text-muted-foreground">大事记</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <Link href="/settings" className="flex-1">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">个人设置</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/privacy" className="flex-1">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">隐私设置</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card
          className="hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => setShowLogoutDialog(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">退出登录</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>退出登录</AlertDialogTitle>
            <AlertDialogDescription>
              确定要退出当前账号吗？退出后需要重新登录才能使用完整功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
