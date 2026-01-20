// src/components/layout/dashboard-sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  Search, 
  Sparkles, 
  MessageSquare, 
  Brain, 
  Settings, 
  User,
  BookOpen,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  FileText,
  Heart,
  Plus,
  Clock,
  Star,
  Users,
  Download,
  Upload,
  ChevronDown,
  ChevronUp
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    sujets: true,
    outils: true,
    communaute: false
  })

  const handleLogout = () => {
    logout()
    if (onClose) onClose()
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  // Navigation organisée en groupes
  const navigationGroups = [
    {
      id: 'principal',
      title: 'Principal',
      defaultExpanded: true,
      showInCollapsed: true,
      items: [
        {
          title: 'Tableau de bord',
          icon: Home,
          href: '/dashboard',
          color: 'text-blue-600',
          description: 'Vue d\'ensemble'
        },
        {
          title: 'Recherche',
          icon: Search,
          href: '/dashboard/sujets/explore',
          color: 'text-green-600',
          description: 'Explorer les sujets'
        },
        {
          title: 'Recommandations',
          icon: Sparkles,
          href: '/dashboard/recommendations',
          color: 'text-purple-600',
          description: 'Sujets personnalisés'
        }
      ]
    },
    {
      id: 'sujets',
      title: 'Mes Sujets',
      defaultExpanded: true,
      showInCollapsed: true,
      items: [
        {
          title: 'Mes sujets',
          icon: BookOpen,
          href: '/dashboard/sujets/mes-sujets',
          color: 'text-orange-600',
          description: 'Vos sujets créés'
        },
        {
          title: 'Nouveau sujet',
          icon: Plus,
          href: '/dashboard/sujets/nouveau',
          color: 'text-green-600',
          description: 'Créer un sujet'
        },
        {
          title: 'Favoris',
          icon: Heart,
          href: '/dashboard/favoris',
          color: 'text-red-600',
          description: 'Sujets favoris'
        },
        {
          title: 'Historique',
          icon: Clock,
          href: '/dashboard/historique',
          color: 'text-yellow-600',
          description: 'Votre activité'
        }
      ]
    },
    {
      id: 'outils',
      title: 'Outils IA',
      defaultExpanded: true,
      showInCollapsed: false,
      items: [
        {
          title: 'Assistant IA',
          icon: MessageSquare,
          href: '/dashboard/chat',
          color: 'text-cyan-600',
          description: 'Chat intelligent'
        },
        {
          title: 'Générer sujets',
          icon: Sparkles,
          href: '/dashboard/sujets/generate',
          color: 'text-purple-600',
          description: 'Génération IA'
        },
        {
          title: 'Analyser sujet',
          icon: Target,
          href: '/dashboard/sujets/analyze',
          color: 'text-blue-600',
          description: 'Analyse IA'
        }
      ]
    },
    {
      id: 'communaute',
      title: 'Communauté',
      defaultExpanded: false,
      showInCollapsed: false,
      items: [
        {
          title: 'Sujets populaires',
          icon: TrendingUp,
          href: '/dashboard/community/popular',
          color: 'text-pink-600',
          description: 'Tendances'
        },
        {
          title: 'Partager',
          icon: Users,
          href: '/dashboard/community/share',
          color: 'text-teal-600',
          description: 'Partager un sujet'
        }
      ]
    }
  ]

  const settingsItems = [
    {
      title: 'Profil',
      icon: User,
      href: '/dashboard/profile',
      color: 'text-gray-600'
    },
    {
      title: 'Paramètres',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'text-gray-600'
    }
  ]

  const NavItem = ({ 
    item, 
    isCollapsed,
    showDescription = false 
  }: { 
    item: typeof navigationGroups[0]['items'][0]
    isCollapsed: boolean
    showDescription?: boolean
  }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
    
    if (isCollapsed) {
      return (
        <Link
          href={item.href}
          onClick={onClose}
          className={`relative group flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={item.title}
        >
          <div className={`p-2 rounded-lg ${item.color} ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <item.icon className="w-5 h-5" />
          </div>
          
          {/* Tooltip pour le mode réduit */}
          <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            <div className="font-medium">{item.title}</div>
            {item.description && (
              <div className="text-gray-300 text-xs mt-0.5">{item.description}</div>
            )}
          </div>
        </Link>
      )
    }

    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className={`p-2 rounded-lg ${item.color} ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <item.icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className="font-medium block">{item.title}</span>
          {showDescription && item.description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5 truncate">
              {item.description}
            </span>
          )}
        </div>
        
        {isActive && (
          <div className="w-1.5 h-6 bg-blue-600 rounded-full flex-shrink-0" />
        )}
      </Link>
    )
  }

  const NavGroup = ({ 
    group,
    isCollapsed 
  }: { 
    group: typeof navigationGroups[0]
    isCollapsed: boolean 
  }) => {
    const isExpanded = expandedGroups[group.id] !== undefined 
      ? expandedGroups[group.id] 
      : group.defaultExpanded

    if (isCollapsed && !group.showInCollapsed) {
      return null
    }

    if (isCollapsed) {
      return (
        <div className="space-y-1">
          {group.items.map((item) => (
            <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <button
          onClick={() => toggleGroup(group.id)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <span>{group.title}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        <div className={`space-y-1 transition-all duration-200 ${
          isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          {group.items.map((item) => (
            <NavItem 
              key={item.href} 
              item={item} 
              isCollapsed={isCollapsed}
              showDescription={true}
            />
          ))}
        </div>
      </div>
    )
  }

  const UserSection = ({ isCollapsed }: { isCollapsed: boolean }) => {
    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 min-w-[160px]">
              <div className="font-medium">{user?.full_name || 'Utilisateur'}</div>
              <div className="text-gray-300 text-xs">{user?.email}</div>
              <div className="text-gray-300 text-xs mt-0.5 capitalize">
                {user?.role === 'etudiant' ? 'Étudiant' : 
                 user?.role === 'enseignant' ? 'Enseignant' : 
                 user?.role === 'admin' ? 'Administrateur' : 'Membre'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="relative group p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Déconnexion
            </div>
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || 'email@exemple.com'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {user?.role === 'etudiant' ? 'Étudiant' : 
               user?.role === 'enseignant' ? 'Enseignant' : 
               user?.role === 'admin' ? 'Administrateur' : 'Membre'}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.title}</span>
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header du sidebar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  MemoBot
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assistant de recherche
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Boutons de contrôle */}
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {!isMobile && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={collapsed ? "Agrandir" : "Réduire"}
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {navigationGroups.map((group) => (
          <NavGroup 
            key={group.id}
            group={group}
            isCollapsed={collapsed}
          />
        ))}
      </div>

      {/* Footer du sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <UserSection isCollapsed={collapsed} />
      </div>
    </div>
  )
}