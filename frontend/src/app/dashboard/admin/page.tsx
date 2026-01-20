// src/app/dashboard/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  FileText,
  TrendingUp,
  Settings,
  Shield,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Key,
  Lock,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Clock,
  Save,
  X,
  Mail,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Copy,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldOff,
  Archive,
//   Unarchive,
  BarChart3
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
  newUsersToday: number
  activeSujets: number
  averageRating: number
}

interface RecentActivity {
  id: number
  type: 'user' | 'sujet' | 'ai' | 'system' | 'feedback'
  action: string
  user: string
  timestamp: string
  details?: string
}

interface PaginationData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Modals
interface UserModalData {
  user: User | null
  mode: 'view' | 'edit' | 'create'
}

interface SujetModalData {
  sujet: Sujet | null
  mode: 'view' | 'edit'
}

interface ConfirmModalData {
  title: string
  message: string
  action: () => Promise<void>
  type: 'delete' | 'deactivate' | 'activate' | 'promote' | 'demote'
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
    newUsersToday: 0,
    activeSujets: 0,
    averageRating: 4.5
  })
  
  const [users, setUsers] = useState<PaginationData<User>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })
  
  const [sujets, setSujets] = useState<PaginationData<Sujet>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'sujets' | 'system'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'admin' | 'enseignant' | 'etudiant'>('all')
  const [sujetFilter, setSujetFilter] = useState<'all' | 'active' | 'inactive' | 'popular'>('all')

  // États pour les modals
  const [userModal, setUserModal] = useState<UserModalData>({ user: null, mode: 'view' })
  const [sujetModal, setSujetModal] = useState<SujetModalData>({ sujet: null, mode: 'view' })
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
      
      // Récupérer les statistiques (simulées pour l'exemple)
      const systemInfo = await api.getSystemInfo()
      const statsData = await api.getUserDashboardStats()
      
      setStats({
        totalUsers: systemInfo.users.total,
        activeUsers: systemInfo.users.active,
        totalSujets: statsData.total_sujets,
        aiAnalyses: 1250, // Simulé
        storageUsage: 2.5, // Simulé
        apiCalls: 15423, // Simulé
        newUsersToday: 5, // Simulé
        activeSujets: statsData.total_sujets - 10, // Simulé
        averageRating: 4.5 // Simulé
      })

      // Générer des activités récentes (simulées)
      setRecentActivities([
        { id: 1, type: 'user', action: 'Nouvelle inscription', user: 'nouveau@email.com', timestamp: 'Il y a 5 min' },
        { id: 2, type: 'sujet', action: 'Sujet créé', user: 'etudiant@email.com', timestamp: 'Il y a 15 min' },
        { id: 3, type: 'ai', action: 'Analyse IA complétée', user: 'enseignant@email.com', timestamp: 'Il y a 30 min' },
        { id: 4, type: 'system', action: 'Sauvegarde automatique', user: 'Système', timestamp: 'Il y a 2h' },
        { id: 5, type: 'feedback', action: 'Nouveau feedback', user: 'utilisateur@email.com', timestamp: 'Il y a 3h' }
      ])

    } catch (error) {
      toast.error('Erreur lors du chargement du tableau de bord')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Simuler l'appel API
      const mockUsers: User[] = [
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

    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs')
      console.error(error)
    }
  }

  const fetchSujets = async () => {
    try {
      // Utiliser l'API réelle
      const sujetsData = await api.getSujets({
        limit: 50 // Récupérer plus pour la pagination côté client
      })

      // Filtrer les sujets
      let filteredSujets = sujetsData
      
      if (searchQuery) {
        filteredSujets = filteredSujets.filter(sujet => 
          sujet.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sujet.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      if (sujetFilter !== 'all') {
        filteredSujets = filteredSujets.filter(sujet => {
          if (sujetFilter === 'active') return sujet.is_active
          if (sujetFilter === 'inactive') return !sujet.is_active
          if (sujetFilter === 'popular') return sujet.vue_count > 100
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
      console.error(error)
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
      // Simulation d'appel API
      switch (action) {
        case 'activate':
          toast.success('Utilisateur activé avec succès')
          break
        case 'deactivate':
          toast.warning('Utilisateur désactivé')
          break
        case 'delete':
          toast.error('Utilisateur supprimé')
          break
        case 'promote':
          toast.success('Utilisateur promu administrateur')
          break
        case 'demote':
          toast.info('Rôle utilisateur modifié')
          break
      }
      
      await fetchUsers()
      setConfirmModal(null)
    } catch (error) {
      toast.error('Erreur lors de l\'opération')
    }
  }

  // Actions sur les sujets
  const handleSujetAction = async (sujetId: number, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      // Simulation d'appel API
      switch (action) {
        case 'activate':
          toast.success('Sujet activé')
          break
        case 'deactivate':
          toast.warning('Sujet désactivé')
          break
        case 'delete':
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
      // Simulation de traitement groupé
      const itemType = bulkActionModal.itemType
      const itemCount = bulkActionModal.items.length
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
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
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Export terminé')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  // ========== MODALS ==========

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
        default: return <AlertCircle className="w-6 h-6 text-gray-500" />
      }
    }

    const getButtonColor = () => {
      switch (confirmModal.type) {
        case 'delete': return 'bg-red-600 hover:bg-red-700'
        case 'deactivate': return 'bg-yellow-600 hover:bg-yellow-700'
        case 'activate': return 'bg-green-600 hover:bg-green-700'
        case 'promote': return 'bg-purple-600 hover:bg-purple-700'
        case 'demote': return 'bg-blue-600 hover:bg-blue-700'
        default: return 'bg-gray-600 hover:bg-gray-700'
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            {getIcon()}
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
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmModal.action}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
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
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
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
          
          <div className="mb-6 max-h-32 overflow-y-auto">
            {bulkActionModal.items.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded mb-1">
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
              <div className="text-sm text-gray-500 text-center">
                ... et {itemCount - 5} autres
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setBulkActionModal(null)}
              disabled={bulkProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => handleBulkAction(bulkActionModal.type)}
              disabled={bulkProcessing}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                bulkActionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                bulkActionModal.type === 'deactivate' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {bulkProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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

  // Modal utilisateur
  const UserModal = () => {
    if (!userModal.user && userModal.mode !== 'create') return null

    const user = userModal.user || {
      id: 0,
      email: '',
      full_name: '',
      role: 'etudiant' as const,
      is_active: true,
      created_at: new Date().toISOString()
    }

    const isEditing = userModal.mode === 'edit' || userModal.mode === 'create'

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {userModal.mode === 'create' ? 'Nouvel utilisateur' : 
                   userModal.mode === 'edit' ? 'Modifier l\'utilisateur' : 'Détails de l\'utilisateur'}
                </h3>
                {userModal.mode === 'view' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setUserModal({ user: null, mode: 'view' })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom complet
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={user.full_name}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                    placeholder="Nom complet"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {user.full_name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                    placeholder="email@exemple.com"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {user.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle
                </label>
                {isEditing ? (
                  <select
                    defaultValue={user.role}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg capitalize">
                    {user.role}
                  </div>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{user.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date d'inscription
                </label>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>

              {userModal.mode === 'view' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions rapides
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setUserModal({ user, mode: 'edit' })
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Modifier
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        title: user.is_active ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
                        message: user.is_active 
                          ? 'L\'utilisateur ne pourra plus se connecter.'
                          : 'L\'utilisateur pourra à nouveau se connecter.',
                        action: () => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate'),
                        type: user.is_active ? 'deactivate' : 'activate'
                      })}
                      className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                    >
                      {user.is_active ? <UserX className="w-3 h-3 inline mr-1" /> : <UserCheck className="w-3 h-3 inline mr-1" />}
                      {user.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={() => setUserModal({ user: null, mode: 'view' })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            {isEditing && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4 inline mr-2" />
                Sauvegarder
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // Modal sujet
  const SujetModal = () => {
    if (!sujetModal.sujet) return null

    const sujet = sujetModal.sujet

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {sujetModal.mode === 'edit' ? 'Modifier le sujet' : 'Détails du sujet'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {sujet.id} • Créé le {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSujetModal({ sujet: null, mode: 'view' })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Informations principales */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Informations principales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Titre
                  </label>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {sujet.titre}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Domaine
                  </label>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {sujet.domaine}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Description
              </h4>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg whitespace-pre-wrap">
                {sujet.description}
              </div>
            </div>

            {/* Métadonnées */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Métadonnées
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Niveau
                  </label>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-center">
                    {sujet.niveau}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Difficulté
                  </label>
                  <div className={`px-3 py-1 rounded-full text-center ${
                    sujet.difficulté === 'facile' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    sujet.difficulté === 'moyenne' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {sujet.difficulté}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Vues
                  </label>
                  <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-center">
                    {sujet.vue_count}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Likes
                  </label>
                  <div className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 rounded-full text-center">
                    {sujet.like_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Statut et actions */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Statut et actions
              </h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${sujet.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{sujet.is_active ? 'Sujet actif' : 'Sujet inactif'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/dashboard/sujets/${sujet.id}`, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    Voir en détail
                  </button>
                  <button
                    onClick={() => setConfirmModal({
                      title: sujet.is_active ? 'Désactiver le sujet' : 'Activer le sujet',
                      message: sujet.is_active 
                        ? 'Le sujet ne sera plus visible par les utilisateurs.'
                        : 'Le sujet sera à nouveau visible.',
                      action: () => handleSujetAction(sujet.id, sujet.is_active ? 'deactivate' : 'activate'),
                      type: sujet.is_active ? 'deactivate' : 'activate'
                    })}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                  >
                    {sujet.is_active ? <Archive className="w-3 h-3 inline mr-1" /> : <Archive  className="w-3 h-3 inline mr-1" />}
                    {sujet.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions du modal */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={() => setSujetModal({ sujet: null, mode: 'view' })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Fermer
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
        {userModal.user !== null || userModal.mode === 'create' ? <UserModal /> : null}
        {sujetModal.sujet !== null && <SujetModal />}
      </AnimatePresence>

      {/* En-tête */}
      <div className="bg-blue-500 dark:bg-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7" />
              Tableau de bord Administrateur
            </h1>
            <p className="text-gray-300 mt-2">
              Gestion complète de la plateforme MemoBot
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <div className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
              <span className="text-sm font-medium">Mode Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedTab === 'overview'
                ? 'bg-white text-gray-900'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => {
              setSelectedTab('users')
              setSearchQuery('')
              setUserFilter('all')
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedTab === 'users'
                ? 'bg-white text-gray-900'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Utilisateurs
          </button>
          <button
            onClick={() => {
              setSelectedTab('sujets')
              setSearchQuery('')
              setSujetFilter('all')
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedTab === 'sujets'
                ? 'bg-white text-gray-900'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            Sujets
          </button>
          <button
            onClick={() => setSelectedTab('system')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedTab === 'system'
                ? 'bg-white text-gray-900'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <Server className="w-4 h-4" />
            Système
          </button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      {selectedTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
                <div className="text-blue-600 dark:text-blue-400">
                  +{stats.newUsersToday} aujourd'hui
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
                    {stats.activeSujets} actifs
                  </span>
                </div>
                <div className="text-green-600 dark:text-green-400">
                  +24 cette semaine
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                    {stats.apiCalls.toLocaleString()} requêtes
                  </span>
                </div>
                <div className="text-purple-600 dark:text-purple-400">
                  ⭐ {stats.averageRating}/5
                </div>
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activités récentes
              </h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Voir tout l'historique
              </button>
            </div>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'sujet' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      activity.type === 'feedback' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      {activity.type === 'sujet' && <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      {activity.type === 'ai' && <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                      {activity.type === 'feedback' && <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                      {activity.type === 'system' && <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{activity.action}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{activity.user}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Gestion des utilisateurs */}
      {selectedTab === 'users' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* En-tête avec statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {users.total} utilisateur(s) au total • {stats.activeUsers} actif(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportData('users')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                <button
                  onClick={() => setUserModal({ user: null, mode: 'create' })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Nouvel utilisateur
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
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
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
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                      {selectedUsers.length} sélectionné(s)
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Actions groupées disponibles
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'activate',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'deactivate',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'delete',
                        items: users.items.filter(u => selectedUsers.includes(u.id)),
                        itemType: 'user'
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liste des utilisateurs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.items.length && users.items.length > 0}
                        onChange={(e) => handleSelectAllUsers(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          user.role === 'enseignant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {user.role === 'admin' ? 'Administrateur' :
                           user.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {user.is_active ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 dark:text-green-400">Actif</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-red-600 dark:text-red-400">Inactif</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setUserModal({ user, mode: 'view' })}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserModal({ user, mode: 'edit' })}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: 'Supprimer l\'utilisateur',
                              message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ? Cette action est irréversible.`,
                              action: () => handleUserAction(user.id, 'delete'),
                              type: 'delete'
                            })}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {users.total} utilisateur(s) • Page {users.page}/{users.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUsersPageChange(users.page - 1)}
                    disabled={users.page === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`px-3 py-1 rounded-lg ${
                          users.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleUsersPageChange(users.page + 1)}
                    disabled={users.page === users.totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aucun résultat */}
          {users.items.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aucun utilisateur ne correspond à vos critères de recherche
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setUserFilter('all')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Gestion des sujets */}
      {selectedTab === 'sujets' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* En-tête avec statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des sujets</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {sujets.total} sujet(s) au total • {stats.activeSujets} actif(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportData('sujets')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
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
                  placeholder="Rechercher un sujet par titre ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={sujetFilter}
                  onChange={(e) => setSujetFilter(e.target.value as any)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="all">Tous les sujets</option>
                  <option value="active">Actifs seulement</option>
                  <option value="inactive">Inactifs</option>
                  <option value="popular">Populaires</option>
                </select>
              </div>
            </div>

            {/* Actions groupées */}
            {selectedSujets.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                      {selectedSujets.length} sélectionné(s)
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Actions groupées disponibles
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'activate',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'deactivate',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => setBulkActionModal({
                        type: 'delete',
                        items: sujets.items.filter(s => selectedSujets.includes(s.id)),
                        itemType: 'sujet'
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liste des sujets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedSujets.length === sujets.items.length && sujets.items.length > 0}
                        onChange={(e) => handleSelectAllSujets(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    <tr key={sujet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {sujet.titre.length > 50 ? `${sujet.titre.substring(0, 50)}...` : sujet.titre}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {sujet.description.length > 60 ? `${sujet.description.substring(0, 60)}...` : sujet.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                            {sujet.domaine}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                            {sujet.niveau}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{sujet.vue_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{sujet.like_count}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {sujet.is_active ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 dark:text-green-400">Actif</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-red-600 dark:text-red-400">Inactif</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSujetModal({ sujet, mode: 'view' })}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/dashboard/sujets/${sujet.id}`, '_blank')}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            title="Ouvrir"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({
                              title: 'Supprimer le sujet',
                              message: `Êtes-vous sûr de vouloir supprimer le sujet "${sujet.titre}" ? Cette action est irréversible.`,
                              action: () => handleSujetAction(sujet.id, 'delete'),
                              type: 'delete'
                            })}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {sujets.total} sujet(s) • Page {sujets.page}/{sujets.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSujetsPageChange(sujets.page - 1)}
                    disabled={sujets.page === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`px-3 py-1 rounded-lg ${
                          sujets.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleSujetsPageChange(sujets.page + 1)}
                    disabled={sujets.page === sujets.totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aucun résultat */}
          {sujets.items.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun sujet trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aucun sujet ne correspond à vos critères de recherche
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSujetFilter('all')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Administration système */}
      {selectedTab === 'system' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Logs détaillés</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Enregistrer toutes les activités système</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Sauvegarder les paramètres
                </button>
              </div>
            </div>

            {/* Sauvegarde et maintenance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <Database className="w-5 h-5 inline mr-2" />
                Sauvegarde & Maintenance
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">Dernière sauvegarde</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Il y a 2 heures</div>
                  </div>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Lancer une sauvegarde</span>
                  </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">Cache système</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">245 Mo utilisé</div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await api.clearCache()
                        toast.success('Cache vidé avec succès')
                      } catch (error) {
                        toast.error('Erreur lors du vidage du cache')
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Vider le cache</span>
                  </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">Tester les services</div>
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
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                        En ligne
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
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                        Connectée
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
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                        Opérationnel
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logs système */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 inline mr-2" />
                Logs système récents
              </h3>
              <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                Télécharger tous les logs
              </button>
            </div>

            <div className="space-y-3">
              {[
                { level: 'INFO', message: 'Sauvegarde automatique terminée', time: '14:30:23' },
                { level: 'WARN', message: 'Tentative de connexion échouée depuis IP 192.168.1.100', time: '14:25:17' },
                { level: 'INFO', message: 'Nouvel utilisateur inscrit: test@example.com', time: '14:15:42' },
                { level: 'ERROR', message: 'Erreur lors de l\'analyse IA pour sujet #1234', time: '13:45:11' },
                { level: 'INFO', message: 'Cache vidé automatiquement', time: '13:30:00' }
              ].map((log, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    log.level === 'ERROR' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{log.message}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions critiques */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              <AlertTriangle className="w-5 h-5 inline mr-2 text-red-600" />
              Zone d'actions critiques
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setConfirmModal({
                  title: 'Réinitialiser toutes les données',
                  message: 'Cette action supprimera TOUS les sujets et utilisateurs (sauf les administrateurs). Êtes-vous absolument sûr ?',
                  action: async () => {
                    toast.info('Réinitialisation en cours...')
                    await new Promise(resolve => setTimeout(resolve, 3000))
                    toast.success('Données réinitialisées')
                  },
                  type: 'delete'
                })}
                className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-700 dark:text-red-400 text-left"
              >
                <div className="font-medium mb-1">Réinitialiser toutes les données</div>
                <div className="text-sm opacity-80">Supprime tous les sujets et utilisateurs</div>
              </button>
              <button
                onClick={() => setConfirmModal({
                  title: 'Désactiver la plateforme',
                  message: 'La plateforme sera mise en maintenance forcée. Aucun utilisateur ne pourra se connecter.',
                  action: async () => {
                    toast.info('Mise en maintenance...')
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    toast.warning('Plateforme en maintenance')
                  },
                  type: 'deactivate'
                })}
                className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-700 dark:text-red-400 text-left"
              >
                <div className="font-medium mb-1">Désactiver la plateforme</div>
                <div className="text-sm opacity-80">Mettre en maintenance forcée</div>
              </button>
              <button
                onClick={() => handleExportData('sujets')}
                className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-700 dark:text-red-400 text-left"
              >
                <div className="font-medium mb-1">Exporter toutes les données</div>
                <div className="text-sm opacity-80">Backup complet en JSON</div>
              </button>
            </div>
            
            <div className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              ⚠️ Ces actions sont irréversibles. Soyez certain de ce que vous faites.
            </div>
          </div>
        </motion.div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chargement...</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Récupération des données administrateur
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}