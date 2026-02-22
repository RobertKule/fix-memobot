// src/app/dashboard/page.tsx
'use client'

import { Target, Star, MessageSquare, TrendingUp, FileText, ArrowRight, Eye, GraduationCap, BookOpen, Zap } from 'lucide-react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api, Sujet, UserPreference, RecommendedSujet } from '@/lib/api'
import { useAuthGuard } from '@/hooks/useAuthGuard'

// Types pour les données du dashboard
interface DashboardStats {
  total_sujets: number
  user_sujets: number
  saved_sujets: number
  recommendations_count: number
  last_activity: string
  popular_keywords: Array<{ keyword: string; count: number }>
  domain_stats: Array<{ domaine: string; count: number; avg_views: number }>
}

// Skeleton component
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* En-tête skeleton */}
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Profil et Actions skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profil skeleton */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Sujets populaires skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Progression skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  useAuthGuard(true)
  const { user } = useAuth()
  
  // États
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [preferences, setPreferences] = useState<UserPreference | null>(null)
  const [popularSujets, setPopularSujets] = useState<Sujet[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedSujet[]>([])
  const [profileCompletion, setProfileCompletion] = useState(0)

  const quickActions = [
    { title: 'Trouver mon sujet', href: '/dashboard/chat', icon: MessageSquare },
    { title: 'Voir recommandations', href: '/dashboard/recommendations', icon: Star },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculer la progression du profil
  const calculateProfileCompletion = (prefs: UserPreference | null) => {
    if (!prefs) return 0
    
    // Compter les champs remplis
    let filledCount = 0
    const totalFields = 3 // level, faculty, interests
    
    if (prefs.level && prefs.level.trim() !== '') filledCount++
    if (prefs.faculty && prefs.faculty.trim() !== '') filledCount++
    if (prefs.interests && prefs.interests.trim() !== '') filledCount++
    
    return Math.round(1 * 100)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Chargement parallèle de toutes les données
      const [prefs, sujets, recs, statsData] = await Promise.all([
        api.getPreferences().catch(() => null),
        api.getPopularSujets(5).catch(() => []),
        api.getPersonalizedRecommendations({ limit: 3 }).catch(() => []),
        api.getUserDashboardStats().catch(() => null)
      ])

      setPreferences(prefs)
      setPopularSujets(sujets)
      setRecommendations(recs)
      setStats(statsData)
      
      // Calculer la progression du profil
      setProfileCompletion(calculateProfileCompletion(prefs))

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(error?.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }
recommendations.length=20;
  // Stats calculées
  const displayStats = [
    // { 
    //   label: 'Sujets', 
    //   value: stats?.total_sujets?.toString() || popularSujets.length.toString() || '0', 
    //   icon: Target, 
    //   color: 'text-blue-600' 
    // },
    { 
      label: 'Recommandations', 
      value: recommendations.length.toString() || '0', 
      icon: Star, 
      color: 'text-green-600' 
    },
    { 
      label: 'Messages', 
      value: '3', 
      icon: MessageSquare, 
      color: 'text-gray-600' 
    },
    { 
      label: 'Progression', 
      value: `${profileCompletion}%`, 
      icon: TrendingUp, 
      color: 'text-orange-600' 
    },
  ]

  return (
    <div className="space-y-6">
      {/* En-tête avec nom d'utilisateur et dernière activité */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bonjour, {user?.full_name?.split(' ')[0] || 'Étudiant'} !
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {stats?.last_activity 
            ? `Dernière activité: ${new Date(stats.last_activity).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}`
            : 'Bienvenue sur votre espace de recherche de sujet'}
        </p>
      </div>

      {/* Stats avec données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Profil rapide avec données réelles */}
      {preferences && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Votre profil académique
              </h3>
              <div className="space-y-2">
                {preferences.level && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Niveau: <span className="font-medium">{preferences.level}</span>
                    </span>
                  </div>
                )}
                {preferences.faculty && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Faculté: <span className="font-medium">{preferences.faculty}</span>
                    </span>
                  </div>
                )}
                {preferences.interests && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Intérêts: <span className="font-medium line-clamp-1">{preferences.interests}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Modifier
            </Link>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <action.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{action.title}</h3>
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-1">
                    <span>Accéder</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* Afficher le nombre de recommandations */}
          {recommendations.length > 0 && (
            <div className="lg:col-span-4 text-xs text-gray-500 dark:text-gray-400 text-right">
              {recommendations.length} nouvelle{recommendations.length > 1 ? 's' : ''} recommandation{recommendations.length > 1 ? 's' : ''} disponible{recommendations.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sujets populaires */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sujets populaires</h2>
          <div className="space-y-4">
            {popularSujets.length > 0 ? (
              popularSujets.map((sujet) => (
                <Link
                  key={sujet.id}
                  href={`/dashboard/sujets/${sujet.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {sujet.titre}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{sujet.domaine}</span>
                        <span>•</span>
                        <span>{sujet.niveau}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{sujet.vue_count || 0}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aucun sujet populaire pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Progression détaillée */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Votre progression</h2>
          <div className="space-y-4">
            {[
              { 
                label: 'Profil complété', 
                progress: profileCompletion,
                details: profileCompletion === 100 ? 'Complet' : `${profileCompletion}%`
              },
              { 
                label: 'Critères définis', 
                progress: preferences?.interests ? 85 : 30,
                details: preferences?.interests ? 'Définis' : 'À définir'
              },
              // { 
              //   label: 'Sujets explorés', 
              //   progress: Math.min((stats?.total_sujets || popularSujets.length) * 20, 100),
              //   details: `${stats?.total_sujets || popularSujets.length} sujets`
              // },
              { 
                label: 'Recommandations analysées', 
                progress: Math.min(recommendations.length * 33, 100),
                details: `${recommendations.length} recommandation${recommendations.length > 1 ? 's' : ''}`
              },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.details}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestion d'action personnalisée */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Conseil :</strong>{' '}
              {!preferences 
                ? 'Complétez vos préférences pour obtenir des recommandations plus précises.'
                : recommendations.length === 0
                ? 'Explorez plus de sujets pour recevoir des recommandations personnalisées.'
                : `${recommendations.length} recommandation${recommendations.length > 1 ? 's' : ''} vous attendent !`}
            </p>
          </div>

          {/* Mots-clés populaires */}
          {stats?.popular_keywords && stats.popular_keywords.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mots-clés populaires :</p>
              <div className="flex flex-wrap gap-2">
                {stats.popular_keywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {kw.keyword} ({kw.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Afficher quelques recommandations si disponibles */}
          {recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Aperçu des recommandations :</p>
              {recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="line-clamp-1">{rec.sujet.titre}</span>
                  <span className="text-green-600">{Math.round(rec.score)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}