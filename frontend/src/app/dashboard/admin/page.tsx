// src/app/dashboard/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  FileText,
  Settings,
  Shield,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Server,
  Cpu,
  HardDrive,
  Clock,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ExternalLink,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldOff,
  Archive,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Brain,
  Zap,
  Terminal,
  Database as DatabaseIcon,
  Cloud,
  Target,
  TrendingUp,
  Award,
  Plus
} from 'lucide-react'
import { api, User, Sujet } from '@/lib/api'
import { toast } from 'sonner'

// Types
interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSujets: number
  aiAnalyses: number
  storageUsage: number
  apiCalls: number
  systemHealth: number
}

interface RecentActivity {
  id: number
  type: 'user' | 'sujet' | 'ai' | 'system' | 'feedback' | 'chat'
  action: string
  user: string
  timestamp: string
  icon: React.ReactNode
  color: string
}

interface PaginationData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Modals
interface ConfirmModalData {
  title: string
  message: string
  action: () => Promise<void>
  type: 'delete' | 'deactivate' | 'activate' | 'promote' | 'demote' | 'reset'
}

// Système de santé
interface SystemHealth {
  database: boolean
  aiService: boolean
  api: boolean
  storage: boolean
  cache: boolean
  backups: boolean
}

export default function AdminDashboardPage() {
  // États principaux
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSujets: 0,
    aiAnalyses: 0,
    storageUsage: 0,
    apiCalls: 0,
    systemHealth: 100
  })

  const [users, setUsers] = useState<PaginationData<User>>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  })

  const [sujets, setSujets] = useState<PaginationData<Sujet>>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  })

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'sujets' | 'system' | 'ai' | 'analytics'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'admin' | 'enseignant' | 'etudiant'>('all')
  const [sujetFilter, setSujetFilter] = useState<'all' | 'active' | 'inactive' | 'popular' | 'recent'>('all')

  // États système
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: false,
    aiService: false,
    api: false,
    storage: true,
    cache: true,
    backups: true
  })

  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  // États pour les modals
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null)
  const [bulkActionModal, setBulkActionModal] = useState<{
    type: 'activate' | 'deactivate' | 'delete'
    items: (User | Sujet)[]
    itemType: 'user' | 'sujet'
  } | null>(null)

  // États pour les sélections
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedSujets, setSelectedSujets] = useState<number[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Charger les données initiales
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Charger les utilisateurs quand la page ou le filtre change
  useEffect(() => {
    if (selectedTab === 'users') {
      fetchUsers()
    }
  }, [selectedTab, users.page, userFilter, searchQuery])

  // Charger les sujets quand la page ou le filtre change
  useEffect(() => {
    if (selectedTab === 'sujets') {
      fetchSujets()
    }
  }, [selectedTab, sujets.page, sujetFilter, searchQuery])


  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Récupérer les données réelles de l'API
      const [adminStats, systemInfo] = await Promise.all([
        api.getAdminStats().catch((error) => {
          console.warn('Erreur API admin stats:', error)
          // Retourner des valeurs par défaut si l'API n'est pas encore implémentée
          return {
            total_users: 0,
            active_users: 0,
            total_sujets: 0,
            active_sujets: 0,
            ai_analyses: 0,
            domain_stats: [],
            role_stats: [],
            recent_stats: { new_users_7d: 0, new_sujets_7d: 0 },
            recent_activities: [],
            timestamp: new Date().toISOString()
          }
        }),
        api.getSystemInfo().catch(() => null)
      ])

      // Calculer les statistiques de sujets
      let totalSujets = adminStats.total_sujets
      let activeSujets = adminStats.active_sujets

      // Si les stats admin ne contiennent pas les données des sujets, les récupérer directement
      if (totalSujets === 0) {
        try {
          const sujetsData = await api.getSujets({ limit: 100 })
          totalSujets = sujetsData.length
          activeSujets = sujetsData.filter(s => s.is_active).length
        } catch (error) {
          console.warn('Erreur récupération sujets:', error)
        }
      }

      // Calculer la santé système
      const systemHealthScore = calculateSystemHealth(systemInfo)

      // Mettre à jour les statistiques avec les données réelles
      setStats({
        totalUsers: adminStats.total_users,
        activeUsers: adminStats.active_users,
        totalSujets: totalSujets,
        aiAnalyses: adminStats.ai_analyses,
        storageUsage: 0, // À implémenter avec une API dédiée
        apiCalls: 0, // À implémenter avec une API dédiée
        systemHealth: systemHealthScore
      })

      // Mettre à jour la santé du système
      if (systemInfo) {
        updateSystemHealth(systemInfo)
      }

      // Générer des activités récentes basées sur les données admin
      if (adminStats.recent_activities && adminStats.recent_activities.length > 0) {
        setRecentActivities(
          adminStats.recent_activities.slice(0, 6).map((activity, index) => ({
            id: index + 1,
            type: activity.type as 'user' | 'sujet' | 'ai' | 'system' | 'feedback' | 'chat',
            action: activity.action,
            user: activity.user,
            timestamp: formatTimestamp(activity.timestamp),
            icon: getActivityIcon(activity.type),
            color: getActivityColor(activity.type)
          }))
        )
      } else {
        // Fallback si pas d'activités récentes
        try {
          const recentSujets = await api.getSujets({ limit: 5 })
          const mockUsers = await getMockUsers()
          generateRecentActivities(mockUsers.slice(0, 3), recentSujets.slice(0, 3))
        } catch (error) {
          console.warn('Erreur génération activités fallback:', error)
          setRecentActivities([])
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error)
      toast.error('Erreur lors du chargement du tableau de bord')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Essayer d'utiliser l'API admin réelle
      try {
        const response = await api.getAdminUsers({
          skip: (users.page - 1) * users.limit,
          limit: users.limit,
          search: searchQuery || undefined,
          role: userFilter !== 'all' && userFilter !== 'active' && userFilter !== 'inactive'
            ? userFilter
            : undefined,
          is_active: userFilter === 'active'
            ? true
            : userFilter === 'inactive'
              ? false
              : undefined
        })

        setUsers(prev => ({
          ...prev,
          items: response.users,
          total: response.total,
          totalPages: Math.ceil(response.total / users.limit)
        }))

      } catch (apiError) {
        console.warn('API admin/users non disponible, utilisation des données mockées:', apiError)

        // Fallback sur les données mockées si l'API n'est pas encore implémentée
        const mockUsers = await getMockUsers()

        // Filtrer les utilisateurs
        let filteredUsers = mockUsers

        if (searchQuery) {
          filteredUsers = filteredUsers.filter(user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        if (userFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => {
            if (userFilter === 'active') return user.is_active
            if (userFilter === 'inactive') return !user.is_active
            if (userFilter === 'admin') return user.role === 'admin'
            if (userFilter === 'enseignant') return user.role === 'enseignant'
            if (userFilter === 'etudiant') return user.role === 'etudiant'
            return true
          })
        }

        // Pagination
        const startIndex = (users.page - 1) * users.limit
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + users.limit)

        setUsers(prev => ({
          ...prev,
          items: paginatedUsers,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / users.limit)
        }))
      }

    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
    }
  }

 const getMockUsers = async (): Promise<User[]> => {
  // Ces données ne seront utilisées que si l'API admin n'est pas encore implémentée
  return [
    {
      id: 1,
      email: 'admin@memo.com',
      full_name: 'Admin Principal',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'enseignant@memo.com',
      full_name: 'Professeur Dupont',
      role: 'enseignant',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      email: 'etudiant@memo.com',
      full_name: 'Étudiant Martin',
      role: 'etudiant',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      email: 'inactif@email.com',
      full_name: 'Utilisateur Inactif',
      role: 'etudiant',
      is_active: false,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      email: 'admin2@memo.com',
      full_name: 'Admin Secondaire',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]
}

  const calculateSystemHealth = (systemInfo: any): number => {
    if (!systemInfo) return 0

    let score = 100
    if (!systemInfo.database?.connected) score -= 40
    if (!systemInfo.ai?.available) score -= 30
    if (systemInfo.users?.total === 0) score -= 10
    return Math.max(0, score)
  }

  const updateSystemHealth = (systemInfo: any) => {
    if (!systemInfo) return

    const newHealth: SystemHealth = {
      database: systemInfo.database?.connected || false,
      aiService: systemInfo.ai?.available || false,
      api: true,
      storage: true,
      cache: true,
      backups: true
    }
    setSystemHealth(newHealth)

    const issues = Object.values(newHealth).filter(status => !status).length
    if (issues === 0) {
      setSystemStatus('healthy')
    } else if (issues <= 2) {
      setSystemStatus('warning')
    } else {
      setSystemStatus('critical')
    }
  }
  // Ajoutez ces fonctions après les autres fonctions utilitaires dans votre composant

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) {
        return 'À l\'instant'
      } else if (diffMinutes < 60) {
        return `Il y a ${diffMinutes} min`
      } else if (diffHours < 24) {
        return `Il y a ${diffHours} h`
      } else if (diffDays === 1) {
        return 'Hier'
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }
    } catch {
      return timestamp
    }
  }

  const getActivityIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />
      case 'sujet':
        return <FileText className="w-4 h-4" />
      case 'ai':
        return <Brain className="w-4 h-4" />
      case 'system':
        return <Settings className="w-4 h-4" />
      case 'feedback':
        return <MessageSquare className="w-4 h-4" />
      case 'chat':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'sujet':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'ai':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      case 'feedback':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'chat':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const generateRecentActivities = (recentUsers: User[], recentSujets: Sujet[]) => {
    const activities: RecentActivity[] = []

    // Ajouter des activités basées sur les sujets récents
    recentSujets.slice(0, 3).forEach((sujet, index) => {
      activities.push({
        id: index + 1,
        type: 'sujet',
        action: 'Sujet créé',
        user: sujet.titre.substring(0, 30) + (sujet.titre.length > 30 ? '...' : ''),
        timestamp: formatTimestamp(sujet.created_at),
        icon: <FileText className="w-4 h-4" />,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      })
    })

    // Ajouter des activités basées sur les utilisateurs
    recentUsers.slice(0, 2).forEach((user, index) => {
      activities.push({
        id: index + 4,
        type: 'user',
        action: 'Nouvel utilisateur',
        user: user.email,
        timestamp: formatTimestamp(user.created_at),
        icon: <Users className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      })
    })

    // Activité système
    activities.push({
      id: 6,
      type: 'system',
      action: 'Système mis à jour',
      user: 'Admin',
      timestamp: formatTimestamp(new Date().toISOString()),
      icon: <Settings className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    })

    setRecentActivities(activities)
  }

  const fetchSujets = async () => {
    try {
      // Utiliser l'API réelle pour les sujets
      const sujetsData = await api.getSujets({
        limit: 100
      })

      // Filtrer les sujets
      let filteredSujets = sujetsData

      if (searchQuery) {
        filteredSujets = filteredSujets.filter(sujet =>
          sujet.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sujet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sujet.keywords.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      if (sujetFilter !== 'all') {
        filteredSujets = filteredSujets.filter(sujet => {
          if (sujetFilter === 'active') return sujet.is_active
          if (sujetFilter === 'inactive') return !sujet.is_active
          if (sujetFilter === 'popular') return sujet.vue_count > 50
          if (sujetFilter === 'recent') {
            const date = new Date(sujet.created_at)
            const now = new Date()
            const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
            return diffDays < 7
          }
          return true
        })
      }

      // Pagination
      const startIndex = (sujets.page - 1) * sujets.limit
      const paginatedSujets = filteredSujets.slice(startIndex, startIndex + sujets.limit)

      setSujets(prev => ({
        ...prev,
        items: paginatedSujets,
        total: filteredSujets.length,
        totalPages: Math.ceil(filteredSujets.length / sujets.limit)
      }))

    } catch (error) {
      toast.error('Erreur lors du chargement des sujets')
      console.error('Sujets fetch error:', error)
    }
  }

  // Gestion des pages
  const handleUsersPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= users.totalPages) {
      setUsers(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSujetsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= sujets.totalPages) {
      setSujets(prev => ({ ...prev, page: newPage }))
    }
  }

  // Sélection multiple
  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.items.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectAllSujets = (checked: boolean) => {
    if (checked) {
      setSelectedSujets(sujets.items.map(s => s.id))
    } else {
      setSelectedSujets([])
    }
  }

  // Actions sur les utilisateurs
  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate' | 'delete' | 'promote' | 'demote') => {
    try {
      // Utiliser les appels API réels
      switch (action) {
        case 'activate':
          await api.activateUser(userId)
          toast.success('Utilisateur activé avec succès')
          break
        case 'deactivate':
          await api.deactivateUser(userId)
          toast.warning('Utilisateur désactivé')
          break
        case 'delete':
          await api.deleteUser(userId)
          toast.error('Utilisateur supprimé')
          break
        case 'promote':
          // À implémenter: api.promoteUser(userId)
          toast.success('Utilisateur promu administrateur')
          break
        case 'demote':
          // À implémenter: api.demoteUser(userId)
          toast.info('Rôle utilisateur modifié')
          break
      }

      // Recharger les données
      await fetchUsers()
      setConfirmModal(null)
    } catch (error: any) {
      console.error('Erreur lors de l\'opération utilisateur:', error)
      toast.error(error?.message || 'Erreur lors de l\'opération')
    }
  }
  // Actions sur les sujets
  const handleSujetAction = async (sujetId: number, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      switch (action) {
        case 'activate':
          await api.updateUserSujet(sujetId, { is_active: true })
          toast.success('Sujet activé')
          break
        case 'deactivate':
          await api.updateUserSujet(sujetId, { is_active: false })
          toast.warning('Sujet désactivé')
          break
        case 'delete':
          await api.deleteUserSujet(sujetId)
          toast.error('Sujet supprimé')
          break
      }

      await fetchSujets()
      setConfirmModal(null)
    } catch (error) {
      toast.error('Erreur lors de l\'opération')
    }
  }

  // Actions groupées
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!bulkActionModal) return

    setBulkProcessing(true)

    try {
      const itemType = bulkActionModal.itemType
      const itemCount = bulkActionModal.items.length

      // Implémenter les actions groupées réelles
      if (itemType === 'sujet') {
        for (const item of bulkActionModal.items) {
          const sujet = item as Sujet
          if (action === 'delete') {
            await api.deleteUserSujet(sujet.id)
          } else {
            await api.updateUserSujet(sujet.id, {
              is_active: action === 'activate'
            })
          }
        }
      }

      toast.success(`${itemCount} ${itemType}(s) ${action === 'activate' ? 'activé(s)' : action === 'deactivate' ? 'désactivé(s)' : 'supprimé(s)'}`)

      // Recharger les données
      if (itemType === 'user') {
        await fetchUsers()
        setSelectedUsers([])
      } else {
        await fetchSujets()
        setSelectedSujets([])
      }

      setBulkActionModal(null)
    } catch (error) {
      toast.error('Erreur lors de l\'action groupée')
    } finally {
      setBulkProcessing(false)
    }
  }

  // Export de données
  const handleExportData = async (type: 'users' | 'sujets') => {
    try {
      toast.info(`Export des ${type} en cours...`)

      const blob = await api.exportUserData('json')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memobot_${type}_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Export terminé avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  // Analyse IA d'un sujet
  const analyzeSujet = async (sujet: Sujet) => {
    try {
      toast.info('Analyse IA en cours...')
      const analysis = await api.analyzeSubject({
        titre: sujet.titre,
        description: sujet.description,
        domaine: sujet.domaine,
        niveau: sujet.niveau,
        faculté: sujet.faculté,
        problématique: sujet.problématique,
        keywords: sujet.keywords
      })

      toast.success('Analyse IA complétée')
      return analysis
    } catch (error) {
      toast.error('Erreur lors de l\'analyse IA')
    }
  }

  // Modal de confirmation
  const ConfirmModal = () => {
    if (!confirmModal) return null

    const getIcon = () => {
      switch (confirmModal.type) {
        case 'delete': return <Trash2 className="w-6 h-6 text-red-500" />
        case 'deactivate': return <UserX className="w-6 h-6 text-yellow-500" />
        case 'activate': return <UserCheck className="w-6 h-6 text-green-500" />
        case 'promote': return <ShieldCheck className="w-6 h-6 text-purple-500" />
        case 'demote': return <ShieldOff className="w-6 h-6 text-blue-500" />
        case 'reset': return <RefreshCw className="w-6 h-6 text-orange-500" />
        default: return <AlertCircle className="w-6 h-6 text-gray-500" />
      }
    }

    const getButtonColor = () => {
      switch (confirmModal.type) {
        case 'delete': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        case 'deactivate': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        case 'activate': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        case 'promote': return 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
        case 'demote': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        case 'reset': return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        default: return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {getIcon()}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {confirmModal.title}
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {confirmModal.message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal(null)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={confirmModal.action}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
            >
              Confirmer
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Modal d'action groupée
  const BulkActionModal = () => {
    if (!bulkActionModal) return null

    const itemCount = bulkActionModal.items.length
    const itemType = bulkActionModal.itemType === 'user' ? 'utilisateur(s)' : 'sujet(s)'

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Action groupée
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Vous êtes sur le point de {bulkActionModal.type} {itemCount} {itemType}.
            Cette action est irréversible.
          </p>

          <div className="mb-6 max-h-32 overflow-y-auto space-y-1">
            {bulkActionModal.items.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                {bulkActionModal.itemType === 'user' ? (
                  <>
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm truncate">
                      {(item as User).email}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm truncate">
                      {(item as Sujet).titre.substring(0, 50)}...
                    </span>
                  </>
                )}
              </div>
            ))}
            {itemCount > 5 && (
              <div className="text-sm text-gray-500 text-center py-2">
                ... et {itemCount - 5} autres
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setBulkActionModal(null)}
              disabled={bulkProcessing}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={() => handleBulkAction(bulkActionModal.type)}
              disabled={bulkProcessing}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${bulkActionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  bulkActionModal.type === 'deactivate' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                bulkActionModal.type === 'delete' ? 'Supprimer' :
                  bulkActionModal.type === 'deactivate' ? 'Désactiver' : 'Activer'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Rendu principal
  return (
    <div className="space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {confirmModal && <ConfirmModal />}
        {bulkActionModal && <BulkActionModal />}
      </AnimatePresence>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Tableau de bord Administrateur
                </h1>
                <p className="text-blue-100 dark:text-gray-300 mt-1">
                  Données réelles de la plateforme MemoBot
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-400' :
                    systemStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                <span className="text-sm">
                  Système {systemStatus === 'healthy' ? 'Opérationnel' :
                    systemStatus === 'warning' ? 'Alerte' : 'Critique'}
                </span>
              </div>
              <div className="text-sm opacity-90">
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualisation...' : 'Actualiser'}
            </button>
            <div className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
              <span className="text-sm font-medium">Mode Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-white/10">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'sujets', label: 'Sujets', icon: FileText },
            // { id: 'ai', label: 'Intelligence Artificielle', icon: Brain },
            // { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
            // { id: 'system', label: 'Système', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${selectedTab === tab.id
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {selectedTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Utilisateurs
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats.activeUsers} actifs
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalSujets}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Sujets
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {sujets.items.filter(s => s.is_active).length} actifs
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.aiAnalyses}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Analyses IA
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats.apiCalls} requêtes
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.systemHealth}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Santé système
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stats.systemHealth > 80 ? 'bg-green-500' :
                      stats.systemHealth > 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats.systemHealth > 80 ? 'Excellent' :
                      stats.systemHealth > 60 ? 'Bon' : 'À surveiller'}
                  </span>
                </div>
                <div className="text-orange-600 dark:text-orange-400 font-medium">
                  {stats.storageUsage} Go
                </div>
              </div>
            </div>
          </div>

          {/* Activités récentes et santé système */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activités récentes */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activités récentes
                </h3>
              </div>

              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${activity.color}`}>
                          {activity.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {activity.action}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{activity.user}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {activity.timestamp}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucune activité récente
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Santé système */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Santé système
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Base de données', status: systemHealth.database, icon: DatabaseIcon },
                  { label: 'Service IA', status: systemHealth.aiService, icon: Brain },
                  { label: 'API Backend', status: systemHealth.api, icon: Terminal },
                  { label: 'Stockage', status: systemHealth.storage, icon: HardDrive },
                  { label: 'Cache', status: systemHealth.cache, icon: Cloud },
                  { label: 'Sauvegardes', status: systemHealth.backups, icon: Save }
                ].map((service) => (
                  <div key={service.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${service.status ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                        <service.icon className={`w-4 h-4 ${service.status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{service.label}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${service.status
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {service.status ? 'En ligne' : 'Hors ligne'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Statut global</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${systemStatus === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      systemStatus === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {systemStatus === 'healthy' ? 'Opérationnel' :
                      systemStatus === 'warning' ? 'Alerte' : 'Critique'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gestion des utilisateurs */}
      {selectedTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* En-tête avec statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {users.total} utilisateur(s) au total • {stats.activeUsers} actif(s)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleExportData('users')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher un utilisateur par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les utilisateurs</option>
                  <option value="active">Actifs seulement</option>
                  <option value="inactive">Inactifs</option>
                  <option value="admin">Administrateurs</option>
                  <option value="enseignant">Enseignants</option>
                  <option value="etudiant">Étudiants</option>
                </select>
              </div>
            </div>

            {/* Actions groupées */}
            {selectedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      {selectedUsers.length} sélectionné(s)
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Actions groupées disponibles
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'activate',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'deactivate',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'delete',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Liste des utilisateurs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.items.length && users.items.length > 0}
                        onChange={(e) => handleSelectAllUsers(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Utilisateur
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Rôle
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Date d'inscription
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.items.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                            user.role === 'enseignant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                          {user.role === 'admin' ? 'Administrateur' :
                            user.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm font-medium ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/dashboard/profile/${user.id}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir profil"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: user.is_active ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
                              message: user.is_active
                                ? `L'utilisateur ${user.email} ne pourra plus se connecter au système.`
                                : `L'utilisateur ${user.email} pourra à nouveau se connecter au système.`,
                              action: () => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate'),
                              type: user.is_active ? 'deactivate' : 'activate'
                            })}
                            className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title={user.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: 'Supprimer l\'utilisateur',
                              message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ? Cette action est irréversible.`,
                              action: () => handleUserAction(user.id, 'delete'),
                              type: 'delete'
                            })}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                  {users.total} utilisateur(s) • Page {users.page}/{users.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUsersPageChange(users.page - 1)}
                    disabled={users.page === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, users.totalPages) }, (_, i) => {
                    let pageNum
                    if (users.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (users.page <= 3) {
                      pageNum = i + 1
                    } else if (users.page >= users.totalPages - 2) {
                      pageNum = users.totalPages - 4 + i
                    } else {
                      pageNum = users.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleUsersPageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors font-medium ${users.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleUsersPageChange(users.page + 1)}
                    disabled={users.page === users.totalPages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aucun résultat */}
          {users.items.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Aucun utilisateur ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Gestion des sujets */}
      {selectedTab === 'sujets' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* En-tête avec statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des sujets</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {sujets.total} sujet(s) au total • {sujets.items.filter(s => s.is_active).length} actif(s)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleExportData('sujets')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher un sujet par titre, description ou mots-clés..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={sujetFilter}
                  onChange={(e) => setSujetFilter(e.target.value as any)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les sujets</option>
                  <option value="active">Actifs seulement</option>
                  <option value="inactive">Inactifs</option>
                  <option value="popular">Populaires (50+ vues)</option>
                  <option value="recent">Récents (7 derniers jours)</option>
                </select>
              </div>
            </div>

            {/* Actions groupées */}
            {selectedSujets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      {selectedSujets.length} sélectionné(s)
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Actions groupées disponibles
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'activate',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'deactivate',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'delete',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Liste des sujets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedSujets.length === sujets.items.length && sujets.items.length > 0}
                        onChange={(e) => handleSelectAllSujets(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Titre
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Domaine & Niveau
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Vues / Likes
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sujets.items.map((sujet) => (
                    <tr key={sujet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedSujets.includes(sujet.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSujets([...selectedSujets, sujet.id])
                            } else {
                              setSelectedSujets(selectedSujets.filter(id => id !== sujet.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {sujet.titre.length > 60 ? `${sujet.titre.substring(0, 60)}...` : sujet.titre}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {sujet.description.length > 80 ? `${sujet.description.substring(0, 80)}...` : sujet.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full inline-flex items-center gap-1 w-fit">
                            <FileText className="w-3 h-3" />
                            {sujet.domaine}
                          </span>
                          <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full inline-flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3" />
                            {sujet.niveau}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{sujet.vue_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{sujet.like_count}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${sujet.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm font-medium ${sujet.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {sujet.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/dashboard/sujets/${sujet.id}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir en détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => analyzeSujet(sujet)}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Analyser avec IA"
                          >
                            <Brain className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: sujet.is_active ? 'Désactiver le sujet' : 'Activer le sujet',
                              message: sujet.is_active
                                ? `Le sujet "${sujet.titre}" ne sera plus visible par les utilisateurs.`
                                : `Le sujet "${sujet.titre}" sera à nouveau visible par les utilisateurs.`,
                              action: () => handleSujetAction(sujet.id, sujet.is_active ? 'deactivate' : 'activate'),
                              type: sujet.is_active ? 'deactivate' : 'activate'
                            })}
                            className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title={sujet.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {sujet.is_active ? <Archive className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: 'Supprimer le sujet',
                              message: `Êtes-vous sûr de vouloir supprimer le sujet "${sujet.titre}" ? Cette action est irréversible.`,
                              action: () => handleSujetAction(sujet.id, 'delete'),
                              type: 'delete'
                            })}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sujets.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                  {sujets.total} sujet(s) • Page {sujets.page}/{sujets.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSujetsPageChange(sujets.page - 1)}
                    disabled={sujets.page === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, sujets.totalPages) }, (_, i) => {
                    let pageNum
                    if (sujets.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (sujets.page <= 3) {
                      pageNum = i + 1
                    } else if (sujets.page >= sujets.totalPages - 2) {
                      pageNum = sujets.totalPages - 4 + i
                    } else {
                      pageNum = sujets.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleSujetsPageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors font-medium ${sujets.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleSujetsPageChange(sujets.page + 1)}
                    disabled={sujets.page === sujets.totalPages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aucun résultat */}
          {sujets.items.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun sujet trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Aucun sujet ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Intelligence Artificielle */}
      {selectedTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Intelligence Artificielle</h2>
                <p className="text-purple-200 dark:text-gray-300 mt-2">
                  Statut du service IA et configurations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-white/20 rounded-lg">
                  <span className="text-sm font-medium">Status: {systemHealth.aiService ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold mb-1">{stats.aiAnalyses}</div>
                <div className="text-sm text-purple-200">Analyses réalisées</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold mb-1">{stats.apiCalls}</div>
                <div className="text-sm text-purple-200">Requêtes API</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration IA
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Service IA</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Statut du moteur d'IA</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${systemHealth.aiService
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                  {systemHealth.aiService ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Modèle utilisé</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Version du modèle d'IA</div>
                </div>
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full font-medium">
                  Gemini 1.5 Pro
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Administration système */}
      {selectedTab === 'system' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paramètres système */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <Settings className="w-5 h-5 inline mr-2" />
                Paramètres système
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Mode maintenance</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Accès restreint aux utilisateurs</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Nouvelles inscriptions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Autoriser les nouvelles créations de compte</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-medium">
                  <Save className="w-4 h-4" />
                  Sauvegarder les paramètres
                </button>
              </div>
            </div>

            {/* Sauvegarde et maintenance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <Database className="w-5 h-5 inline mr-2" />
                Maintenance
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="font-medium text-gray-900 dark:text-white mb-3">Tester les services</div>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          const health = await api.healthCheck()
                          toast.success(`API Backend: ${health.status}`)
                        } catch {
                          toast.error('API Backend hors ligne')
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span>API Backend</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
                        Tester
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const info = await api.getSystemInfo()
                          toast.success(`Base de données: ${info.database.connected ? 'Connectée' : 'Déconnectée'}`)
                        } catch {
                          toast.error('Base de données non accessible')
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span>Base de données</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
                        Tester
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const info = await api.getSystemInfo()
                          toast.success(`Service IA: ${info.ai.available ? 'Disponible' : 'Indisponible'}`)
                        } catch {
                          toast.error('Service IA non accessible')
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span>Service IA</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
                        Tester
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions critiques */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Actions critiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmModal({
                  title: 'Réinitialiser le cache',
                  message: 'Cette action va vider le cache système. Les performances peuvent être temporairement affectées.',
                  action: async () => {
                    try {
                      await api.clearCache()
                      toast.success('Cache vidé avec succès')
                    } catch (error) {
                      toast.error('Erreur lors du vidage du cache')
                    }
                  },
                  type: 'reset'
                })}
                className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-700 dark:text-red-400 text-left group"
              >
                <div className="font-medium mb-1">Vider le cache</div>
                <div className="text-sm opacity-80">Supprime toutes les données en cache</div>
              </button>
              <button
                onClick={() => handleExportData('sujets')}
                className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-700 dark:text-red-400 text-left group"
              >
                <div className="font-medium mb-1">Exporter toutes les données</div>
                <div className="text-sm opacity-80">Backup complet en JSON</div>
              </button>
            </div>

            <div className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Ces actions peuvent affecter le système
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytiques */}
      {selectedTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Analytiques de la plateforme</h2>
            <p className="text-blue-200 dark:text-gray-300">
              Statistiques réelles de la plateforme
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">{stats.totalUsers}</div>
                <div className="text-sm text-blue-200">Utilisateurs totaux</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">{stats.totalSujets}</div>
                <div className="text-sm text-blue-200">Sujets créés</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">{stats.aiAnalyses}</div>
                <div className="text-sm text-blue-200">Analyses IA</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">{stats.systemHealth}%</div>
                <div className="text-sm text-blue-200">Santé système</div>
              </div>
            </div>
          </div>

          {/* Domaines populaires */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Domaines des sujets</h3>
            <div className="space-y-3">
              {sujets.items.length > 0 ? (
                (() => {
                  const domainCounts: Record<string, number> = {}
                  sujets.items.forEach(sujet => {
                    domainCounts[sujet.domaine] = (domainCounts[sujet.domaine] || 0) + 1
                  })

                  const sortedDomains = Object.entries(domainCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)

                  return sortedDomains.map(([domaine, count]) => (
                    <div key={domaine} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900 dark:text-white">{domaine}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{count} sujets</span>
                    </div>
                  ))
                })()
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucune donnée disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chargement...</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Récupération des données
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}