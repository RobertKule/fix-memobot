// src/app/dashboard/favoris/page.tsx 
'use client'

import { useState, useEffect } from 'react'
import { Heart, Eye, Calendar, Tag, BookOpen, Target, Search } from 'lucide-react'
import Link from 'next/link'
import { api, Sujet } from '@/lib/api'
import { toast } from 'sonner'


export default function FavorisPage() {
  const [favoris, setFavoris] = useState<Sujet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFavoris()
  }, [])

  const fetchFavoris = async () => {
    try {
      setLoading(true)
      const data = await api.getUserFavoris()
      setFavoris(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement des favoris')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (sujetId: number) => {
    try {
      await api.submitFeedback({
        sujet_id: sujetId,
        intéressé: false
      })
      
      setFavoris(prev => prev.filter(sujet => sujet.id !== sujetId))
      toast.success('Retiré des favoris')
    } catch (error: any) {
      toast.error(error.message || 'Erreur')
    }
  }

  const filteredFavoris = favoris.filter(sujet => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sujet.titre.toLowerCase().includes(query) ||
      sujet.description.toLowerCase().includes(query) ||
      sujet.domaine.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des favoris...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes favoris
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sujets que vous avez marqués comme intéressants
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher dans vos favoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Liste des favoris */}
      {filteredFavoris.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFavoris.map((sujet) => (
            <div
              key={sujet.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full">
                      {sujet.domaine}
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      Favori
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {sujet.titre}
                  </h3>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(sujet.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Retirer des favoris"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {sujet.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {sujet.problématique && (
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{sujet.problématique}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {sujet.niveau}
                  </span>
                  {sujet.durée_estimée && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {sujet.durée_estimée}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {sujet.vue_count} vues
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/sujets/${sujet.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Explorer
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'Aucun favori correspondant' : 'Aucun favori'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery 
              ? 'Essayez de modifier votre recherche'
              : 'Ajoutez des sujets à vos favoris en cliquant sur l\'icône cœur'
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