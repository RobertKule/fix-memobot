// src/hooks/useAuthGuard.ts
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { redirectToLoginIfNotAuthenticated } from '@/lib/api'

export function useAuthGuard(requireAuth: boolean = true) {
  const pathname = usePathname()

  useEffect(() => {
    if (requireAuth && typeof window !== 'undefined') {
      // Vérifier si c'est une route protégée
      const isProtectedRoute = 
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/settings');
      
      if (isProtectedRoute) {
        redirectToLoginIfNotAuthenticated(pathname)
      }
    }
  }, [pathname, requireAuth])
}