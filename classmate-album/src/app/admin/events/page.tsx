'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { ClassEventInfo } from '@/types'

export default function EventsPage() {
  const [events, setEvents] = useState<ClassEventInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ClassEventInfo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClassEventInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const pageSize = 10

  const [form, setForm] = useState({ title: '', description: '', eventDate: '' })

  async function fetchEvents() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const data = await apiFetch<{ list: ClassEventInfo[]; total: number }>(`/api/admin/events?${params}`)
      setEvents(data.list || [])
      setTotal(data.total || 0)
    } catch {
      toast({ title: '获取大事记列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [page])

  function openCreate() {
    setEditingEvent(null)
    setForm({ title: '', description: '', eventDate: format(new Date(), 'yyyy-MM-dd') })
    setDialogOpen(true)
  }

  function openEdit(event: ClassEventInfo) {
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate ? format(new Date(event.eventDate), 'yyyy-MM-dd') : '',
    })
    setDialogOpen(true)
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      toast({ title: '请输入标题', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editingEvent) {
        await apiFetch(`/api/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        toast({ title: '更新成功' })
      } else {
        await apiFetch('/api/admin/events', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        toast({ title: '新增成功' })
      }
      setDialogOpen(false)
      fetchEvents()
    } catch {
      toast({ title: '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent() {
    if (!deleteTarget) return
    try {
      await apiFetch(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' })
      toast({ title: '已删除' })
      setDeleteTarget(null)
      fetchEvents()
    } catch {
      toast({ title: '删除失败', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">大事记管理</h1>
          <p className="text-muted-foreground mt-1">管理班级大事记内容</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          新增大事记
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>大事记列表</CardTitle>
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
                      <TableHead>标题</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>事件日期</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          暂无大事记
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {event.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {event.eventDate
                              ? format(new Date(event.eventDate), 'yyyy-MM-dd', { locale: zhCN })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(event.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                                <Pencil className="w-3 h-3 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(event)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                删除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile card layout */}
                <div className="lg:hidden space-y-3">
                  {events.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20">
                      暂无大事记
                    </div>
                  ) : (
                    events.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-base min-w-0 flex-1">{event.title}</div>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span>
                            {event.eventDate
                              ? format(new Date(event.eventDate), 'yyyy-MM-dd', { locale: zhCN })
                              : '-'}
                          </span>
                          <span>
                            {format(new Date(event.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(event)}>
                            <Pencil className="w-3 h-3 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? '编辑大事记' : '新增大事记'}</DialogTitle>
            <DialogDescription>填写大事记信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="大事记标题"
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="大事记描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>事件日期</Label>
              <DatePicker
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={saveEvent} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除大事记「{deleteTarget?.title}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
