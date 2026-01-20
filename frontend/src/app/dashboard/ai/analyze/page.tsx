'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Target,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Star,
  Clock,
  Download,
  Copy,
  Share2,
  ChevronRight,
  BookOpen,
  Users,
  FileText,
  Loader2,
  X,
  BrainCircuit,
  Sparkle,
  Bookmark,
  Save
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'


interface Analysis {
  pertinence: number
  points_forts: string[]
  points_faibles: string[]
  suggestions: string[]
  recommandations: string[]
}

// Définir demoAnalysis avec le bon type
const demoAnalysis: Analysis = {
  pertinence: 85,
  points_forts: [
    'Problématique claire et bien définie',
    'Domaine d\'étude actuel et pertinent',
    'Portée de recherche bien délimitée',
    'Applications pratiques évidentes'
  ],
  points_faibles: [
    'Méthodologie à préciser davantage',
    'Nécessite des compétences spécifiques en analyse de données',
    'Accès aux données peut être limité'
  ],
  suggestions: [
    'Ajouter une étude comparative avec d\'autres pays',
    'Inclure des entretiens avec des professionnels de santé',
    'Prévoir un volet quantitatif avec questionnaire',
    'Considérer les différences culturelles dans l\'analyse'
  ],
  recommandations: [
    'Sujet recommandé pour un mémoire de Master',
    'Potentiel de publication dans des revues spécialisées',
    'Opportunités de collaboration avec des institutions',
    'Réel impact sur les politiques universitaires'
  ]
}


export default function AIAnalyzePage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [sujetData, setSujetData] = useState({
    titre: '',
    description: '',
    domaine: '',
    niveau: '',
    faculté: '',
    problématique: '',
    keywords: ''
  })
  const [step, setStep] = useState(1)

  // États pour les modals
  const [showAnalyzingModal, setShowAnalyzingModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showExampleModal, setShowExampleModal] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSujetData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const analyzeSujet = async () => {
    if (!sujetData.titre.trim() || !sujetData.description.trim()) {
      toast.error('Veuillez remplir au moins le titre et la description')
      return
    }

    try {
      setAnalyzing(true)
      setShowAnalyzingModal(true)

      // Simulation de délai pour l'expérience utilisateur
      await new Promise(resolve => setTimeout(resolve, 1500))

      const result = await api.analyzeSubject(sujetData)
      setAnalysis(result)
      setStep(2)

      // Fermer le modal d'analyse et ouvrir le modal de résultats
      setShowAnalyzingModal(false)
      setTimeout(() => {
        setShowResultsModal(true)
      }, 300)

      toast.success('Analyse terminée avec succès !')
    } catch (error: any) {
      setShowAnalyzingModal(false)
      toast.error(error.message || 'Erreur lors de l\'analyse')
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const quickAnalyze = () => {
    setSujetData({
      titre: 'Impact des réseaux sociaux sur la santé mentale des étudiants',
      description: 'Analyse de l\'influence des plateformes de réseaux sociaux sur le bien-être psychologique des étudiants universitaires, avec focus sur les mécanismes d\'addiction et les stratégies de prévention.',
      domaine: 'Psychologie',
      niveau: 'Master',
      faculté: 'Sciences Humaines',
      problématique: 'Comment l\'usage intensif des réseaux sociaux affecte-t-il la santé mentale des étudiants et quelles solutions peuvent être mises en place ?',
      keywords: 'réseaux sociaux, santé mentale, étudiants, addiction, prévention'
    })

    setShowExampleModal(true)
  }

  const resetAnalysis = () => {
    setAnalysis(null)
    setSujetData({
      titre: '',
      description: '',
      domaine: '',
      niveau: '',
      faculté: '',
      problématique: '',
      keywords: ''
    })
    setStep(1)
    setShowResultsModal(false)
  }

  const saveAnalysis = async () => {
    try {
      const savedSujet = await api.saveChosenSubject({
        ...sujetData,
        méthodologie: 'Analyse qualitative et quantitative',
        difficulté: 'moyenne',
        durée_estimée: '6 mois',
        interests: [sujetData.domaine, ...sujetData.keywords.split(',').map(k => k.trim())]
      })

      toast.success('Sujet enregistré dans vos créations !')
      setShowResultsModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  // Analyse de démo
  const demoAnalysis = {
    pertinence: 85,
    points_forts: [
      'Problématique claire et bien définie',
      'Domaine d\'étude actuel et pertinent',
      'Portée de recherche bien délimitée',
      'Applications pratiques évidentes'
    ],
    points_faibles: [
      'Méthodologie à préciser davantage',
      'Nécessite des compétences spécifiques en analyse de données',
      'Accès aux données peut être limité'
    ],
    suggestions: [
      'Ajouter une étude comparative avec d\'autres pays',
      'Inclure des entretiens avec des professionnels de santé',
      'Prévoir un volet quantitatif avec questionnaire',
      'Considérer les différences culturelles dans l\'analyse'
    ],
    recommandations: [
      'Sujet recommandé pour un mémoire de Master',
      'Potentiel de publication dans des revues spécialisées',
      'Opportunités de collaboration avec des institutions',
      'Réel impact sur les politiques universitaires'
    ]
  }

  // Modal d'analyse en cours
  const AnalyzingModal = () => (
    <AnimatePresence>
      {showAnalyzingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Header du modal */}
            <div className="bg-blue-500 dark:bg-blue-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Analyse en cours</h3>
                    <p className="text-blue-100 text-sm">MemoBot analyse votre sujet...</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalyzingModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6">
              {/* Animation de chargement */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-blue-600" />
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Analyse IA en cours
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Notre intelligence artificielle examine votre sujet en détail...
                  </p>

                  {/* Points d'analyse */}
                  <div className="mt-6 space-y-2">
                    {[
                      { text: 'Analyse de pertinence...', color: 'bg-blue-500' },
                      { text: 'Évaluation de la problématique...', color: 'bg-purple-500' },
                      { text: 'Détection des points forts...', color: 'bg-green-500' },
                      { text: 'Suggestions d\'amélioration...', color: 'bg-yellow-500' }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progression</span>
                  <span>{analyzing ? 'Analyse...' : 'Terminé'}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: '0%' }}
                    animate={{ width: analyzing ? '80%' : '100%' }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Veuillez patienter, cela peut prendre quelques secondes...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Modal de résultats
  const ResultsModal = () => (
    <AnimatePresence>
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header du modal */}
            <div className="bg-blue-500 dark:bg-blue-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Résultats de l'analyse IA</h3>
                    <p className="text-blue-100">{sujetData.titre}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Score de pertinence */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Score de pertinence
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Évaluation globale de votre sujet par notre IA
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="text-5xl font-bold text-gray-900 dark:text-white">
                        {analysis?.pertinence || demoAnalysis.pertinence}%
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium absolute -bottom-2 right-0 ${(analysis?.pertinence || demoAnalysis.pertinence) >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        (analysis?.pertinence || demoAnalysis.pertinence) >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {(analysis?.pertinence || demoAnalysis.pertinence) >= 80 ? 'EXCELLENT' :
                          (analysis?.pertinence || demoAnalysis.pertinence) >= 60 ? 'BON' : 'À AMÉLIORER'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis?.pertinence || demoAnalysis.pertinence}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Grille d'analyse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Points forts */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Points forts</h4>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.points_forts || demoAnalysis.points_forts).map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Points faibles */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Points à améliorer</h4>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.points_faibles || demoAnalysis.points_faibles).map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Suggestions</h4>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.suggestions || demoAnalysis.suggestions).map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommandations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Recommandations</h4>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.recommandations || demoAnalysis.recommandations).map((recommandation: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recommandation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Évaluation finale */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Évaluation finale</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {(analysis?.pertinence || demoAnalysis.pertinence) >= 80
                    ? "🎉 Excellent sujet ! Bien structuré, pertinent et avec un fort potentiel de recherche. Idéal pour un mémoire de qualité."
                    : (analysis?.pertinence || demoAnalysis.pertinence) >= 60
                      ? "👍 Bon sujet, nécessitant quelques ajustements pour optimiser sa pertinence. Avec les améliorations suggérées, il deviendra excellent."
                      : "💡 Sujet intéressant mais nécessitant une reformulation et un meilleur cadrage. Suivez nos suggestions pour l'améliorer."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => {
                  const report = `
Rapport d'analyse IA - ${sujetData.titre}

📊 SCORE DE PERTINENCE: ${analysis?.pertinence || demoAnalysis.pertinence}%

✅ POINTS FORTS:
${(analysis?.points_forts || demoAnalysis.points_forts).map((p: string) => `• ${p}`).join('\n')}

⚠️ POINTS À AMÉLIORER:
${(analysis?.points_faibles || demoAnalysis.points_faibles).map((p: string) => `• ${p}`).join('\n')}

💡 SUGGESTIONS:
${(analysis?.suggestions || demoAnalysis.suggestions).map((s: string) => `• ${s}`).join('\n')}

⭐ RECOMMANDATIONS:
${(analysis?.recommandations || demoAnalysis.recommandations).map((r: string) => `• ${r}`).join('\n')}

📝 ÉVALUATION FINALE:
${(analysis?.pertinence || demoAnalysis.pertinence) >= 80
                      ? "Excellent sujet ! Bien structuré, pertinent et avec un fort potentiel de recherche."
                      : (analysis?.pertinence || demoAnalysis.pertinence) >= 60
                        ? "Bon sujet, nécessitant quelques ajustements pour optimiser sa pertinence."
                        : "Sujet intéressant mais nécessitant une reformulation et un meilleur cadrage."}

---
Analyse générée par MemoBot AI
  `.trim()

                  navigator.clipboard.writeText(report)
                  toast.success('Rapport copié dans le presse-papier')
                }}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier le rapport</span>
                </button>

                <button
                  onClick={saveAnalysis}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 dark:bg-blue-900 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer le sujet</span>
                </button>

                <button
                  onClick={() => {
                    setShowResultsModal(false)
                    setTimeout(resetAnalysis, 300)
                  }}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Nouvelle analyse</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div >
      )
      }
    </AnimatePresence >
  )

  // Modal d'exemple
  const ExampleModal = () => (
    <AnimatePresence>
      {showExampleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-blue-500 dark:bg-blue-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Exemple chargé</h3>
                    <p className="text-blue-100 text-sm">Sujet démonstration prêt</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExampleModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Sujet d'exemple chargé :
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-300 font-medium">
                    {sujetData.titre}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                    {sujetData.description.substring(0, 100)}...
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Analyse complète</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Obtenez une analyse détaillée de ce sujet
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Suggestions IA</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Améliorations proposées par notre intelligence artificielle
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Score de pertinence</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Évaluation détaillée de la qualité du sujet
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowExampleModal(false)
                    analyzeSujet()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 dark:bg-blue-900 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyser ce sujet</span>
                </button>

                <button
                  onClick={() => setShowExampleModal(false)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Personnaliser
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AnalyzingModal />
      <ResultsModal />
      <ExampleModal />

      {/* En-tête principal */}
      <div className="bg-blue-500 dark:bg-blue-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-7 h-7" />
              Analyse IA de Sujet
            </h1>
            <p className="text-blue-100 mt-2">
              Obtenez une analyse détaillée de votre sujet de mémoire par notre intelligence artificielle
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Étapes de progression */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-blue-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Informations</span>
            </div>

            <ChevronRight className="w-5 h-5 text-blue-300" />

            <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-blue-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Analyse</span>
            </div>

            <ChevronRight className="w-5 h-5 text-blue-300" />

            <div className={`flex items-center ${analysis ? 'text-white' : 'text-blue-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${analysis ? 'bg-white text-blue-600' : 'bg-white/20'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Résultats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'analyse */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Détails du sujet
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du sujet *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={sujetData.titre}
                  onChange={handleInputChange}
                  placeholder="Ex: Impact des réseaux sociaux sur la santé mentale des étudiants"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  name="description"
                  value={sujetData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez votre sujet en détail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domaine
                  </label>
                  <input
                    type="text"
                    name="domaine"
                    value={sujetData.domaine}
                    onChange={handleInputChange}
                    placeholder="Ex: Psychologie, Informatique..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Niveau
                  </label>
                  <select
                    name="niveau"
                    value={sujetData.niveau}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez un niveau</option>
                    <option value="Licence">Licence</option>
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="Professionnel">Professionnel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Faculté / École
                  </label>
                  <input
                    type="text"
                    name="faculté"
                    value={sujetData.faculté}
                    onChange={handleInputChange}
                    placeholder="Ex: Sciences Humaines, Génie..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mots-clés
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={sujetData.keywords}
                    onChange={handleInputChange}
                    placeholder="Ex: réseaux sociaux, santé mentale, étudiants"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Problématique principale
                </label>
                <textarea
                  name="problématique"
                  value={sujetData.problématique}
                  onChange={handleInputChange}
                  placeholder="Quelle est la question de recherche centrale ?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={analyzeSujet}
                disabled={analyzing || !sujetData.titre.trim() || !sujetData.description.trim()}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 dark:bg-blue-900 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyser avec IA</span>
                  </>
                )}
              </button>

              <button
                onClick={quickAnalyze}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Charger un exemple</span>
              </button>

              <button
                onClick={resetAnalysis}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Statistiques IA */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Statistiques d'analyse
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sujets analysés</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">1,250+</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taux de pertinence</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">92%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Temps moyen</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">15s</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs satisfaits</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">98%</span>
              </div>
            </div>
          </div>

          {/* Guide d'analyse */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Conseils pour une bonne analyse
            </h3>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Titre précis</strong> - Soyez concis mais descriptif
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Description complète</strong> - Incluez contexte et objectifs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Problématique claire</strong> - Une question de recherche précise
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section exemple */}
      {!analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Besoin d'inspiration ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Essayez notre exemple prédéfini pour découvrir les capacités de notre IA
              </p>
            </div>
            <button
              onClick={quickAnalyze}
              className="px-6 py-3 bg-blue-500 dark:bg-blue-900 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Sparkle className="w-5 h-5" />
              <span>Voir un exemple d'analyse</span>
            </button>
          </div>
        </div>
      )}

      {/* Fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analyse approfondie
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Évaluation complète de la pertinence, originalité et faisabilité de votre sujet.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Suggestions personnalisées
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Recommandations spécifiques pour améliorer la qualité de votre recherche.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Enregistrement facile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sauvegardez votre sujet analysé directement dans votre espace personnel.
          </p>
        </div>
      </div>
    </div>
  )
}