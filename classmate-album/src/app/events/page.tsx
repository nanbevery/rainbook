'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch, apiUpload } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Calendar, Upload, Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ClassEventInfo } from '@/types'

function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Skeleton className="w-20 h-20 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<ClassEventInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [creating, setCreating] = useState(false)

  const fetchEvents = useCallback(async (pageNum = 1, append = false) => {
    try {
      const data = await apiFetch<{ list: ClassEventInfo[]; total: number }>(`/api/events?page=${pageNum}&pageSize=20`)
      const newList = data.list || []
      setEvents((prev) => (append ? [...prev, ...newList] : newList))
      setHasMore(pageNum * 20 < (data.total || 0))
    } catch {
      toast({ title: '加载大事记失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      await fetchEvents(page + 1, true)
      setPage((p) => p + 1)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchEvents(1)
  }, [fetchEvents])

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !eventDate) {
      toast({ title: '请填写完整信息', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const imageUrls: { url: string; thumbnailUrl?: string }[] = []
      for (const file of images) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        const uploadResult = await apiUpload<{ url: string; thumbnailUrl?: string }>('/api/upload', uploadFormData)
        imageUrls.push({ url: uploadResult.url, thumbnailUrl: uploadResult.thumbnailUrl })
      }

      await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, eventDate, imageUrls }),
      })
      toast({ title: '创建成功' })
      setShowCreate(false)
      setTitle('')
      setDescription('')
      setEventDate('')
      setImages([])
      setPage(1)
      fetchEvents(1)
    } catch (err: any) {
      toast({ title: err.message || '创建失败', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">大事记</h1>
        {user && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />创建大事记
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建大事记</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标题 *</label>
                  <Input
                    placeholder="大事记标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">描述 *</label>
                  <Textarea
                    placeholder="描述（支持 Markdown）"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">事件日期</label>
                  <DatePicker
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">图片（最多9张）</label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selected = Array.from(e.target.files).slice(0, 9)
                        setImages(selected)
                      }
                    }}
                  />
                  {images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {images.map((f, i) => (
                        <Badge key={i} variant="secondary">
                          {f.name}
                          <button
                            className="ml-1"
                            onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    创建
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
          暂无大事记
        </div>
      ) : (
        <div className="relative pl-8 border-l-2 border-muted space-y-6">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <div className="absolute -left-[39px] top-4 h-4 w-4 rounded-full bg-primary border-2 border-background" />
              <Link href={`/events/${event.id}`}>
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {event.images?.[0] && (
                        <div className="w-24 h-24 rounded overflow-hidden bg-muted shrink-0">
                          <Image
                            src={event.images[0].thumbnailUrl || event.images[0].url}
                            alt={event.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.eventDate), 'yyyy-MM-dd', { locale: zhCN })}
                          </span>
                          <span>{event.user?.realName}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            加载更多
          </Button>
        </div>
      )}
    </div>
  )
}
