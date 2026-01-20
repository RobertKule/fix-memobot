'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  Filter,
  Heart,
  Eye,
  TrendingUp,
  Star,
  Users,
  Clock,
  ChevronDown,
  Target
} from 'lucide-react'
import { api, Sujet } from '@/lib/api'
import { toast } from 'sonner'

export default function CommunityPopularPage() {
  const [sujets, setSujets] = useState<Sujet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    domaine: '',
    niveau: '',
    difficulté: '',
    faculté: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [interestedSujets, setInterestedSujets] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'trending'>('popular')

  // Charger les sujets populaires
  useEffect(() => {
    fetchPopularSujets()
  }, [sortBy])

  const fetchPopularSujets = async () => {
    try {
      setLoading(true)
      
      let data: Sujet[] = []
      
      if (sortBy === 'popular') {
        data = await api.getPopularSujets(20)
      } else if (sortBy === 'recent') {
        data = await api.getRecentSujets(20)
      } else {
        // Pour trending, on peut utiliser popular comme fallback
        data = await api.getPopularSujets(20)
      }
      
      setSujets(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement des sujets populaires')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleInterested = async (sujetId: number) => {
    try {
      await api.submitFeedback({
        sujet_id: sujetId,
        intéressé: true
      })

      setInterestedSujets(prev =>
        prev.includes(sujetId)
          ? prev.filter(id => id !== sujetId)
          : [...prev, sujetId]
      )

      toast.success('Ajouté aux favoris')
    } catch (error: any) {
      toast.error(error.message || 'Erreur')
    }
  }

  const filteredSujets = sujets.filter(sujet => {
    if (searchQuery && !sujet.titre.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filters.domaine && !sujet.domaine.toLowerCase().includes(filters.domaine.toLowerCase())) {
      return false
    }
    if (filters.niveau && sujet.niveau !== filters.niveau) {
      return false
    }
    if (filters.difficulté && sujet.difficulté !== filters.difficulté) {
      return false
    }
    if (filters.faculté && !sujet.faculté.toLowerCase().includes(filters.faculté.toLowerCase())) {
      return false
    }
    return true
  })

  // Trier les sujets
  const sortedSujets = [...filteredSujets].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.like_count - a.like_count
    } else if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return (b.vue_count + b.like_count) - (a.vue_count + a.like_count)
    }
  })

  // Récupérer les valeurs uniques pour les filtres
  const domaines = [...new Set(sujets.map(s => s.domaine))]
  const niveaux = [...new Set(sujets.map(s => s.niveau))]
  const difficultés = [...new Set(sujets.map(s => s.difficulté))]
  const facultés = [...new Set(sujets.map(s => s.faculté))]

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communauté - Sujets Populaires</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Découvrez les sujets les plus appréciés par la communauté
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                {sujets.length} sujets
              </span>
            </div>
          </div>
        </div>

        {/* Barre de recherche et tris */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher parmi les sujets populaires..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="popular">Plus populaires</option>
              <option value="recent">Plus récents</option>
              <option value="trending">Tendances</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domaine
                </label>
                <select
                  value={filters.domaine}
                  onChange={(e) => setFilters(prev => ({ ...prev, domaine: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Tous les domaines</option>
                  {domaines.map(domaine => (
                    <option key={domaine} value={domaine}>{domaine}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niveau
                </label>
                <select
                  value={filters.niveau}
                  onChange={(e) => setFilters(prev => ({ ...prev, niveau: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulté
                </label>
                <select
                  value={filters.difficulté}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulté: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Toutes les difficultés</option>
                  {difficultés.map(dif => (
                    <option key={dif} value={dif}>{dif}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Faculté
                </label>
                <select
                  value={filters.faculté}
                  onChange={(e) => setFilters(prev => ({ ...prev, faculté: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Toutes les facultés</option>
                  {facultés.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Statistiques de communauté */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sujets les plus likés</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sujets.length > 0 ? Math.max(...sujets.map(s => s.like_count)) : 0} likes
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de vues</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sujets.reduce((sum, sujet) => sum + sujet.vue_count, 0)} vues
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Domaine populaire</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {domaines.length > 0 ? domaines[0] : 'Aucun'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des sujets populaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          // Squelette de chargement
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="flex gap-2 mb-6">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          ))
        ) : (
          sortedSujets.map((sujet, index) => (
            <motion.div
              key={sujet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {sortBy === 'popular' && sujet.like_count > 50 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                        <Star className="w-3 h-3" />
                        POPULAIRE
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {sujet.titre}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full">
                      {sujet.domaine}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                      {sujet.niveau}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${sujet.difficulté === 'facile' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        sujet.difficulté === 'moyenne' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                      {sujet.difficulté}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleInterested(sujet.id)}
                  className={`p-2 rounded-lg ${interestedSujets.includes(sujet.id) ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                >
                  <Heart className={`w-5 h-5 ${interestedSujets.includes(sujet.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {sujet.description}
              </p>

              {sujet.keywords && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mots-clés
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sujet.keywords.split(',').slice(0, 5).map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        {keyword.trim()}
                      </span>
                    ))}
                    {sujet.keywords.split(',').length > 5 && (
                      <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        +{sujet.keywords.split(',').length - 5} autres
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1" title={`${sujet.vue_count} vues`}>
                    <Eye className="w-4 h-4" />
                    <span>{sujet.vue_count}</span>
                  </div>
                  <div className="flex items-center gap-1" title={`${sujet.like_count} likes`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>{sujet.like_count}</span>
                  </div>
                  {sujet.user_id && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Par utilisateur #{sujet.user_id}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/sujets/${sujet.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Aucun résultat */}
      {!loading && sortedSujets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun sujet populaire trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La communauté n'a pas encore liké de sujets avec ces critères
          </p>
          <Link
            href="/dashboard/sujets/explore"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Explorer tous les sujets
          </Link>
        </div>
      )}
    </div>
  )
}