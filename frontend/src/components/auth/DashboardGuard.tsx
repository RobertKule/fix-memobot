// src/components/auth/DashboardGuard.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface DashboardGuardProps {
  children: React.ReactNode
}

export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Vérifier si on est sur une page dashboard
    const isDashboardRoute = pathname?.startsWith('/dashboard')

    if (!isLoading && isDashboardRoute) {
      // Si pas d'utilisateur, rediriger vers login
      if (!user) {
        // Nettoyer le localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
        }
        
        // Rediriger vers login avec l'URL de retour
        const returnUrl = encodeURIComponent(pathname || '/dashboard')
        router.push(`/login?returnUrl=${returnUrl}`)
      }
    }
  }, [user, isLoading, router, pathname])

  // Afficher un loader pendant le chargement
  if (isLoading && pathname?.startsWith('/dashboard')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  // Si pas d'utilisateur sur une page dashboard, ne rien afficher
  if (!user && pathname?.startsWith('/dashboard')) {
    return null
  }

  return <>{children}</>
}