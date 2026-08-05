'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LogEntry {
  id: number
  type: string
  action: string
  detail: string
  operator: string
  ip: string
  createdAt: string
}

interface PaginatedResponse {
  list: LogEntry[]
  total: number
  page: number
  pageSize: number
}

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('security')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const pageSize = 15

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        category: activeTab,
      })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const data = await apiFetch<PaginatedResponse>(`/api/admin/logs?${params}`)
      setLogs(data.list)
      setTotal(data.total)
    } catch {
      toast({ title: '获取日志失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchLogs()
  }, [activeTab, typeFilter])

  useEffect(() => {
    fetchLogs()
  }, [page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">操作日志</h1>
        <p className="text-muted-foreground mt-1">系统安全与管理员操作审计记录</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="security">安全日志</TabsTrigger>
            <TabsTrigger value="admin">管理员操作日志</TabsTrigger>
          </TabsList>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="login">登录</SelectItem>
              <SelectItem value="logout">登出</SelectItem>
              <SelectItem value="operation">操作</SelectItem>
              <SelectItem value="ban">封禁</SelectItem>
              <SelectItem value="error">异常</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全日志</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLogTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>管理员操作日志</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLogTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderLogTable() {
    if (loading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )
    }

    return (
      <>
          <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>详情</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无日志
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.type}</Badge>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {log.detail || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.operator || '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.createdAt), 'MM-dd HH:mm:ss', { locale: zhCN })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile card layout */}
          <div className="lg:hidden space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                暂无日志
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">{log.type}</Badge>
                      <span className="font-medium text-sm truncate">{log.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {format(new Date(log.createdAt), 'MM-dd HH:mm:ss', { locale: zhCN })}
                    </span>
                  </div>
                  {(log.detail || log.operator || log.ip) && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {log.detail && <div>详情：{log.detail}</div>}
                      {log.operator && <div>操作人：{log.operator}</div>}
                      {log.ip && <div className="font-mono">IP：{log.ip}</div>}
                    </div>
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
    )
  }
}
