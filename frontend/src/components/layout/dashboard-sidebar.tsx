'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home,
  Search,
  BookOpen,
  Plus,
  Heart,
  Clock,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  Share2,
  User,
  Settings,
  Brain,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface DashboardSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
  isMobile: boolean
}

export default function DashboardSidebar({ 
  collapsed, 
  onToggleCollapse, 
  onClose,
  isMobile 
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    if (onClose) onClose()
  }

  // Navigation complète en une seule liste
  const navItems = [
    // Principal
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      order: 1
    },
    // Sujets
    {
      id: 'explore',
      title: 'Explorer',
      icon: Search,
      href: '/dashboard/sujets/explore',
      color: 'text-green-600',
      order: 2
    },
    // {
    //   id: 'mes-sujets',
    //   title: 'Mes sujets',
    //   icon: BookOpen,
    //   href: '/dashboard/sujets/mes-sujets',
    //   color: 'text-orange-600',
    //   order: 3
    // },
    {
      id: 'nouveau',
      title: 'Nouveau sujet',
      icon: Plus,
      href: '/dashboard/sujets/nouveau',
      color: 'text-green-600',
      order: 4
    },
    // {
    //   id: 'favoris',
    //   title: 'Favoris',
    //   icon: Heart,
    //   href: '/dashboard/favoris',
    //   color: 'text-red-600',
    //   order: 5
    // },
    {
      id: 'historique',
      title: 'Historique',
      icon: Clock,
      href: '/dashboard/historique',
      color: 'text-yellow-600',
      order: 6
    },
    // IA
    {
      id: 'chat',
      title: 'Assistant IA',
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'text-cyan-600',
      order: 7
    },
    {
      id: 'recommendations',
      title: 'Recommandations',
      icon: Sparkles,
      href: '/dashboard/recommendations',
      color: 'text-purple-600',
      order: 8
    },
    {
      id: 'analyze',
      title: 'Analyse IA',
      icon: Zap,
      href: '/dashboard/ai/analyze',
      color: 'text-purple-500',
      order: 9
    },
    // Communauté
    {
      id: 'popular',
      title: 'Populaires',
      icon: TrendingUp,
      href: '/dashboard/community/popular',
      color: 'text-pink-600',
      order: 10
    },
    {
      id: 'share',
      title: 'Partager',
      icon: Share2,
      href: '/dashboard/community/share',
      color: 'text-teal-600',
      order: 11
    }
  ]

  const settingsItems = [
    {
      title: 'Profil',
      icon: User,
      href: '/dashboard/profile'
    },
    {
      title: 'Paramètres',
      icon: Settings,
      href: '/dashboard/settings'
    }
  ]

  // Composant pour les items en mode réduit
  const CollapsedNavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
    
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="relative group"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className={`
          flex items-center justify-center p-3 my-0.5 rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}>
          <item.icon className="w-5 h-5" />
        </div>
        
        {/* Tooltip latéral */}
        <div className={`
          absolute left-full ml-2 top-1/2 transform -translate-y-1/2
          px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl
          opacity-0 transition-all duration-200 pointer-events-none z-50
          ${hoveredItem === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
          whitespace-nowrap min-w-[140px]
        `}>
          <div className="font-semibold">{item.title}</div>
          {item.id === 'dashboard' && (
            <div className="text-gray-300 text-xs mt-1">Vue d'ensemble</div>
          )}
        </div>
      </Link>
    )
  }

  // Composant pour les items en mode étendu
  const ExpandedNavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
    
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`
          flex items-center gap-3 px-3 py-2 my-0.5 rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <div className={`
          p-1.5 rounded-lg
          ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}
        `}>
          <item.icon className="w-4 h-4" />
        </div>
        
        <span className="text-sm font-medium">{item.title}</span>
      </Link>
    )
  }

  // Composant pour le tableau de bord (spécial)
  const DashboardItem = ({ collapsed }: { collapsed: boolean }) => {
    const isActive = pathname === '/dashboard'
    
    if (collapsed) {
      return (
        <div className="relative group mb-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            onMouseEnter={() => setHoveredItem('dashboard-main')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className={`
              flex items-center justify-center p-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600'
              }
            `}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            
            <div className={`
              absolute left-full ml-2 top-1/2 transform -translate-y-1/2
              px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl
              opacity-0 transition-all duration-200 pointer-events-none z-50
              ${hoveredItem === 'dashboard-main' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              whitespace-nowrap min-w-[140px]
            `}>
              <div className="font-semibold">Tableau de bord</div>
              <div className="text-gray-300 text-xs mt-1">Vue d'ensemble</div>
            </div>
          </Link>
        </div>
      )
    }

    return (
      <Link
        href="/dashboard"
        onClick={onClose}
        className={`
          flex items-center gap-3 px-3 py-3 mb-2 rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-gray-800 dark:to-gray-800 border border-blue-500 border-0 border-l-4 text-white shadow-lg' 
            : 'bg-gradient-to-br from-blue-400 to-blue-500 dark:from-gray-900 dark:to-gray-900 text-white hover:from-blue-500 hover:to-blue-600'
          }
        `}
      >
        <div className="p-1.5 bg-white/20 rounded-lg">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold">Tableau de bord</span>
          <div className="text-white/80 text-xs mt-0.5">Vue d'ensemble</div>
        </div>
      </Link>
    )
  }

  // Section utilisateur
  const UserSection = ({ collapsed }: { collapsed: boolean }) => {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center space-y-3 overflow-hidden">
          {/* Avatar */}
          <div 
            className="relative group"
            onMouseEnter={() => setHoveredItem('user-profile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all"
            >
              <User className="w-4 h-4 text-white" />
            </Link>
            
            {/* Tooltip utilisateur */}
            <div className={`
              absolute left-full ml-2 top-1/2 transform -translate-y-1/2
              px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl
              opacity-0 transition-all duration-200 pointer-events-none z-50
              ${hoveredItem === 'user-profile' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              whitespace-nowrap min-w-[180px]
            `}>
              <div className="font-semibold">{user?.full_name || 'Utilisateur'}</div>
              <div className="text-gray-300 text-xs mt-1">{user?.email}</div>
            </div>
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Carte utilisateur */}
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </Link>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4 mb-1" />
            <span className="text-xs">Paramètres</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4 mb-1" />
            <span className="text-xs">Déconnexion</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header super compact */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                MemoBot
              </span>
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <Link href="/dashboard">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={collapsed ? "Étendre" : "Réduire"}
            >
              {collapsed ? (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronLeft className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {/* Tableau de bord (toujours en premier) */}
        <DashboardItem collapsed={collapsed} />

        {/* Autres items */}
        {collapsed ? (
          <div className="space-y-0.5">
            {navItems
              .filter(item => item.id !== 'dashboard')
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <CollapsedNavItem key={item.id} item={item} />
              ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {navItems
              .filter(item => item.id !== 'dashboard')
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <ExpandedNavItem key={item.id} item={item} />
              ))}
          </div>
        )}
      </div>

      {/* Footer utilisateur */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <UserSection collapsed={collapsed} />
      </div>
    </div>
  )
}