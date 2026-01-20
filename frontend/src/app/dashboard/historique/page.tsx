'use client'

import { useState, useEffect } from 'react'
import { Clock, Target, Eye, BookOpen, Search, Calendar } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function HistoriquePage() {
  const [historique, setHistorique] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchHistorique()
  }, [])

  const fetchHistorique = async () => {
    try {
      setLoading(true)
      const data = await api.getUserHistory()
      setHistorique(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'historique')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistorique = historique.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.details?.toLowerCase().includes(query) ||
      item.sujet?.titre?.toLowerCase().includes(query) ||
      item.action?.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view_subject':
        return <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'like_subject':
        return <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'choose_subject':
        return <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'ai_generation':
        return <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'view_subject':
        return 'Consultation'
      case 'like_subject':
        return 'Ajout aux favoris'
      case 'choose_subject':
        return 'Sélection'
      case 'ai_generation':
        return 'Génération IA'
      default:
        return action.replace('_', ' ')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Historique
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Votre activité récente sur la plateforme
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Liste de l'historique */}
      {filteredHistorique.length > 0 ? (
        <div className="space-y-4">
          {filteredHistorique.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {getActionIcon(item.action)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {getActionLabel(item.action)}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.details}
                    </p>
                    {item.sujet && (
                      <Link
                        href={`/dashboard/sujets/${item.sujet.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        {item.sujet.titre}
                      </Link>
                    )}
                  </div>
                </div>
                {item.sujet && (
                  <Link
                    href={`/dashboard/sujets/${item.sujet.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Revoir
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'Aucune activité correspondante' : 'Aucune activité récente'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery 
              ? 'Essayez de modifier votre recherche'
              : 'Votre historique d\'activité apparaîtra ici'
            }
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/sujets/explore"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Explorer les sujets
            </Link>
          )}
        </div>
      )}
    </div>
  )
}