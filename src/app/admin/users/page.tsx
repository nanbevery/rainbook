'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { Search, KeyRound, Trash2, UserPlus, Check, X, Users } from 'lucide-react'
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
import { Label } from '@/components/ui/label'

interface AdminUser {
  id: number
  username: string
  realName: string
  className: string
  status: string
  reviewStatus: string
  lastActiveAt: string | null
  createdAt: string
}

interface PaginatedResponse {
  list: AdminUser[]
  total: number
  page: number
  pageSize: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [resettingId, setResettingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createRealName, setCreateRealName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createClassName, setCreateClassName] = useState('')
  const [createStatus, setCreateStatus] = useState('active')
  const { toast } = useToast()

  const pageSize = 10

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set('search', search)
      const data = await apiFetch<PaginatedResponse>(`/api/admin/users?${params}`)
      setUsers(data.list)
      setTotal(data.total)
    } catch {
      toast({ title: '获取用户列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  async function toggleStatus(user: AdminUser) {
    const newStatus = user.status === 'active' ? 'disabled' : 'active'
    try {
      await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast({ title: newStatus === 'active' ? '已启用用户' : '已禁用用户' })
      fetchUsers()
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  async function resetPassword(userId: number) {
    setResettingId(userId)
    try {
      const data = await apiFetch<{ message: string; newPassword: string }>(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      toast({ title: '密码已重置', description: `新密码：${data.newPassword}` })
    } catch {
      toast({ title: '重置失败', variant: 'destructive' })
    } finally {
      setResettingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !adminPassword) {
      toast({ title: '请输入管理员密码', variant: 'destructive' })
      return
    }
    try {
      await apiFetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ adminPassword }),
      })
      toast({ title: '用户已删除' })
      setDeleteTarget(null)
      setAdminPassword('')
      fetchUsers()
    } catch {
      toast({ title: '删除失败', variant: 'destructive' })
    }
  }

  async function handleCreate() {
    if (!createRealName || !createPassword) {
      toast({ title: '姓名和密码为必填项', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          realName: createRealName,
          password: createPassword,
          className: createClassName,
          status: createStatus,
        }),
      })
      toast({ title: '用户创建成功' })
      setShowCreate(false)
      setCreateRealName('')
      setCreatePassword('')
      setCreateClassName('')
      setCreateStatus('active')
      fetchUsers()
    } catch {
      toast({ title: '创建失败', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function reviewUser(userId: number, reviewStatus: 'approved' | 'rejected') {
    try {
      await apiFetch(`/api/admin/users/${userId}/review-status`, {
        method: 'PUT',
        body: JSON.stringify({ reviewStatus }),
      })
      toast({ title: reviewStatus === 'approved' ? '已通过审核' : '已拒绝申请' })
      fetchUsers()
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-muted-foreground mt-1">管理系统注册用户</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>用户列表</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名/用户名/班级"
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <Button onClick={() => setShowCreate(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                新增用户
              </Button>
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
                      <TableHead>姓名</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>班级</TableHead>
                      <TableHead>审核状态</TableHead>
                      <TableHead>注册时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后活跃</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                          暂无用户数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const reviewLabel = user.reviewStatus === 'pending' ? '待审核' : user.reviewStatus === 'rejected' ? '已拒绝' : '已通过'
                        const reviewVariant = user.reviewStatus === 'pending' ? 'default' as const : user.reviewStatus === 'rejected' ? 'destructive' as const : 'secondary' as const
                        return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.realName}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.className}</TableCell>
                          <TableCell>
                            <Badge variant={reviewVariant}>{reviewLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.status === 'active'}
                                onCheckedChange={() => toggleStatus(user)}
                              />
                              <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                                {user.status === 'active' ? '正常' : '已禁用'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.lastActiveAt
                              ? format(new Date(user.lastActiveAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {user.reviewStatus === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() => reviewUser(user.id, 'approved')}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    通过
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={() => reviewUser(user.id, 'rejected')}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    拒绝
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resetPassword(user.id)}
                                disabled={resettingId === user.id}
                              >
                                <KeyRound className="w-3 h-3 mr-1" />
                                {resettingId === user.id ? '...' : '重置密码'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteTarget(user)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                删除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile card layout */}
                <div className="lg:hidden space-y-3">
                  {users.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      暂无用户数据
                    </div>
                  ) : (
                    users.map((user) => {
                      const reviewLabel = user.reviewStatus === 'pending' ? '待审核' : user.reviewStatus === 'rejected' ? '已拒绝' : '已通过'
                      const reviewVariant = user.reviewStatus === 'pending' ? 'default' as const : user.reviewStatus === 'rejected' ? 'destructive' as const : 'secondary' as const
                      return (
                        <Card key={user.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-base truncate">{user.realName}</div>
                              <div className="text-sm text-muted-foreground">{user.username}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Switch
                                checked={user.status === 'active'}
                                onCheckedChange={() => toggleStatus(user)}
                              />
                              <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                                {user.status === 'active' ? '正常' : '已禁用'}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">班级：</span>
                              {user.className || '-'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">审核：</span>
                              <Badge variant={reviewVariant} className="text-xs align-middle">{reviewLabel}</Badge>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">注册时间：</span>
                              {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">最后活跃：</span>
                              {user.lastActiveAt
                                ? format(new Date(user.lastActiveAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                                : '-'}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {user.reviewStatus === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 dark:text-green-500 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={() => reviewUser(user.id, 'approved')}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  通过
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 dark:text-red-500 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                  onClick={() => reviewUser(user.id, 'rejected')}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  拒绝
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetPassword(user.id)}
                              disabled={resettingId === user.id}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              {resettingId === user.id ? '...' : '重置密码'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              删除
                            </Button>
                          </div>
                        </Card>
                      )
                    })
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
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              删除用户 <strong>{deleteTarget?.realName}</strong>（{deleteTarget?.username}）及其所有相关数据，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">请输入管理员密码确认</label>
            <Input
              type="password"
              placeholder="管理员密码"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTarget(null); setAdminPassword('') }}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>填写用户信息，用户名将由系统自动生成</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="realName">真实姓名 *</Label>
              <Input
                id="realName"
                placeholder="请输入真实姓名"
                value={createRealName}
                onChange={(e) => setCreateRealName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">初始密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入初始密码"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="className">班级</Label>
              <Input
                id="className"
                placeholder="请输入班级（可选）"
                value={createClassName}
                onChange={(e) => setCreateClassName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={createStatus} onValueChange={setCreateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="disabled">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '创建中...' : '确认创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
