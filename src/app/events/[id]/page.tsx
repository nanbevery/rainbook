'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch, apiUpload } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Upload,
  Loader2,
  Star,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Send,
} from 'lucide-react'
import type { ClassEventInfo, EventImageInfo, EventImageCommentInfo } from '@/types'

interface FullscreenState {
  index: number
  showComments: boolean
  comments: EventImageCommentInfo[]
  newComment: string
  loadingComments: boolean
  sendingComment: boolean
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = Number(params.id)

  const [event, setEvent] = useState<ClassEventInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fs, setFs] = useState<FullscreenState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteImageTarget, setDeleteImageTarget] = useState<number | null>(null)
  const [deleteEventTarget, setDeleteEventTarget] = useState(false)
  const [deletingImage, setDeletingImage] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [togglingLike, setTogglingLike] = useState<Set<number>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const isCreator = event && user?.id === event.userId

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiFetch<ClassEventInfo>(`/api/events/${eventId}`)
        setEvent(data)
      } catch {
        toast({ title: '加载大事记失败', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [eventId])

  const handleUploadMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const images: { url: string; thumbnailUrl?: string }[] = []
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        const uploadResult = await apiUpload<{ url: string; thumbnailUrl?: string }>('/api/upload', uploadFormData)
        images.push({ url: uploadResult.url, thumbnailUrl: uploadResult.thumbnailUrl })
      }
      await apiFetch(`/api/events/${eventId}/images`, {
        method: 'POST',
        body: JSON.stringify({ images }),
      })
      toast({ title: '上传成功' })
      const data = await apiFetch<ClassEventInfo>(`/api/events/${eventId}`)
      setEvent(data)
      e.target.value = ''
    } catch (err: any) {
      toast({ title: err.message || '上传失败', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!deleteImageTarget) return
    setDeletingImage(true)
    try {
      await apiFetch(`/api/events/${eventId}/images/${deleteImageTarget}`, { method: 'DELETE' })
      toast({ title: '已删除' })
      const data = await apiFetch<ClassEventInfo>(`/api/events/${eventId}`)
      setEvent(data)
      setDeleteImageTarget(null)
      setFs(null)
    } catch (err: any) {
      toast({ title: err.message || '删除失败', variant: 'destructive' })
    } finally {
      setDeletingImage(false)
    }
  }

  const handleDeleteEvent = async () => {
    setDeletingEvent(true)
    try {
      await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' })
      toast({ title: '已删除大事记' })
      router.push('/events')
    } catch (err: any) {
      toast({ title: err.message || '删除失败', variant: 'destructive' })
    } finally {
      setDeletingEvent(false)
    }
  }

  const handleToggleLike = async (img: EventImageInfo) => {
    if (!user) {
      toast({ title: '请先登录', variant: 'destructive' })
      return
    }
    setTogglingLike((prev) => new Set(prev).add(img.id))
    try {
      const result = await apiFetch<{ liked: boolean; count: number }>(
        `/api/events/${eventId}/images/${img.id}/like`,
        { method: 'POST' }
      )
      setEvent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          images: prev.images.map((i) =>
            i.id === img.id
              ? { ...i, liked: result.liked, _count: { likes: result.count } }
              : i
          ),
        }
      })
    } catch (err: any) {
      toast({ title: err.message || '操作失败', variant: 'destructive' })
    } finally {
      setTogglingLike((prev) => {
        const next = new Set(prev)
        next.delete(img.id)
        return next
      })
    }
  }

  const openFullscreen = async (index: number) => {
    setFs({ index, showComments: false, comments: [], newComment: '', loadingComments: false, sendingComment: false })
  }

  const toggleComments = async () => {
    if (!fs) return
    if (fs.showComments) {
      setFs({ ...fs, showComments: false })
      return
    }
    setFs({ ...fs, showComments: true, loadingComments: true })
    try {
      const img = event?.images?.[fs.index]
      if (!img) return
      const comments = await apiFetch<EventImageCommentInfo[]>(
        `/api/events/${eventId}/images/${img.id}/comments`
      )
      setFs((prev) => prev ? { ...prev, comments, loadingComments: false } : null)
    } catch {
      setFs((prev) => prev ? { ...prev, loadingComments: false } : null)
    }
  }

  const handleSendComment = async () => {
    if (!fs || !user) return
    const index = fs.index
    const img = event?.images?.[index]
    if (!img || !fs.newComment.trim()) return
    setFs({ ...fs, sendingComment: true })
    try {
      const comment = await apiFetch<EventImageCommentInfo>(
        `/api/events/${eventId}/images/${img.id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: fs.newComment.trim() }),
        }
      )
      setFs((prev) => {
        if (!prev || prev.index !== index) return prev
        return { ...prev, comments: [...prev.comments, comment], newComment: '', sendingComment: false }
      })
    } catch (err: any) {
      toast({ title: err.message || '发送失败', variant: 'destructive' })
      setFs((prev) => (prev ? { ...prev, sendingComment: false } : null))
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    const index = fs?.index ?? -1
    const img = event?.images?.[index]
    if (!img) return
    try {
      await apiFetch(`/api/events/${eventId}/images/${img.id}/comments/${commentId}`, { method: 'DELETE' })
      setFs((prev) => {
        if (!prev || prev.index !== index) return prev
        return { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
      })
    } catch (err: any) {
      toast({ title: err.message || '删除失败', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">大事记不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/events')}>
          <ChevronLeft className="h-4 w-4 mr-2" />返回
        </Button>
      </div>
    )
  }

  const allImages = event.images || []

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/events')}>
          <ChevronLeft className="h-4 w-4 mr-1" />返回
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(event.eventDate), 'yyyy-MM-dd', { locale: zhCN })}
            {' · '}创建者：{event.user?.realName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCreator && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteEventTarget(true)}>
              <Trash2 className="h-4 w-4 mr-1" />删除
            </Button>
          )}
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
        <p className="whitespace-pre-wrap">{event.description}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">图片（{allImages.length}）</h2>
        {user && (
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                上传图片
              </span>
            </Button>
            <Input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUploadMore}
            />
          </label>
        )}
      </div>

      {allImages.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
          暂无图片
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-2 space-y-2">
          {allImages.map((img, i) => (
            <div
              key={img.id}
              className="relative break-inside-avoid rounded overflow-hidden bg-muted cursor-pointer group"
            >
              <Image
                src={img.thumbnailUrl || img.url}
                alt={event.title}
                width={600}
                height={450}
                className="w-full h-auto object-cover"
                loading="lazy"
                onClick={() => openFullscreen(i)}
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {img.imageType === 'MAIN' && (
                  <Badge className="text-xs bg-primary">
                    <Star className="h-2 w-2 mr-0.5" />主图
                  </Badge>
                )}
                {img.imageType === 'SUPPLEMENT' && (
                  <Badge variant="secondary" className="text-xs bg-black/50 text-white">补充</Badge>
                )}
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  className="flex items-center gap-1 p-2 min-h-[40px] rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleToggleLike(img) }}
                  disabled={togglingLike.has(img.id)}
                >
                  {togglingLike.has(img.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 ${img.liked ? 'fill-red-500 text-red-500' : ''}`} />
                  )}
                  <span>{img._count?.likes ?? 0}</span>
                </button>
              </div>
              {img.comments && img.comments.length > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 p-1 rounded-full bg-black/50 text-white text-xs">
                  <MessageCircle className="h-3 w-3" />
                  <span>{img.comments.length}</span>
                </div>
              )}
              {user && user.id === img.userId && (
                <button
                  className="absolute top-2 right-2 p-2 flex items-center justify-center min-w-[40px] min-h-[40px] rounded bg-black/50 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteImageTarget(img.id)
                  }}
                  aria-label="删除图片"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {fs !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex"
          >
            <div className="flex-1 flex items-center justify-center relative">
              <button
                className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                onClick={() => setFs(null)}
              >
                <X className="h-6 w-6" />
              </button>

              {fs.index > 0 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                  onClick={() => setFs((prev) => prev ? { ...prev, index: prev.index - 1, showComments: false, comments: [], newComment: '' } : null)}
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}

              <motion.img
                key={allImages[fs.index].id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={allImages[fs.index].url}
                alt=""
                className="max-w-full max-h-full object-contain"
              />

              {fs.index < allImages.length - 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                  onClick={() => setFs((prev) => prev ? { ...prev, index: prev.index + 1, showComments: false, comments: [], newComment: '' } : null)}
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="text-white text-sm">
                  {fs.index + 1} / {allImages.length}
                </div>
                <button
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={toggleComments}
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button
                  className="flex items-center gap-1 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={() => handleToggleLike(allImages[fs.index])}
                  disabled={togglingLike.has(allImages[fs.index].id)}
                >
                  {togglingLike.has(allImages[fs.index].id) ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={`h-5 w-5 ${allImages[fs.index].liked ? 'fill-red-500 text-red-500' : ''}`} />
                  )}
                  <span className="text-sm">{allImages[fs.index]._count?.likes ?? 0}</span>
                </button>
              </div>
            </div>

            {fs.showComments && (
              <div className="w-full sm:w-80 bg-background text-foreground flex flex-col border-l absolute sm:relative inset-0 sm:inset-auto z-10">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">评论</h3>
                  <Button variant="ghost" size="sm" onClick={() => setFs((prev) => prev ? { ...prev, showComments: false } : null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {fs.loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : fs.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">暂无评论</p>
                  ) : (
                    fs.comments.map((c) => (
                      <div key={c.id} className="flex gap-2 group">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={c.user.avatar} />
                          <AvatarFallback className="text-xs">{c.user.realName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.user.realName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(c.createdAt), 'MM-dd HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm break-words">{c.content}</p>
                        </div>
                        {user && user.id === c.userId && (
                          <button
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 p-2 flex items-center justify-center min-w-[40px] min-h-[40px]"
                            onClick={() => handleDeleteComment(c.id)}
                            aria-label="删除评论"
                          >
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {user && (
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      ref={inputRef}
                      value={fs.newComment}
                      onChange={(e) => setFs((prev) => prev ? { ...prev, newComment: e.target.value } : null)}
                      placeholder="写评论..."
                      className="h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendComment()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-9"
                      disabled={fs.sendingComment || !fs.newComment.trim()}
                      onClick={handleSendComment}
                    >
                      {fs.sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!deleteImageTarget} onOpenChange={() => setDeleteImageTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这张图片吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} disabled={deletingImage} className="bg-destructive">
              {deletingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteEventTarget} onOpenChange={setDeleteEventTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除大事记</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复，确定要删除「{event.title}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={deletingEvent} className="bg-destructive">
              {deletingEvent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
