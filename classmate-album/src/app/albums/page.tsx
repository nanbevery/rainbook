'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Plus, Image as ImageIcon, Loader2, Lock } from 'lucide-react'

interface AlbumInfo {
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
  _count: {
    images: number
  }
}

function AlbumCardSkeleton() {
  return (
    <Card>
      <Skeleton className="w-full aspect-[4/3]" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function AlbumsPage() {
  const { user } = useAuth()
  const [albums, setAlbums] = useState<AlbumInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowSave, setAllowSave] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchAlbums = useCallback(async () => {
    try {
      const data = await apiFetch<AlbumInfo[]>('/api/albums')
      setAlbums(data || [])
    } catch {
      toast({ title: '加载相册列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: '请输入相册标题', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await apiFetch('/api/albums', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          visibility: isPrivate ? 'private' : 'public',
          allowSave,
        }),
      })
      toast({ title: '相册创建成功' })
      setShowCreate(false)
      setTitle('')
      setDescription('')
      setIsPrivate(false)
      setAllowSave(true)
      fetchAlbums()
    } catch (err: any) {
      toast({ title: err.message || '创建失败', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">同学相册</h1>
        {user && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />创建相册
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建相册</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标题 *</label>
                  <Input
                    placeholder="相册标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <Textarea
                    placeholder="相册描述"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">私密相册</label>
                    <p className="text-xs text-muted-foreground">仅自己可见</p>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">允许他人保存</label>
                    <p className="text-xs text-muted-foreground">允许其他人保存图片</p>
                  </div>
                  <Switch
                    checked={allowSave}
                    onCheckedChange={setAllowSave}
                  />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
          暂无相册
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {albums.map((album) => (
            <Link key={album.id} href={`/albums/${album.id}`}>
              <Card className="hover:shadow-md transition-shadow duration-200 h-full overflow-hidden group">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {album.coverImage ? (
                    <Image
                      src={album.coverImage}
                      alt={album.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                  {album.visibility === 'private' && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                        <Lock className="h-3 w-3 mr-0.5" />私密
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {album._count.images}张
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate">{album.title}</h3>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span className="truncate">{album.creator.realName}</span>
                    <span className="shrink-0 ml-2">
                      <ImageIcon className="h-3 w-3 inline mr-0.5" />
                      {album._count.images}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
