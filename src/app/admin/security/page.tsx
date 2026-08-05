'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Ban, Plus, Unlock, Shield } from 'lucide-react'

interface IpBan {
  id: number
  ip: string
  reason: string
  type: 'manual' | 'auto'
  bannedAt: string
  expiresAt: string | null
  isActive: boolean
}

interface PaginatedResponse {
  list: IpBan[]
  total: number
  page: number
  pageSize: number
}

export default function SecurityPage() {
  const [bans, setBans] = useState<IpBan[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [banForm, setBanForm] = useState({ ip: '', duration: 60, reason: '' })
  const [banning, setBanning] = useState(false)
  const { toast } = useToast()

  const pageSize = 10

  async function fetchBans() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const data = await apiFetch<PaginatedResponse>(`/api/admin/security/bans?${params}`)
      setBans(data.list)
      setTotal(data.total)
    } catch {
      toast({ title: '获取封禁列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBans()
  }, [page])

  async function banIp() {
    if (!banForm.ip.trim()) {
      toast({ title: '请输入 IP 地址', variant: 'destructive' })
      return
    }
    setBanning(true)
    try {
      await apiFetch('/api/admin/security/ban', {
        method: 'POST',
        body: JSON.stringify(banForm),
      })
      toast({ title: '封禁成功' })
      setDialogOpen(false)
      setBanForm({ ip: '', duration: 60, reason: '' })
      fetchBans()
    } catch {
      toast({ title: '封禁失败', variant: 'destructive' })
    } finally {
      setBanning(false)
    }
  }

  async function unban(id: number) {
    try {
      await apiFetch(`/api/admin/security/unban/${id}`, { method: 'POST' })
      toast({ title: '已解封' })
      fetchBans()
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">安全管理</h1>
          <p className="text-muted-foreground mt-1">IP 黑名单管理</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Ban className="w-4 h-4 mr-1" />
          手动封禁
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">自动封禁规则</CardTitle>
              <CardDescription className="mt-1">
                系统会自动监控异常请求行为。当同一 IP 在短时间内频繁触发速率限制或认证失败时，
                将被自动加入黑名单。封禁时长可在「系统设置」中配置。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP 黑名单</CardTitle>
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
                      <TableHead>IP 地址</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead>封禁时间</TableHead>
                      <TableHead>过期时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          暂无封禁记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      bans.map((ban) => (
                        <TableRow key={ban.id}>
                          <TableCell className="font-mono text-sm">{ban.ip}</TableCell>
                          <TableCell>
                            <Badge variant={ban.type === 'auto' ? 'secondary' : 'default'}>
                              {ban.type === 'auto' ? '自动' : '手动'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {ban.reason || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(ban.bannedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ban.expiresAt
                              ? format(new Date(ban.expiresAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                              : '永久'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ban.isActive ? 'destructive' : 'secondary'}>
                              {ban.isActive ? '封禁中' : '已过期'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {ban.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 dark:text-green-500 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => unban(ban.id)}
                              >
                                <Unlock className="w-3 h-3 mr-1" />
                                解封
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile card layout */}
                <div className="lg:hidden space-y-3">
                  {bans.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20">
                      暂无封禁记录
                    </div>
                  ) : (
                    bans.map((ban) => (
                      <Card key={ban.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-mono font-semibold text-base">{ban.ip}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">{ban.reason || '无原因'}</div>
                          </div>
                          <Badge variant={ban.isActive ? 'destructive' : 'secondary'} className="shrink-0">
                            {ban.isActive ? '封禁中' : '已过期'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">类型：</span>
                            <Badge variant={ban.type === 'auto' ? 'secondary' : 'default'} className="text-xs align-middle">
                              {ban.type === 'auto' ? '自动' : '手动'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">封禁时间：</span>
                            {format(new Date(ban.bannedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">过期时间：</span>
                            {ban.expiresAt
                              ? format(new Date(ban.expiresAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                              : '永久'}
                          </div>
                        </div>
                        {ban.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 dark:text-green-500 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => unban(ban.id)}
                          >
                            <Unlock className="w-3 h-3 mr-1" />
                            解封
                          </Button>
                        )}
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
            <DialogTitle>手动封禁 IP</DialogTitle>
            <DialogDescription>填写要封禁的 IP 地址和相关信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>IP 地址</Label>
              <Input
                placeholder="例如：192.168.1.100"
                value={banForm.ip}
                onChange={(e) => setBanForm({ ...banForm, ip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>封禁时长</Label>
              <Select
                value={String(banForm.duration)}
                onValueChange={(v) => setBanForm({ ...banForm, duration: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 分钟</SelectItem>
                  <SelectItem value="30">30 分钟</SelectItem>
                  <SelectItem value="60">1 小时</SelectItem>
                  <SelectItem value="360">6 小时</SelectItem>
                  <SelectItem value="1440">24 小时</SelectItem>
                  <SelectItem value="10080">7 天</SelectItem>
                  <SelectItem value="-1">永久</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Textarea
                placeholder="封禁原因（可选）"
                value={banForm.reason}
                onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={banIp} disabled={banning}>
              {banning ? '封禁中...' : '确认封禁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
