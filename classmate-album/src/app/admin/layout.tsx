'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/toaster'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Images,
  Calendar,
  Settings,
  Database,
  Shield,
  FileSearch,
  Bell,
  Menu,
  LogOut,
  User,
  Mail,
} from 'lucide-react'

const menuItems = [
  { href: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/albums', label: '相册管理', icon: Images },
  { href: '/admin/events', label: '大事记', icon: Calendar },
  { href: '/admin/smtp', label: '邮件配置', icon: Mail },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
  { href: '/admin/cache', label: '缓存管理', icon: Database },
  { href: '/admin/security', label: '安全管理', icon: Shield },
  { href: '/admin/logs', label: '操作日志', icon: FileSearch },
  { href: '/admin/notifications', label: '消息推送', icon: Bell },
]

function SidebarContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Shield className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg">管理后台</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.push('/admin/login')
    }
  }, [admin, loading, isLoginPage, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      <Toaster />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-background z-30 overflow-y-auto">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-8 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent pathname={pathname} onNav={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-semibold">
              {menuItems.find((m) => m.href === pathname)?.label || '管理后台'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[60px] sm:max-w-[80px] lg:max-w-[120px]">{admin.username}</span>
              <span className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary">
                {admin.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout()
                router.push('/admin/login')
              }}
            >
              <LogOut className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
