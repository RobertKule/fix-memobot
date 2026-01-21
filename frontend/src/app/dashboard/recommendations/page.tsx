// src/app/dashboard/recommendations/page.tsx - VERSION CORRIGÉE
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark, Heart, ChevronDown, ChevronUp, 
  Grid, List, ChevronLeft, ChevronRight,
  Check, Filter, X, Loader2, AlertCircle, RefreshCw,
  Eye, Brain, Share2, BarChart3, FileText, Printer, Plus, Flag
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api, Sujet, RecommendedSujet } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

// Types
interface EnhancedRecommendedSujet extends RecommendedSujet {
  sujet: Sujet
  score: number
  raisons: string[]
}

// Simple cache en mémoire pour éviter les appels répétés
const recommendationsCache = {
  data: null as EnhancedRecommendedSujet[] | null,
  timestamp: 0,
  ttl: 2 * 60 * 1000, // 2 minutes
  clear: function() {
    this.data = null
    this.timestamp = 0
  }
}

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<EnhancedRecommendedSujet[]>([])
  const [savedSujets, setSavedSujets] = useState<number[]>([])
  const [expandedSujet, setExpandedSujet] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    domaine: '',
    niveau: '',
    difficulté: ''
  })
  const [refreshing, setRefreshing] = useState(false)

  // Charger les recommandations automatiquement
  useEffect(() => {
    if (user?.id) {
      loadRecommendations()
    }
  }, [user])

  const loadRecommendations = async (forceRefresh = false) => {
    try {
      // N'afficher le loader que si c'est le premier chargement
      if (!recommendationsCache.data || forceRefresh) {
        setLoading(true)
      }
      setError(null)
      
      // Vérifier le cache
      if (!forceRefresh && recommendationsCache.data && 
          (Date.now() - recommendationsCache.timestamp) < recommendationsCache.ttl) {
        setRecommendations(recommendationsCache.data)
        setLoading(false)
        return
      }

      // 1. Récupérer les préférences utilisateur pour obtenir TOUTES les infos
      let userPreferences = null
      try {
        userPreferences = await api.getPreferences()
      } catch (prefError) {
        console.log("Erreur préférences:", prefError)
        // Continuer avec des valeurs par défaut
      }

      // Extraire toutes les infos utilisateur
      const userInterests = userPreferences?.interests || ''
      const userLevel = userPreferences?.level || ''
      const userFaculty = userPreferences?.faculty || ''
      const userField = userPreferences?.field || ''

      // Préparer les intérêts pour l'API
      const interestsList = userInterests ? 
  userInterests.split(',')
    .map((interest: string) => interest.trim())
    .filter((interest: string) => interest.length > 0) : 
  []
      // Si pas d'intérêts, utiliser des intérêts par défaut basés sur le domaine
      let effectiveInterests = interestsList
      if (effectiveInterests.length === 0 && userField) {
        // Mapping des domaines aux intérêts par défaut
        const domainInterests: Record<string, string[]> = {
          'Informatique': ['Programmation', 'Base de données', 'Réseaux'],
          'Génie Informatique': ['IA', 'Machine Learning', 'Sécurité'],
          'Mathématiques': ['Analyse', 'Algèbre', 'Statistiques'],
          'Physique': ['Mécanique', 'Électricité', 'Optique'],
          'Chimie': ['Organique', 'Analytique', 'Matériaux']
        }
        effectiveInterests = domainInterests[userField] || ['Recherche', 'Innovation', 'Technologie']
      }

      // 2. Appeler l'API de recommandations avec TOUTES les infos utilisateur
      console.log('📤 Envoi des infos utilisateur:', {
        interests: effectiveInterests,
        niveau: userLevel,
        faculté: userFaculty,
        domaine: userField,
        limit: 20
      })

      const recommendedSujets = await api.recommendSujets({
        interests: effectiveInterests,
        niveau: userLevel || undefined,
        faculté: userFaculty || undefined,
        domaine: userField || undefined,
        limit: 20
      })

      console.log('✅ Récommandations reçues:', recommendedSujets.length)

      // Transformer en format EnhancedRecommendedSujet
      const enhancedRecs: EnhancedRecommendedSujet[] = recommendedSujets.map(rec => {
        // Générer des raisons basées sur le score et les correspondances
        const reasons = [
          `Score de pertinence: ${rec.score}%`,
          ...rec.raisons.slice(0, 2)
        ]

        return {
          ...rec,
          raisons: reasons
        }
      })

      // Mettre en cache
      recommendationsCache.data = enhancedRecs
      recommendationsCache.timestamp = Date.now()

      setRecommendations(enhancedRecs)
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des recommandations:', err)
      
      // En cas d'erreur, essayer de charger les sujets populaires
      try {
        console.log('🔄 Fallback: chargement des sujets populaires...')
        const popularSujets = await api.getPopularSujets(15)
        
        const fallbackRecs: EnhancedRecommendedSujet[] = popularSujets.map((sujet, index) => ({
          sujet,
          score: 85 - (index * 2), // Score décroissant
          raisons: [
            "Sujet populaire dans la communauté",
            "Domaine actuel et pertinent",
            "Adapté à différents niveaux académiques"
          ],
          critères_respectés: []
        }))

        setRecommendations(fallbackRecs)
        toast.info('Affichage des sujets populaires')
        
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError)
        setError(err.message || 'Erreur lors du chargement des recommandations')
        toast.error('Impossible de charger les recommandations')
      }
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fonction de rafraîchissement
  const refreshRecommendations = async () => {
    setRefreshing(true)
    recommendationsCache.clear()
    await loadRecommendations(true)
    toast.success('Recommandations rafraîchies')
  }

  // Sauvegarder un sujet dans les favoris
  const handleSaveSujet = async (sujetId: number) => {
    try {
      const isCurrentlySaved = savedSujets.includes(sujetId)
      
      if (isCurrentlySaved) {
        setSavedSujets(prev => prev.filter(id => id !== sujetId))
        toast.success('Sujet retiré des favoris')
      } else {
        // Appeler l'API pour marquer comme favori
        await api.submitFeedback({
          sujet_id: sujetId,
          intéressé: true,
          sélectionné: true
        })
        
        setSavedSujets(prev => [...prev, sujetId])
        toast.success('Sujet ajouté aux favoris')
      }
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  // Toggle expansion d'un sujet
  const toggleExpandSujet = (sujetId: number) => {
    setExpandedSujet(expandedSujet === sujetId ? null : sujetId)
  }

  // Extraire les options de filtres des recommandations réelles
  const domaineOptions = useMemo(() => 
    Array.from(new Set(recommendations.map(r => r.sujet.domaine))).sort(),
    [recommendations]
  )

  const niveauOptions = useMemo(() => 
    Array.from(new Set(recommendations.map(r => r.sujet.niveau))).sort(),
    [recommendations]
  )

  const difficulteOptions = ['facile', 'moyenne', 'difficile']

  // Filtrer les recommandations
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations
    
    if (filters.domaine) {
      filtered = filtered.filter(r => r.sujet.domaine === filters.domaine)
    }
    
    if (filters.niveau) {
      filtered = filtered.filter(r => r.sujet.niveau === filters.niveau)
    }
    
    if (filters.difficulté) {
      filtered = filtered.filter(r => r.sujet.difficulté === filters.difficulté)
    }
    
    // Trier par score de pertinence (descendant)
    return filtered.sort((a, b) => b.score - a.score)
  }, [recommendations, filters])

  // Pagination
  const totalPages = Math.ceil(filteredRecommendations.length / itemsPerPage)
  const paginatedRecommendations = filteredRecommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset filters
  const resetFilters = () => {
    setFilters({ domaine: '', niveau: '', difficulté: '' })
    setCurrentPage(1)
  }

  // Loading state
  if (loading && !recommendations.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Chargement de vos recommandations personnalisées...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Analyse de vos intérêts et profil
          </p>
        </div>
      </div>
    )
  }

  if (error && !recommendations.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 p-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {error}
        </p>
        <button
          onClick={refreshRecommendations}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton rafraîchir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Recommandations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredRecommendations.length} sujets correspondent à votre profil
          </p>
        </div>
        
        <button
          onClick={refreshRecommendations}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Rafraîchir</span>
        </button>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filtres */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtrer</span>
            {(filters.domaine || filters.niveau || filters.difficulté) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
          
          {(filters.domaine || filters.niveau || filters.difficulté) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Affichage et pagination */}
        <div className="flex items-center gap-4">
          {/* Mode d'affichage */}
          <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Nombre d'éléments */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value={5}>5 par page</option>
            <option value={10}>10 par page</option>
            <option value={20}>20 par page</option>
          </select>
        </div>
      </div>

      {/* Filtres détaillés */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Domaine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Domaine
              </label>
              <select
                value={filters.domaine}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, domaine: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="">Tous les domaines</option>
                {domaineOptions.map(domaine => (
                  <option key={domaine} value={domaine}>{domaine}</option>
                ))}
              </select>
            </div>

            {/* Niveau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveau
              </label>
              <select
                value={filters.niveau}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, niveau: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="">Tous les niveaux</option>
                {niveauOptions.map(niveau => (
                  <option key={niveau} value={niveau}>{niveau}</option>
                ))}
              </select>
            </div>

            {/* Difficulté */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulté
              </label>
              <select
                value={filters.difficulté}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, difficulté: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="">Toutes difficultés</option>
                {difficulteOptions.map(difficulte => (
                  <option key={difficulte} value={difficulte}>
                    {difficulte.charAt(0).toUpperCase() + difficulte.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de rafraîchissement */}
      {refreshing && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Mise à jour des recommandations...
          </span>
        </div>
      )}

      {/* Liste des recommandations */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
        {paginatedRecommendations.map((recommendation) => {
          const sujet = recommendation.sujet
          const isSaved = savedSujets.includes(sujet.id)
          const isExpanded = expandedSujet === sujet.id

          return (
            <motion.div
              key={sujet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                viewMode === 'grid' ? 'h-full flex flex-col' : ''
              }`}
            >
              {/* En-tête du sujet */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        recommendation.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        recommendation.score >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {recommendation.score}% de pertinence
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                        {sujet.domaine}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {sujet.titre}
                    </h3>
                    
                    {/* Pourquoi ce sujet vous correspond */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pourquoi ce sujet vous correspond :
                      </p>
                      <ul className="space-y-1">
                        {recommendation.raisons.slice(0, 2).map((raison, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{raison}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSaveSujet(sujet.id)}
                      className={`p-2 rounded-full ${
                        isSaved 
                          ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => toggleExpandSujet(sujet.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

             {/* Contenu détaillé (expandable) */}
{isExpanded && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="p-4 border-t border-gray-200 dark:border-gray-800"
  >
    {/* Actions secondaires */}
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-2">
        
        <Link
        href={`/dashboard/sujets/${sujet.id}`}
      >
       <button
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          <Eye className="w-auto h-4" />
          <span className="text-xs font-medium">Détails complets</span>
        </button>
        
      </Link>
        

        {/* Imprimer */}
        <button
          onClick={() => {
            window.print();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer</span>
        </button>

        
        {/* Signaler */}
        <button
          onClick={() => {
            toast.info('Signalement envoyé');
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          <Flag className="w-4 h-4" />
          <span>Signaler</span>
        </button>
        <button
        onClick={() => toggleExpandSujet(sujet.id)}
        className="px-4 py-2 text-sm animate-pulse text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    
      </div>
    </div>    

  </motion.div>
)
              
              }
            </motion.div>
          )
        })}
      </div>

      {/* Pagination */}
      {filteredRecommendations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredRecommendations.length)} sur {filteredRecommendations.length} sujets
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Aucun résultat */}
      {filteredRecommendations.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <Filter className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun sujet ne correspond à vos filtres
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Essayez de modifier vos critères de recherche
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Afficher tous les sujets
          </button>
        </div>
      )}
    </div>
  )
}