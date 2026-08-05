'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/api'
import { Users, Wifi, Images, CalendarDays } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  onlineUsers: number
  totalAlbums: number
  totalAlbumImages: number
  totalEvents: number
}

const cards = [
  { key: 'totalUsers', label: '注册总人数', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'onlineUsers', label: '当前在线', icon: Wifi, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  { key: 'totalAlbums', label: '相册数量', icon: Images, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950' },
  { key: 'totalAlbumImages', label: '相册图片', icon: Images, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950' },
  { key: 'totalEvents', label: '大事记', icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<DashboardStats>('/api/admin/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground mt-1">系统运行概览</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ key, label, icon: Icon, color, bg }) => (
            <Card key={key}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl sm:text-3xl font-bold ${color}`}>
                  {stats ? (stats as unknown as Record<string, number>)[key] ?? 0 : 0}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
