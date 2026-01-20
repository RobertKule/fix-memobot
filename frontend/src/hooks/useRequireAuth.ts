// src/hooks/useRequireAuth.ts
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      // Ne pas rediriger si sur une page publique
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
      const isPublicPath = publicPaths.includes(pathname)
      
      if (!isPublicPath) {
        const returnUrl = encodeURIComponent(pathname || '/dashboard')
        router.push(`/login?returnUrl=${returnUrl}`)
      }
    }
  }, [user, isLoading, router, pathname])

  return { user, isLoading }
}