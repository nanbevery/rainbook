'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { DesktopNav, MobileBottomNav } from './nav'
import type { ReactNode } from 'react'

export function NavWrapper({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  const hideNav =
    loading || !user ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/admin')

  return (
    <>
      {!hideNav && <DesktopNav />}
      <main className={`flex-1 ${!hideNav ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      {!hideNav && <MobileBottomNav />}
    </>
  )
}
