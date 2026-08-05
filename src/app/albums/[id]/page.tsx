'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch, apiUpload } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  Lock,
  Star,
  Edit3,
} from 'lucide-react'

interface AlbumImageInfo {
  id: number
  url: string
  uploaderId: number
  createdAt: string
  uploader: {
    id: number
    username: string
    realName: string
    avatar: string
  }
}

interface AlbumDetailInfo {
  id: number
  title: string
  description: string
  coverImage: string
  visibility: string
  allowSave: boolean
  creatorId: number
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    username: string
    realName: string
    avatar: string
  }
  images: AlbumImageInfo[]
}

export default function AlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const albumId = Number(params.id)

  const [album, setAlbum] = useState<AlbumDetailInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)

  const [deleteImageTarget, setDeleteImageTarget] = useState<number | null>(null)
  const [deletingImage, setDeletingImage] = useState(false)

  const [deleteAlbumTarget, setDeleteAlbumTarget] = useState(false)
  const [deletingAlbum, setDeletingAlbum] = useState(false)

  const [showEdit, setShowEdit] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editAllowSave, setEditAllowSave] = useState(true)
  const [editing, setEditing] = useState(false)

  const isCreator = album && user?.id === album.creatorId
  const canUpload = user && (album?.visibility === 'public' || isCreator)

  const fetchAlbum = useCallback(async () => {
    try {
      const data = await apiFetch<AlbumDetailInfo>(`/api/albums/${albumId}`)
      setAlbum(data)
    } catch {
      toast({ title: '加载相册失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [albumId])

  useEffect(() => {
    fetchAlbum()
  }, [fetchAlbum])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      const uploadResult = await apiUpload<{ url: string }>('/api/upload', uploadFormData)

      await apiFetch(`/api/albums/${albumId}/images`, {
        method: 'POST',
        body: JSON.stringify({ url: uploadResult.url }),
      })

      toast({ title: '上传成功' })
      fetchAlbum()
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
      await apiFetch(`/api/albums/${albumId}/images/${deleteImageTarget}`, { method: 'DELETE' })
      toast({ title: '图片已删除' })
      fetchAlbum()
      setDeleteImageTarget(null)
      if (fullscreenIndex !== null) setFullscreenIndex(null)
    } catch (err: any) {
      toast({ title: err.message || '删除失败', variant: 'destructive' })
    } finally {
      setDeletingImage(false)
    }
  }

  const handleDeleteAlbum = async () => {
    setDeletingAlbum(true)
    try {
      await apiFetch(`/api/albums/${albumId}`, { method: 'DELETE' })
      toast({ title: '相册已删除' })
      router.push('/albums')
    } catch (err: any) {
      toast({ title: err.message || '删除失败', variant: 'destructive' })
    } finally {
      setDeletingAlbum(false)
    }
  }

  const handleSetCover = async (imageUrl: string) => {
    try {
      await apiFetch(`/api/albums/${albumId}/cover`, {
        method: 'PUT',
        body: JSON.stringify({ imageUrl }),
      })
      toast({ title: '封面设置成功' })
      fetchAlbum()
    } catch (err: any) {
      toast({ title: err.message || '设置封面失败', variant: 'destructive' })
    }
  }

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      toast({ title: '请输入相册标题', variant: 'destructive' })
      return
    }
    setEditing(true)
    try {
      await apiFetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          visibility: editIsPrivate ? 'private' : 'public',
          allowSave: editAllowSave,
        }),
      })
      toast({ title: '更新成功' })
      setShowEdit(false)
      fetchAlbum()
    } catch (err: any) {
      toast({ title: err.message || '更新失败', variant: 'destructive' })
    } finally {
      setEditing(false)
    }
  }

  const openEditDialog = () => {
    if (!album) return
    setEditTitle(album.title)
    setEditDescription(album.description)
    setEditIsPrivate(album.visibility === 'private')
    setEditAllowSave(album.allowSave)
    setShowEdit(true)
  }

  if (loading) {
    return (
      <div className="container py-6 max-w-5xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">相册不存在或无权访问</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/albums')}>
          <ChevronLeft className="h-4 w-4 mr-2" />返回相册列表
        </Button>
      </div>
    )
  }

  const allImages = album.images || []

  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/albums')}>
          <ChevronLeft className="h-4 w-4 mr-1" />返回
        </Button>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{album.title}</h1>
            {album.visibility === 'private' && (
              <Badge variant="secondary"><Lock className="h-3 w-3 mr-0.5" />私密</Badge>
            )}
          </div>
          {album.description && (
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{album.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={album.creator.avatar} />
              <AvatarFallback>{album.creator.realName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{album.creator.realName}</span>
          </div>
        </div>
        {isCreator && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Edit3 className="h-4 w-4 mr-1" />编辑
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteAlbumTarget(true)}>
              <Trash2 className="h-4 w-4 mr-1" />删除
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">图片（{allImages.length}）</h2>
        {canUpload && (
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
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        )}
      </div>

      {allImages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto opacity-40 mb-4" />
          <p>暂无图片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allImages.map((img, i) => (
            <div
              key={img.id}
              className="relative break-inside-avoid rounded overflow-hidden bg-muted cursor-pointer group aspect-square"
              onClick={() => setFullscreenIndex(i)}
            >
              <Image
                src={img.url}
                alt={album.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
              {album.coverImage === img.url && (
                <div className="absolute top-2 left-2">
                  <Badge className="text-xs bg-primary">
                    <Star className="h-3 w-3 mr-0.5" />封面
                  </Badge>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{img.uploader.realName}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {(user?.id === img.uploaderId || isCreator) && (
                  <button
                    className="p-2 flex items-center justify-center min-w-[40px] min-h-[40px] rounded bg-black/50 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteImageTarget(img.id)
                    }}
                    aria-label="删除图片"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {isCreator && (
                  <button
                    className="p-2 flex items-center justify-center min-w-[40px] min-h-[40px] rounded bg-black/50 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetCover(img.url)
                    }}
                    aria-label="设为封面"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {fullscreenIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
              onClick={() => setFullscreenIndex(null)}
            >
              <X className="h-6 w-6" />
            </button>

            {fullscreenIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                onClick={() => setFullscreenIndex(fullscreenIndex - 1)}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            <motion.img
              key={allImages[fullscreenIndex].id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={allImages[fullscreenIndex].url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />

            {fullscreenIndex < allImages.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                onClick={() => setFullscreenIndex(fullscreenIndex + 1)}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            <div className="absolute bottom-6 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
              {fullscreenIndex + 1} / {allImages.length}
            </div>
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

      <AlertDialog open={deleteAlbumTarget} onOpenChange={setDeleteAlbumTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除相册</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复，确定要删除「{album.title}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAlbum} disabled={deletingAlbum} className="bg-destructive">
              {deletingAlbum ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑相册</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标题 *</label>
              <Input
                placeholder="相册标题"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Textarea
                placeholder="相册描述"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">私密相册</label>
                <p className="text-xs text-muted-foreground">仅自己可见</p>
              </div>
              <Switch checked={editIsPrivate} onCheckedChange={setEditIsPrivate} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">允许他人保存</label>
                <p className="text-xs text-muted-foreground">允许其他人保存图片</p>
              </div>
              <Switch checked={editAllowSave} onCheckedChange={setEditAllowSave} />
            </div>
            <Button onClick={handleEdit} disabled={editing} className="w-full">
              {editing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
