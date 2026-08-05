'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Users,
  CalendarDays,
  Image,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  LogIn,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const tabs = [
  { name: '同学录', href: '/', icon: Users },
  { name: '相册', href: '/albums', icon: Image },
  { name: '大事记', href: '/events', icon: CalendarDays },
  { name: '我的', href: '/me', icon: User },
]

export function DesktopNav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin')) return null
  if (loading || !user) return null

  return (
    <header className="hidden md:flex sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold text-lg mr-6">
          同学录
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link href="/settings" className="p-2 rounded-md hover:bg-accent transition-colors">
                <Settings className="h-5 w-5" />
              </Link>
              <Link href={`/user/${user.username}`} className="flex items-center gap-2 ml-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.realName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login"><LogIn className="h-4 w-4 mr-1" />登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin')) return null
  if (loading || !user) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px]">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
