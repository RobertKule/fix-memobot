// src/components/auth/ClientAuthGuard.tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('access_token')
    const isDashboardRoute = pathname?.startsWith('/dashboard')
    
    if (isDashboardRoute && !token) {
      console.log('No token found for dashboard route, redirecting to login')
      const returnUrl = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [pathname, router])

  return <>{children}</>
}