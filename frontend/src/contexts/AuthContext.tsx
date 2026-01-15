// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, User } from '@/lib/api'

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

  /**
   * 🔐 Initialisation de l'auth (1 seule fois)
   */
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
  if (mounted) {
    setUser(null)
    setIsLoading(false) // 👈 MANQUAIT ICI
  }
  return
}


        const userData = await api.getCurrentUser()
        if (mounted) setUser(userData)

      } catch (error) {
        localStorage.removeItem('access_token')
        if (mounted) setUser(null)

      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [])

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

      return userData

    } catch (error: any) {
      localStorage.removeItem('access_token')
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

      return userData

    } catch (error: any) {
      throw new Error(error.message || 'Échec de l’inscription')

    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 🚪 LOGOUT
   */
  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
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
