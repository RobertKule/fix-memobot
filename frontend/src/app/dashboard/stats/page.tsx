// src/app/dashboard/stats/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Eye, 
  Heart,
  Clock,
  Calendar,
  Award,
  PieChart,
  LineChart,
  Download,
  Filter,
  ChevronDown,
  Star,
  BookOpen,
  Zap,
  Brain
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface StatsData {
  totalSubjects: number
  totalViews: number
  totalLikes: number
  userEngagement: number
  popularDomains: Array<{ name: string; count: number }>
  monthlyActivity: Array<{ month: string; count: number }>
  userStats: {
    explored: number
    saved: number
    interested: number
    generated: number
  }
}

export default function StatsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'activity'>('overview')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Récupérer les données statistiques
      const popularSujets = await api.getPopularSujets(20)
      const domains = await api.getDomainsStats()
      const keywords = await api.getPopularKeywords(10)
      
      // Calculer les statistiques
      const totalSubjects = popularSujets.length
      const totalViews = popularSujets.reduce((sum, sujet) => sum + sujet.vue_count, 0)
      const totalLikes = popularSujets.reduce((sum, sujet) => sum + sujet.like_count, 0)
      
      // Simuler l'engagement utilisateur
      const userEngagement = Math.floor(Math.random() * 100)
      
      // Statistiques utilisateur simulées
      const userStats = {
        explored: Math.floor(Math.random() * 50),
        saved: Math.floor(Math.random() * 20),
        interested: Math.floor(Math.random() * 10),
        generated: Math.floor(Math.random() * 5)
      }
      
      // Données mensuelles simulées
      const monthlyActivity = [
        { month: 'Jan', count: Math.floor(Math.random() * 100) },
        { month: 'Fév', count: Math.floor(Math.random() * 120) },
        { month: 'Mar', count: Math.floor(Math.random() * 150) },
        { month: 'Avr', count: Math.floor(Math.random() * 180) },
        { month: 'Mai', count: Math.floor(Math.random() * 200) },
        { month: 'Juin', count: Math.floor(Math.random() * 220) },
      ]
      
      setStats({
        totalSubjects,
        totalViews,
        totalLikes,
        userEngagement,
        popularDomains: domains.slice(0, 5).map(d => ({ name: d.domaine, count: d.count })),
        monthlyActivity,
        userStats
      })
      
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const handleExportStats = () => {
    if (!stats) return
    
    const exportData = {
      ...stats,
      exportDate: new Date().toISOString(),
      user: user?.email
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memo-bot-stats-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Statistiques exportées')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Aucune donnée statistique disponible
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Commencez à explorer des sujets pour générer des statistiques
        </p>
      </div>
    )
  }

  const engagementLevel = 
    stats.userEngagement >= 80 ? 'Élevé' :
    stats.userEngagement >= 50 ? 'Moyen' : 'Faible'
  
  const engagementColor = 
    stats.userEngagement >= 80 ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' :
    stats.userEngagement >= 50 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
    'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analysez votre activité et les tendances de la plateforme
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">12 derniers mois</option>
          </select>
          <button
            onClick={handleExportStats}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'domains'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Domaines
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Activité
        </button>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Stats principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubjects}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sujets disponibles</div>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total de vues</div>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total de likes</div>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.userEngagement}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Engagement utilisateur</div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Vos statistiques */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Votre activité</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.userStats.explored}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sujets explorés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.userStats.saved}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sujets sauvegardés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.userStats.interested}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sujets intéressants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.userStats.generated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sujets générés</div>
              </div>
            </div>
          </div>

          {/* Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Votre niveau d'engagement</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Score d'engagement</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${engagementColor}`}>
                    {engagementLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.userEngagement}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recommandations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Explorez plus de sujets</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Visitez 5 sujets supplémentaires pour augmenter votre score
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Star className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Marquez vos intérêts</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Indiquez les sujets qui vous intéressent pour des recommandations personnalisées
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Domaines */}
      {activeTab === 'domains' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Domaines les plus populaires</h3>
            <div className="space-y-4">
              {stats.popularDomains.map((domain, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {domain.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{domain.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(domain.count / Math.max(...stats.popularDomains.map(d => d.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white min-w-[2rem] text-right">
                      {domain.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Répartition par domaine</h3>
              <div className="space-y-4">
                {stats.popularDomains.map((domain, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500']
                  const percentage = Math.round((domain.count / stats.popularDomains.reduce((sum, d) => sum + d.count, 0)) * 100)
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{domain.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tendances</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Domaine en croissance</div>
                  <div className="font-medium text-gray-900 dark:text-white">Intelligence Artificielle</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+32% ce mois-ci</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Domaine stable</div>
                  <div className="font-medium text-gray-900 dark:text-white">Développement Web</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">±5% ce mois-ci</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activité */}
      {activeTab === 'activity' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activité mensuelle</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Consultations</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 flex items-end gap-3">
              {stats.monthlyActivity.map((month, index) => {
                const maxCount = Math.max(...stats.monthlyActivity.map(m => m.count))
                const height = (month.count / maxCount) * 100
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center">
                      <div 
                        className="w-3/4 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{month.month}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{month.count}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Heures d'activité</h3>
              <div className="space-y-3">
                {[
                  { hour: '8h-10h', activity: 'Élevée' },
                  { hour: '10h-12h', activity: 'Très élevée' },
                  { hour: '12h-14h', activity: 'Moyenne' },
                  { hour: '14h-16h', activity: 'Élevée' },
                  { hour: '16h-18h', activity: 'Très élevée' },
                  { hour: '18h-20h', activity: 'Moyenne' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">{item.hour}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      item.activity === 'Très élevée' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      item.activity === 'Élevée' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {item.activity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Points d'amélioration</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Augmentez vos interactions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Likez et sauvegardez plus de sujets pour améliorer vos recommandations
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Explorez en profondeur</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Passez plus de temps sur chaque sujet pour mieux comprendre
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Utilisez l'assistant IA</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Posez des questions à l'IA pour approfondir vos recherches
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Résumé */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-800 dark:to-cyan-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">Votre progression ce mois</h3>
            <p className="text-blue-100">
              Vous avez exploré {stats.userStats.explored} sujets et généré {stats.userStats.generated} suggestions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.userEngagement}/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}