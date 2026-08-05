'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, Trash2, ImageIcon } from 'lucide-react'

interface AdminAlbum {
  id: number
  title: string
  visibility: string
  allowSave: boolean
  coverImage: string
  createdAt: string
  creator: { id: number; realName: string; username: string }
  _count: { images: number }
}

interface PaginatedResponse {
  list: AdminAlbum[]
  total: number
  page: number
  pageSize: number
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AdminAlbum[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminAlbum | null>(null)
  const { toast } = useToast()

  const pageSize = 10

  async function fetchAlbums() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set('search', search)
      if (visibilityFilter !== 'all') params.set('visibility', visibilityFilter)
      const data = await apiFetch<PaginatedResponse>(`/api/admin/albums?${params}`)
      setAlbums(data.list)
      setTotal(data.total)
    } catch {
      toast({ title: '获取相册列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlbums()
  }, [page, search, visibilityFilter])

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await apiFetch(`/api/admin/albums/${deleteTarget.id}`, { method: 'DELETE' })
      toast({ title: '相册已删除' })
      setDeleteTarget(null)
      fetchAlbums()
    } catch {
      toast({ title: '删除失败', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">相册管理</h1>
        <p className="text-muted-foreground mt-1">管理所有用户创建的相册</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>相册列表</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-48 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题"
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <Select value={visibilityFilter} onValueChange={(v) => { setVisibilityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="可见性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="public">公开</SelectItem>
                  <SelectItem value="private">私密</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
                <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>封面</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>创建者</TableHead>
                      <TableHead>可见性</TableHead>
                      <TableHead>图片数</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albums.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                          暂无相册
                        </TableCell>
                      </TableRow>
                    ) : (
                      albums.map((album) => (
                        <TableRow key={album.id}>
                          <TableCell>
                            {album.coverImage ? (
                              <Image src={album.coverImage} alt="" width={48} height={48} className="w-12 h-12 rounded object-cover" loading="lazy" />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{album.title}</TableCell>
                          <TableCell>{album.creator?.realName}</TableCell>
                          <TableCell>
                            <Badge variant={album.visibility === 'public' ? 'default' : 'secondary'}>
                              {album.visibility === 'public' ? '公开' : '私密'}
                            </Badge>
                          </TableCell>
                          <TableCell>{album._count?.images ?? 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(album.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(album)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile card layout */}
                <div className="lg:hidden space-y-3">
                  {albums.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      暂无相册
                    </div>
                  ) : (
                    albums.map((album) => (
                      <Card key={album.id} className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {album.coverImage ? (
                            <Image src={album.coverImage} alt="" width={56} height={56} className="w-14 h-14 rounded object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-14 h-14 rounded bg-muted shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base truncate">{album.title}</div>
                            <div className="text-sm text-muted-foreground">{album.creator?.realName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <Badge variant={album.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                            {album.visibility === 'public' ? '公开' : '私密'}
                          </Badge>
                          <span className="text-muted-foreground">{album._count?.images ?? 0} 张图片</span>
                          <span className="text-muted-foreground">
                            {format(new Date(album.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                          </span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(album)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          删除
                        </Button>
                      </Card>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                          Math.max(0, page - 3),
                          Math.min(totalPages, page + 2)
                        ).map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => setPage(p)}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除相册</AlertDialogTitle>
            <AlertDialogDescription>
              删除相册 &ldquo;{deleteTarget?.title}&rdquo; 及其所有图片，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
