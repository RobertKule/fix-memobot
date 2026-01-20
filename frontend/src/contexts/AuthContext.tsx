// src/contexts/AuthContext.tsx - VERSION CORRIGÉE
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, User } from '@/lib/api'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: {
    email: string
    full_name: string
    password: string
    role: 'etudiant' | 'enseignant' | 'admin'
  }) => Promise<User>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Fonction pour nettoyer le storage
  const clearAuthStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_preferences')
    }
  }

  // Fonction pour rediriger vers login
  const redirectToLogin = useCallback(() => {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/explore',  // Ajoutez ici les routes publiques
      '/about',
      '/contact'
    ]

    // Vérifier si le path actuel est public
    const isPublicPath = publicPaths.some(path =>
      pathname === path ||
      (path !== '/' && pathname?.startsWith(path))
    )

    // Ne rediriger que si on est sur une page protégée et non connecté
    if (!isPublicPath && typeof window !== 'undefined') {
      // Stocker l'URL actuelle pour rediriger après login
      const returnUrl = pathname || '/dashboard'
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [pathname, router])

  // Fonction pour vérifier et rediriger si non authentifié
  const checkAndRedirect = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('access_token')
    const isDashboardRoute = pathname?.startsWith('/dashboard')
    
    if (!token && isDashboardRoute) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname || '/dashboard')}`)
    }
  }, [pathname, router])

  /**
   * 🔐 Initialisation de l'auth
   */
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        // Vérifier d'abord si on est sur une page dashboard sans token
        const token = localStorage.getItem('access_token')
        const isDashboardRoute = pathname?.startsWith('/dashboard')

        if (!token && isDashboardRoute) {
          if (mounted) {
            setUser(null)
            setIsLoading(false)
          }
          redirectToLogin()
          return
        }

        if (!token) {
          // Pas de token mais pas sur dashboard, on laisse passer
          if (mounted) {
            setUser(null)
            setIsLoading(false)
          }
          return
        }

        // Tenter de récupérer l'utilisateur
        const userData = await api.getCurrentUser()

        if (mounted) {
          setUser(userData)
          setIsLoading(false)
        }

      } catch (error: any) {
        console.error('Auth initialization error:', error)

        // Gérer spécifiquement les erreurs 401
        if (error?.isUnauthorized || error?.status === 401 || error?.message?.includes('Session expirée')) {
          clearAuthStorage()

          if (mounted) {
            setUser(null)
            setIsLoading(false)
          }

          // Afficher un message à l'utilisateur
          if (typeof window !== 'undefined') {
            // Vous pourriez utiliser un toast ici
            console.log('Session expirée, redirection vers login')
          }

          redirectToLogin()
        } else {
          // Pour les autres erreurs, continuer avec l'utilisateur actuel
          if (mounted) {
            setIsLoading(false)
          }
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [pathname, router, redirectToLogin])

  // Vérifier l'authentification à chaque changement de route
  useEffect(() => {
    if (!isLoading && pathname) {
      checkAndRedirect()
    }
  }, [pathname, isLoading, checkAndRedirect])

  /**
   * 🔑 LOGIN
   */
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true)

    try {
      const response = await api.login(email, password)

      if (!response?.access_token) {
        throw new Error('No access token received')
      }

      localStorage.setItem('access_token', response.access_token)

      const userData = await api.getCurrentUser()
      setUser(userData)

      // Rediriger après connexion réussie
      router.push('/dashboard')

      return userData

    } catch (error: any) {
      clearAuthStorage()
      setUser(null)
      throw new Error(error.message || 'Échec de la connexion')

    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 📝 REGISTER
   */
  const register = async (data: {
    email: string
    full_name: string
    password: string
    role: 'etudiant' | 'enseignant' | 'admin'
  }): Promise<User> => {
    setIsLoading(true)

    try {
      await api.register(data)

      const loginResponse = await api.login(data.email, data.password)

      if (!loginResponse?.access_token) {
        throw new Error('No access token after registration')
      }

      localStorage.setItem('access_token', loginResponse.access_token)

      const userData = await api.getCurrentUser()
      setUser(userData)

      // Rediriger après inscription réussie
      router.push('/dashboard')

      return userData

    } catch (error: any) {
      throw new Error(error.message || 'Échec de l\'inscription')

    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 🚪 LOGOUT
   */
  const logout = () => {
    clearAuthStorage()
    setUser(null)
    setIsLoading(false)
    router.replace('/login')
  }

  /**
   * 🔄 UPDATE USER
   */
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}