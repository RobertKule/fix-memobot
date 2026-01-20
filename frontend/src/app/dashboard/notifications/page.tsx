// src/app/dashboard/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Mail,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Eye,
  Trash2,
  Settings,
  Filter,
  ChevronDown,
  Search,
  CheckCheck,
  AlertCircle,
  ThumbsUp,
  Share2
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Notification {
  id: number
  type: 'system' | 'message' | 'like' | 'comment' | 'follow' | 'mention' | 'admin'
  title: string
  message: string
  sender?: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
  metadata?: Record<string, any>
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'social'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Charger les notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Simuler des données de notification
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: 'like',
          title: 'Nouveau like sur votre sujet',
          message: 'Votre sujet "IA et Éducation" a reçu un like',
          timestamp: 'Il y a 5 minutes',
          read: false,
          priority: 'low',
          actionUrl: '/dashboard/sujets/1'
        },
        {
          id: 2,
          type: 'comment',
          title: 'Nouveau commentaire',
          message: 'Un utilisateur a commenté votre sujet',
          sender: 'Étudiant123',
          timestamp: 'Il y a 2 heures',
          read: false,
          priority: 'medium'
        },
        {
          id: 3,
          type: 'system',
          title: 'Analyse IA terminée',
          message: 'Votre sujet a été analysé par notre IA',
          timestamp: 'Il y a 1 jour',
          read: true,
          priority: 'high',
          metadata: { sujetId: 42 }
        },
        {
          id: 4,
          type: 'admin',
          title: 'Nouvelle fonctionnalité',
          message: 'Découvrez la nouvelle fonctionnalité de partage',
          timestamp: 'Il y a 2 jours',
          read: true,
          priority: 'medium'
        },
        {
          id: 5,
          type: 'follow',
          title: 'Nouvel abonnement',
          message: 'Un nouvel utilisateur vous suit',
          sender: 'Enseignant45',
          timestamp: 'Il y a 3 jours',
          read: true,
          priority: 'low'
        },
        {
          id: 6,
          type: 'mention',
          title: 'Vous avez été mentionné',
          message: 'Votre nom a été mentionné dans un commentaire',
          timestamp: 'Il y a 4 jours',
          read: true,
          priority: 'medium'
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      toast.error('Erreur lors du chargement des notifications')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      // Simulation d'appel API
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      
      toast.success('Notification marquée comme lue')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const markAllAsRead = async () => {
    try {
      // Simulation d'appel API
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
      
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      // Simulation d'appel API
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      )
      
      setSelectedNotifications(prev =>
        prev.filter(id => id !== notificationId)
      )
      
      toast.success('Notification supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const deleteAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read)
      setNotifications(unreadNotifications)
      setSelectedNotifications([])
      
      toast.success('Notifications lues supprimées')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system': return <Bell className="w-5 h-5 text-blue-600" />
      case 'message': return <Mail className="w-5 h-5 text-green-600" />
      case 'like': return <ThumbsUp className="w-5 h-5 text-blue-600" />
      case 'comment': return <MessageSquare className="w-5 h-5 text-yellow-600" />
      case 'follow': return <Users className="w-5 h-5 text-blue-600" />
      case 'mention': return <Share2 className="w-5 h-5 text-orange-600" />
      case 'admin': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (filter === 'unread' && notification.read) return false
    if (filter === 'system' && notification.type !== 'system') return false
    if (filter === 'social' && !['like', 'comment', 'follow', 'mention'].includes(notification.type)) return false
    
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-600 dark:from-gray-900 dark:to-gray-900  rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-blue-100 mt-1">
                {unreadCount > 0 
                  ? `${unreadCount} notification(s) non lue(s)`
                  : 'Toutes vos notifications sont à jour'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-sm font-medium">{notifications.length} total</span>
              </div>
            </div>
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4 inline mr-2" />
              Tout marquer comme lu
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher dans les notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <button
                    onClick={() => setFilter('all')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${filter === 'all' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    Toutes les notifications
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${filter === 'unread' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    Non lues seulement
                  </button>
                  <button
                    onClick={() => setFilter('system')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${filter === 'system' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    Système
                  </button>
                  <button
                    onClick={() => setFilter('social')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${filter === 'social' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    Social
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={deleteAllRead}
              className="px-4 py-3 border border-red-300 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer les lues</span>
            </button>

            <button className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>
          </div>
        </div>

        {/* Sélection multiple */}
        {selectedNotifications.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                  {selectedNotifications.length} sélectionné(s)
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Actions disponibles
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    selectedNotifications.forEach(id => markAsRead(id))
                    setSelectedNotifications([])
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Marquer comme lu
                </button>
                <button
                  onClick={() => {
                    selectedNotifications.forEach(id => deleteNotification(id))
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="space-y-4">
        {loading ? (
          // Squelette de chargement
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          // Aucune notification
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread' 
                ? 'Vous n\'avez pas de notifications non lues'
                : 'Vous n\'avez aucune notification pour le moment'}
            </p>
          </div>
        ) : (
          // Notifications
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                notification.read 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-blue-200 dark:border-blue-800 border-l-4 border-l-blue-500'
              } p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start gap-4">
                {/* Icône */}
                <div className={`p-3 rounded-xl ${
                  notification.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold ${
                        notification.read 
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h3>
                      {notification.sender && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          De : {notification.sender}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.timestamp}
                      </span>
                      
                      {/* Badge de priorité */}
                      <span className={`px-2 py-1 text-xs border rounded-full ${
                        getPriorityColor(notification.priority)
                      }`}>
                        {notification.priority === 'high' ? 'Haute' : 
                         notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {notification.message}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Marquer comme lu</span>
                      </button>
                    )}
                    
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => {
                        if (selectedNotifications.includes(notification.id)) {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                        } else {
                          setSelectedNotifications(prev => [...prev, notification.id])
                        }
                      }}
                      className={`p-1.5 rounded-lg ${
                        selectedNotifications.includes(notification.id)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedNotifications.includes(notification.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 border border-current rounded"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lues</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.read).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Non lues</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Importantes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}