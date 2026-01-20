// src/hooks/useDashboardAuth.ts
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export function useDashboardAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // S'assurer qu'on est côté client
    if (typeof window === 'undefined') return

    // Vérifier le token dans localStorage
    const token = localStorage.getItem('access_token')
    
    if (!token && pathname?.startsWith('/dashboard')) {
      // Rediriger immédiatement sans attendre le contexte
      const returnUrl = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [router, pathname])

  useEffect(() => {
    if (!isLoading && !user && pathname?.startsWith('/dashboard')) {
      // Double vérification via le contexte auth
      const returnUrl = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [user, isLoading, router, pathname])

  return { user, isLoading }
}