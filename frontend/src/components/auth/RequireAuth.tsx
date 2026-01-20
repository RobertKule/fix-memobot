// src/components/auth/RequireAuth.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface RequireAuthProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'enseignant' | 'etudiant'
}

export default function RequireAuth({ 
  children, 
  requiredRole 
}: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // Rediriger vers la page de login si non authentifié
      router.push('/login')
    }
    
    if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      // Rediriger vers le dashboard si pas les permissions
      router.push('/dashboard')
    }
  }, [user, isLoading, requiredRole, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}