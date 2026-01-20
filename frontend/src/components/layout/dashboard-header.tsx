// src/components/layout/dashboard-header.tsx
'use client'

import { Settings, LogOut } from 'lucide-react'
import { Menu, Search, Bell, User, MessageSquare, Shield, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3) // Exemple : 3 notifications non lues
  const { user, logout } = useAuth()
  const router = useRouter()

  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
  }

  const handleNotificationsClick = () => {
    router.push('/dashboard/notifications')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16">
      <div className="h-full px-4 sm:px-6">
        <div className="h-full flex items-center justify-between">
          {/* Gauche : Logo et menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">MemoBot</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assistant IA</p>
              </div>
            </Link>
          </div>

          {/* Centre : Barre de recherche */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher des sujets, utilisateurs..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Droite : Actions */}
          <div className="flex items-center gap-3">
            {/* Barre de recherche mobile */}
            <button 
              onClick={() => router.push('/dashboard/search')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Bouton Admin (seulement pour les admins) */}
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}

            <ThemeToggle />
            
            {/* Notifications avec badge */}
            <button 
              onClick={handleNotificationsClick}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative group"
            >
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                </>
              )}
              
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {notificationCount > 0 
                  ? `${notificationCount} notification(s)` 
                  : 'Aucune notification'}
              </div>
            </button>
            
            {/* Menu utilisateur */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-800">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.full_name.split(' ')[0] || 'Utilisateur'}
                    </p>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role === 'etudiant' ? 'Étudiant' : 
                     user?.role === 'enseignant' ? 'Enseignant' : 
                     user?.role === 'admin' ? 'Administrateur' : ''}
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden"
                  >
                    {/* En-tête du menu */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.full_name || 'Utilisateur'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'email@exemple.com'}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          isAdmin 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : user?.role === 'enseignant'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {isAdmin ? 'Admin' : 
                           user?.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Liens principaux */}
                    <div className="py-2">
                      <Link 
                        href="/dashboard/profile" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Mon profil</span>
                      </Link>
                      
                      <Link 
                        href="/dashboard/settings" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Paramètres</span>
                      </Link>

                      {/* Lien Admin (seulement pour les admins) */}
                      {isAdmin && (
                        <Link 
                          href="/dashboard/admin" 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Administration</span>
                        </Link>
                      )}
                    </div>
                    
                    {/* Séparateur et déconnexion */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
