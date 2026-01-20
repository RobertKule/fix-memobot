// src/app/dashboard/recommendations/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Filter, Star, TrendingUp, Clock, BookOpen, Target,
  ChevronRight, Download, Share2, Bookmark, Check, X,
  Sparkles, BarChart, Users, Heart, Search, AlertCircle,
  Loader2, Brain, Zap, Eye, ChevronLeft, Info, HelpCircle,
  Plus, Tag, MessageSquare, RefreshCw, Save, Bot, User, Send
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api, RecommendedSujet, Sujet, UserPreference } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

// Composants
import ChatModal from '@/components/ChatModal'

// Types
interface RecommendationFilters {
  interests: string[]
  niveau: string
  faculté: string
  domaine: string
  difficulté: string
  limit: number
  query?: string
}
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
  timestamp: Date
}

// Données statiques
const suggestedInterests = [
  "IA", "Machine Learning", "Deep Learning", "Data Science", "Big Data",
  "Cybersécurité", "Réseaux", "Cloud Computing", "DevOps", "Développement Web",
  "Développement Mobile", "Blockchain", "IoT", "Robotique", "Automatisation",
  "Énergie renouvelable", "Développement durable", "Matériaux avancés",
  "Nanotechnologie", "Simulation numérique", "CFD", "CAO", "Smart Cities",
  "Transport intelligent", "Génie logiciel", "Base de données",
  "Traitement d'images", "Vision par ordinateur", "Traitement du langage naturel",
  "Reconnaissance vocale"
]

const domains = [
  "Génie Informatique", "Génie Électrique", "Génie Électronique",
  "Génie Mécanique", "Génie Civil"
]

const levels = ["L1", "L2", "L3", "M1", "M2", "Doctorant"]
const difficulties = ["facile", "moyenne", "difficile"]

// Nouvelles couleurs basées sur la page chat
const COLORS = {
  // Couleurs principales (bleu gradient)
  primary: {
    from: 'from-blue-500',
    to: 'to-blue-600',
    darkFrom: 'dark:from-blue-600',
    darkTo: 'dark:to-blue-700',
    hoverFrom: 'hover:from-blue-600',
    hoverTo: 'hover:to-blue-700',
    darkHoverFrom: 'dark:hover:from-blue-700',
    darkHoverTo: 'dark:hover:to-blue-800',
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    darkBg: 'dark:from-blue-600 dark:to-blue-700',
    hoverBg: 'hover:from-blue-600 hover:to-blue-700',
    darkHoverBg: 'dark:hover:from-blue-700 dark:hover:to-blue-800',
    light: 'from-blue-50 to-blue-100',
    darkLight: 'dark:from-blue-900/10 dark:to-blue-800/10',
    text: 'text-blue-500',
    darkText: 'dark:text-blue-400'
  },
  // Couleurs secondaires (vert gradient)
  secondary: {
    from: 'from-blue-500',
    to: 'to-blue-600',
    darkFrom: 'dark:from-blue-600',
    darkTo: 'dark:to-blue-700',
    hoverFrom: 'hover:from-blue-600',
    hoverTo: 'hover:to-blue-700',
    darkHoverFrom: 'dark:hover:from-blue-700',
    darkHoverTo: 'dark:hover:to-blue-800',
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    darkBg: 'dark:from-blue-600 dark:to-blue-700',
    hoverBg: 'hover:from-blue-600 hover:to-blue-700',
    darkHoverBg: 'dark:hover:from-blue-700 dark:hover:to-blue-800'
  },
  // Couleurs d'accent (violet gradient)
  accent: {
    from: 'from-blue-500',
    to: 'to-blue-600',
    darkFrom: 'dark:from-blue-600',
    darkTo: 'dark:to-blue-700',
    hoverFrom: 'hover:from-blue-600',
    hoverTo: 'hover:to-blue-700',
    darkHoverFrom: 'dark:hover:from-blue-700',
    darkHoverTo: 'dark:hover:to-blue-800',
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    darkBg: 'dark:from-blue-600 dark:to-blue-700',
    hoverBg: 'hover:from-blue-600 hover:to-blue-700',
    darkHoverBg: 'dark:hover:from-blue-700 dark:hover:to-blue-800',
    light: 'from-blue-100 to-blue-200',
    darkLight: 'dark:from-blue-900/10 dark:to-blue-800/10'
  },
  // Couleurs de danger (rouge gradient)
  danger: {
    from: 'from-red-500',
    to: 'to-red-600',
    darkFrom: 'dark:from-red-600',
    darkTo: 'dark:to-red-700',
    hoverFrom: 'hover:from-red-600',
    hoverTo: 'hover:to-red-700',
    darkHoverFrom: 'dark:hover:from-red-700',
    darkHoverTo: 'dark:hover:to-red-800',
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    darkBg: 'dark:from-red-600 dark:to-red-700',
    hoverBg: 'hover:from-red-600 hover:to-red-700',
    darkHoverBg: 'dark:hover:from-red-700 dark:hover:to-red-800'
  },
  // Couleurs neutres (gris gradient)
  neutral: {
    bg: 'bg-gray-100',
    darkBg: 'dark:bg-gray-800',
    hoverBg: 'hover:bg-gray-200',
    darkHoverBg: 'dark:hover:bg-gray-700',
    border: 'border-gray-200',
    darkBorder: 'dark:border-gray-700',
    text: 'text-gray-700',
    darkText: 'dark:text-gray-300'
  }
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // États principaux
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedSujet[]>([])
  const [savedSujets, setSavedSujets] = useState<number[]>([])
  
  // États IA
  const [aiGeneratedSubjects, setAiGeneratedSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [showSubjectSelector, setShowSubjectSelector] = useState(false)
  const [generationSessionId, setGenerationSessionId] = useState<string>('')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [showChat, setShowChat] = useState(false)
  
  // États filtres
  const [filters, setFilters] = useState<RecommendationFilters>({
    interests: [],
    niveau: '',
    faculté: '',
    domaine: '',
    difficulté: '',
    limit: 10
  })
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null)
  const [allSujets, setAllSujets] = useState<Sujet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [customInterest, setCustomInterest] = useState('')
  const [message, setMessage] = useState('')

  // Vérifier si les intérêts sont vides
useEffect(() => {
  if (!loading && !error && filters.interests.length === 0) {
    // Petit délai pour que l'UI se charge d'abord
    const timer = setTimeout(() => {
      setShowInterestsModal(true)
    }, 500)
    return () => clearTimeout(timer)
  }
}, [loading, error, filters.interests])

  // Charger les données initiales
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Charger les préférences utilisateur
      const preferences = await api.getPreferences()
      setUserPreferences(preferences)

      // Extraire les intérêts des préférences
      let interestsList: string[] = []
      if (preferences.interests?.trim()) {
        interestsList = preferences.interests.split(',')
          .map((interest: string) => interest.trim())
          .filter(Boolean)
      }

      setFilters(prev => ({
        ...prev,
        interests: interestsList,
        niveau: preferences.level || '',
        faculté: preferences.faculty || ''
      }))

      // Charger les sujets pour référence
      const sujets = await api.getSujets()
      setAllSujets(sujets)

      // Générer des recommandations initiales si on a des intérêts
      if (interestsList.length > 0) {
        await generateRecommendations()
      }

    } catch (err: any) {
      console.error('Error fetching initial data:', err)
      setError(err.message || 'Erreur lors du chargement des données')
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Générer 3 sujets avec IA
  const generateThreeSubjects = useCallback(async () => {
    try {
      setGenerating(true)

      if (!filters.interests.length) {
        toast.error('Veuillez spécifier vos intérêts d\'abord')
        setShowInterestsModal(true)
        return
      }

      const response = await api.generateThreeSubjects({
        interests: filters.interests,
        domaine: filters.domaine || 'Génie Informatique',
        niveau: filters.niveau || 'M2',
        faculté: filters.faculté || 'Sciences'
      })

      setAiGeneratedSubjects(response.subjects)
      setGenerationSessionId(response.session_id)
      setShowSubjectSelector(true)

      toast.success('🎯 3 sujets générés avec IA !')

    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }, [filters])

  // Sauvegarder un sujet choisi

const saveChosenSubject = useCallback(async (subject: any) => {
  try {
    setGenerating(true)
    
    const savingToast = toast.loading(
      <div className="flex items-center gap-3">
        <div className="w-8 h-8">
          <Save className="w-6 h-6 text-blue-600 animate-pulse-subtle" />
        </div>
        <div>
          <p className="font-medium">MemoBot enregistre votre choix... 💾</p>
          <p className="text-sm text-gray-600">Sauvegarde dans votre collection personnelle</p>
        </div>
      </div>,
      { id: 'saving-subject' }
    )

    // Normaliser les données avant envoi
    const sujetData = {
      titre: subject.titre || 'Sujet sans titre',
      description: subject.description || 'Description à compléter',
      keywords: subject.keywords || subject.keywords || '',
      domaine: subject.domaine || filters.domaine || 'Génie Informatique',
      niveau: subject.niveau || filters.niveau || 'M2',
      faculté: subject.faculté || filters.faculté || 'Sciences',
      problématique: subject.problématique || subject.problematic || subject.description || 'Problématique à définir',
      méthodologie: subject.methodologie || subject.méthodologie || 'Méthodologie à définir',
      difficulté: (subject.difficulté || 'moyenne').toLowerCase(),
      durée_estimée: subject.durée_estimée || '6 mois',
      interests: filters.interests
    };

    console.log('📤 Envoi des données:', sujetData);

    const savedSujet = await api.saveChosenSubject(sujetData)

    // Fermer le toast de chargement
    toast.dismiss('saving-subject')
    
    // Afficher le succès
    toast.success(
      <div className="flex items-center gap-3">
        <Check className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium">Sujet sauvegardé avec succès ! ✅</p>
          <p className="text-sm text-gray-600">Redirection vers votre collection...</p>
        </div>
      </div>,
      { duration: 3000 }
    )

    setSelectedSubject(subject)
    setShowSubjectSelector(false)

    // Rediriger vers le sujet spécifique
    setTimeout(() => {
      router.push(`/dashboard/sujets/${savedSujet.id}`)
    }, 2000)

  } catch (err: any) {
    toast.dismiss('saving-subject')
    console.error('❌ Erreur sauvegarde:', err)
    toast.error(
      <div className="flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <div>
          <p className="font-medium">Erreur lors de la sauvegarde</p>
          <p className="text-sm text-gray-600">{err.message}</p>
        </div>
      </div>
    )
  } finally {
    setGenerating(false)
  }
}, [filters, router])

  // Générer des recommandations
  const generateRecommendations = useCallback(async (customFilters?: Partial<RecommendationFilters>) => {
    if (!user?.id) return

    try {
      setGenerating(true)

      const finalFilters = customFilters ? { ...filters, ...customFilters } : filters

      if (!finalFilters.interests.length) {
        toast.error('Veuillez spécifier au moins un intérêt')
        setShowInterestsModal(true)
        return
      }

      const aiRecommendations = await api.recommendSujets({
        interests: finalFilters.interests,
        niveau: finalFilters.niveau,
        faculté: finalFilters.faculté,
        domaine: finalFilters.domaine,
        difficulté: finalFilters.difficulté as 'facile' | 'moyenne' | 'difficile' | undefined,
        limit: finalFilters.limit
      })

      setRecommendations(aiRecommendations)

      if (aiRecommendations.length === 0) {
        toast.info('ℹ️ Aucune recommandation trouvée avec ces critères')
      } else {
        toast.success(`✅ ${aiRecommendations.length} recommandations générées`)
      }

    } catch (err: any) {
      console.error('Error generating recommendations:', err)
      toast.error(err.message || 'Erreur lors de la génération des recommandations')
    } finally {
      setGenerating(false)
    }
  }, [user, filters])

  // Sauvegarder un sujet
  const handleSaveSujet = useCallback(async (sujetId: number) => {
    try {
      if (savedSujets.includes(sujetId)) {
        setSavedSujets(prev => prev.filter(id => id !== sujetId))
        toast.success('📝 Sujet retiré des sauvegardés')
      } else {
        setSavedSujets(prev => [...prev, sujetId])
        toast.success('💾 Sujet sauvegardé')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    }
  }, [savedSujets])

  // Marquer comme intéressé
  const handleMarkAsInterested = useCallback(async (sujetId: number) => {
    try {
      await api.submitFeedback({
        sujet_id: sujetId,
        intéressé: true,
        commentaire: message || 'Intéressé par ce sujet'
      })

      toast.success('👍 Intérêt enregistré')
      setMessage('')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement')
    }
  }, [message])

  // Générer avec IA (ancienne méthode)
const handleGenerateWithAI = async () => {
  try {
    setGenerating(true)

    if (!filters.interests.length) {
      toast.error('Veuillez spécifier vos intérêts d\'abord')
      setShowInterestsModal(true)
      return
    }

    // Utilisez generateThreeSubjects au lieu de generateSubjects
    const response = await api.generateThreeSubjects({
      interests: filters.interests,
      domaine: filters.domaine || 'Génie Informatique',
      niveau: filters.niveau || 'M2',
      faculté: filters.faculté || 'Sciences'
    })

    // Transformez la réponse pour la compatibilité
    const aiSujets: RecommendedSujet[] = response.subjects.map((subject: any, index: number) => ({
      sujet: {
        id: 1000 + index,
        titre: subject.titre,
        description: subject.description,
        keywords: subject.keywords,
        domaine: subject.domaine || filters.domaine || 'Génie Informatique',
        niveau: subject.niveau || filters.niveau || 'M2',
        faculté: subject.faculté || filters.faculté || 'Sciences',
        problématique: subject.problématique || subject.description,
        méthodologie: subject.methodologie || subject.méthodologie || 'Méthodologie à définir',
        difficulté: subject.difficulté || 'moyenne',
        durée_estimée: subject.durée_estimée || '6 mois',
        vue_count: 0,
        like_count: 0,
        is_active: true,
        created_at: new Date().toISOString()
      } as Sujet,
      score: Math.floor(Math.random() * 30) + 70,
      raisons: [
        'Généré par IA selon vos intérêts',
        'Problématique innovante',
        'Adapté à votre niveau académique'
      ],
      critères_respectés: [
        'Pertinence avec vos intérêts',
        'Niveau adapté',
        'Méthodologie définie'
      ]
    }))

    setRecommendations(aiSujets)
    toast.success('🤖 Sujets générés avec IA')

  } catch (err: any) {
    toast.error(err.message || 'Erreur lors de la génération IA')
  } finally {
    setGenerating(false)
  }
}

const handleGenerateWithAISmooth = async () => {
  try {
    setGenerating(true)
    
    // Afficher un toast de chargement
    const loadingToast = toast.loading(
      <div className="flex items-center gap-3">
        <div className="w-8 h-8">
          <div className="w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <p className="font-medium">MemoBot travaille pour vous... ✨</p>
          <p className="text-sm text-gray-600">Analyse de vos intérêts et génération de sujets IA</p>
        </div>
      </div>,
      { 
        duration: Infinity, // Reste affiché jusqu'à ce qu'on le ferme
        id: 'ai-generation' 
      }
    )

    if (!filters.interests.length) {
      toast.error('Veuillez spécifier vos intérêts d\'abord', { id: 'ai-generation' })
      setShowInterestsModal(true)
      return
    }

    // Utilisez generateThreeSubjects
    const response = await api.generateThreeSubjects({
      interests: filters.interests,
      domaine: filters.domaine || 'Génie Informatique',
      niveau: filters.niveau || 'M2',
      faculté: filters.faculté || 'Sciences'
    })

    // Fermer le toast de chargement
    toast.dismiss('ai-generation')
    
    // Afficher le succès
    toast.success(
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        <div>
          <p className="font-medium">3 sujets IA générés avec succès ! 🎉</p>
          <p className="text-sm text-gray-600">Choisissez celui qui vous inspire le plus</p>
        </div>
      </div>,
      { duration: 4000 }
    )

    setAiGeneratedSubjects(response.subjects)
    setGenerationSessionId(response.session_id)
    setShowSubjectSelector(true)

  } catch (err: any) {
    toast.dismiss('ai-generation')
    toast.error(
      <div className="flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <p className="font-medium">Erreur lors de la génération</p>
          <p className="text-sm text-gray-600">{err.message}</p>
        </div>
      </div>
    )
  } finally {
    setGenerating(false)
  }
}
  // Gestion des filtres
  const handleUpdateFilters = useCallback((updates: Partial<RecommendationFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters({
      interests: userPreferences?.interests?.split(',').map(i => i.trim()).filter(Boolean) || [],
      niveau: userPreferences?.level || '',
      faculté: userPreferences?.faculty || '',
      domaine: '',
      difficulté: '',
      limit: 10
    })
  }, [userPreferences])

 
const handleSaveInterests = useCallback(async () => {
  if (filters.interests.length === 0) {
    toast.error('Veuillez sélectionner au moins un intérêt')
    return
  }

  try {
    // Afficher un loader
    toast.loading('MemoBot enregistre vos préférences...', {
      id: 'saving-interests'
    })

    // Sauvegarder les préférences
    await api.updatePreferences({
      interests: filters.interests.join(', '),
      faculty: filters.faculté,
      level: filters.niveau
    })

    // Mettre à jour les préférences locales
    setUserPreferences(prev => prev ? {
      ...prev,
      interests: filters.interests.join(', '),
      faculty: filters.faculté,
      level: filters.niveau
    } : null)

    setShowInterestsModal(false)
    
    // Fermer le toast de chargement
    toast.dismiss('saving-interests')
    
    // Afficher le succès
    toast.success('✅ Préférences sauvegardées avec succès !')
    
    // Générer automatiquement des recommandations
    if (filters.interests.length >= 3) {
      setTimeout(() => {
        toast.info('🎯 MemoBot génère vos premières recommandations...')
        generateRecommendations()
      }, 1000)
    }

  } catch (err: any) {
    toast.dismiss('saving-interests')
    toast.error('Erreur lors de la sauvegarde des intérêts: ' + err.message)
  }
}, [filters, generateRecommendations])

  const toggleInterest = useCallback((interest: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }, [])

  const addCustomInterest = useCallback(() => {
    const trimmedInterest = customInterest.trim()
    if (trimmedInterest && !filters.interests.includes(trimmedInterest)) {
      setFilters(prev => ({
        ...prev,
        interests: [...prev.interests, trimmedInterest]
      }))
      setCustomInterest('')
    }
  }, [customInterest, filters.interests])

  // Chat avec IA
  const sendChatMessage = useCallback(async () => {
    if (!chatMessage.trim()) return

    try {
      const userMessage = chatMessage
      setChatMessage('')

      setChatHistory(prev => [...prev, {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }])

     const response = await api.chatWithAI({
  message: userMessage
})


console.log(response.message)


   const aiMessage: ChatMessage = {
  role: 'assistant',
  content: response.message,
  suggestions: response.suggestions,
  timestamp: new Date()
}

setChatHistory(prev => [...prev, aiMessage])




    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi du message')
    }
  }, [chatMessage])

  // Filtrage des recommandations
  const filteredRecommendations = useMemo(() => 
    recommendations.filter(rec =>
      rec.sujet.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sujet.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sujet.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [recommendations, searchQuery]
  )

  // Statistiques
  const stats = useMemo(() => ({
    totalRecommendations: recommendations.length,
    averageMatch: recommendations.length > 0
      ? Math.round(recommendations.reduce((acc, rec) => acc + rec.score, 0) / recommendations.length)
      : 0,
    highMatchCount: recommendations.filter(rec => rec.score >= 85).length,
    savedCount: savedSujets.length
  }), [recommendations, savedSujets])

  // Composant Modal d'intérêts
const InterestsModal = () => {
  // État local pour éviter les re-renders globaux
  const [localCustomInterest, setLocalCustomInterest] = useState('')
  const [localMessage, setLocalMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestedInterests)

  // Filtrer les suggestions sans re-render global
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSuggestions(suggestedInterests)
    } else {
      const filtered = suggestedInterests.filter(interest =>
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    }
  }, [searchTerm])

  // Fonction pour ajouter un intérêt localement
  const handleAddCustomInterest = () => {
    const trimmedInterest = localCustomInterest.trim()
    if (trimmedInterest && !filters.interests.includes(trimmedInterest)) {
      toggleInterest(trimmedInterest)
      setLocalCustomInterest('')
    }
  }

  // Fonction de sauvegarde améliorée avec auto-save
  const handleSaveInterestsOptimized = async () => {
    if (filters.interests.length === 0) {
      toast.error('Veuillez sélectionner au moins un intérêt')
      return
    }

    try {
      setIsSaving(true)
      
      // Toast de chargement élégant
      const toastId = toast.loading(
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">
            <div className="w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="font-medium">MemoBot enregistre vos préférences...</p>
            <p className="text-sm text-gray-600">Personnalisation de votre expérience</p>
          </div>
        </div>,
        { id: 'saving-interests-modal' }
      )

      // Sauvegarder les préférences
      await api.updatePreferences({
        interests: filters.interests.join(', '),
        faculty: filters.faculté || '',
        level: filters.niveau || '',
        additional_info: localMessage || ''
      })

      // Fermer le toast
      toast.dismiss(toastId)
      
      // Succès
      toast.success(
        <div className="flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium">Préférences sauvegardées ! ✅</p>
            <p className="text-sm text-gray-600">Votre profil est maintenant personnalisé</p>
          </div>
        </div>,
        { duration: 3000 }
      )

      // Fermer le modal
      setShowInterestsModal(false)
      
      // Auto-générer des recommandations si assez d'intérêts
      if (filters.interests.length >= 3) {
        setTimeout(() => {
          generateRecommendations()
        }, 1000)
      }

    } catch (err: any) {
      toast.dismiss('saving-interests-modal')
      toast.error(
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-medium">Erreur lors de la sauvegarde</p>
            <p className="text-sm text-gray-600">{err.message || 'Veuillez réessayer'}</p>
          </div>
        </div>
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Sauvegarde automatique quand on atteint 3 intérêts
  useEffect(() => {
    if (filters.interests.length === 3 && !isSaving) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveInterestsOptimized()
      }, 1500) // 1.5 secondes après la sélection du 3ème intérêt
      
      return () => clearTimeout(autoSaveTimer)
    }
  }, [filters.interests.length])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        <div className={`p-6 border-b ${COLORS.neutral.border} dark:${COLORS.neutral.darkBorder} bg-gradient-to-r ${COLORS.primary.light} dark:${COLORS.primary.darkLight}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${COLORS.primary.bg} ${COLORS.primary.darkBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {filters.interests.length === 0 ? 
                    "Bienvenue dans MemoBot! ✨" : 
                    "Personnalisez votre expérience"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filters.interests.length === 0 ?
                    "Sélectionnez vos centres d'intérêt pour commencer" :
                    `${filters.interests.length} intérêt(s) sélectionné(s)`}
                </p>
              </div>
            </div>
            {filters.interests.length > 0 && (
              <button
                onClick={() => setShowInterestsModal(false)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Progress bar automatique */}
          {filters.interests.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progression</span>
                <span>{filters.interests.length}/3 intérêts</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    filters.interests.length === 0 ? 'w-0' :
                    filters.interests.length === 1 ? 'w-1/3 bg-red-500' :
                    filters.interests.length === 2 ? 'w-2/3 bg-yellow-500' :
                    'w-full bg-green-500'
                  }`}
                />
              </div>
              {filters.interests.length < 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {3 - filters.interests.length} intérêt(s) supplémentaire(s) pour une personnalisation optimale
                </p>
              )}
            </div>
          )}

          {/* Intérêts sélectionnés - avec animation auto */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Vos intérêts sélectionnés
              {filters.interests.length >= 3 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  ✓ Prêt
                </span>
              )}
            </h3>
            
            {filters.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="group px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-2 text-sm font-medium shadow-sm border border-blue-200 dark:border-blue-800"
                  >
                    {interest}
                    <button
                      onClick={() => toggleInterest(interest)}
                      className="opacity-0 group-hover:opacity-100 transition-all hover:text-blue-900 dark:hover:text-blue-100"
                      disabled={isSaving}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl mb-4">
                <Tag className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Commencez par sélectionner vos centres d'intérêt
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Nous utiliserons ces informations pour personnaliser vos recommandations
                </p>
              </div>
            )}
          </div>

          {/* Suggestions d'intérêts avec recherche locale */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggestions populaires
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredSuggestions.length} suggestions
              </span>
            </div>
            
            {/* Barre de recherche locale */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un intérêt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
              {filteredSuggestions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  disabled={isSaving}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    filters.interests.includes(interest)
                      ? `${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white border-transparent shadow-md`
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {interest}
                </button>
              ))}
              {filteredSuggestions.length === 0 && (
                <div className="col-span-3 text-center py-4 text-gray-500 dark:text-gray-400">
                  Aucun résultat pour "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Ajouter un intérêt personnalisé - état local */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ajouter un intérêt personnalisé
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={localCustomInterest}
                onChange={(e) => setLocalCustomInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                placeholder="Votre intérêt spécifique..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                disabled={isSaving}
              />
              <button
                onClick={handleAddCustomInterest}
                disabled={!localCustomInterest.trim() || isSaving}
                className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>

          {/* Message optionnel - état local */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Précisions supplémentaires
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Optionnel
              </span>
            </div>
            <textarea
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              placeholder="Ex: Je suis particulièrement intéressé par l'IA appliquée à la santé, avec un focus sur l'apprentissage profond..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ces détails aideront MemoBot à mieux comprendre vos besoins spécifiques
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Sauvegarde en cours...</span>
                </div>
              ) : filters.interests.length === 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Sélectionnez au moins un intérêt pour continuer</span>
                </div>
              ) : filters.interests.length < 3 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Ajoutez {3 - filters.interests.length} intérêt(s) pour une personnalisation optimale</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Parfait ! Votre profil est personnalisé</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              {filters.interests.length > 0 && !isSaving && (
                <button
                  onClick={() => setShowInterestsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Fermer
                </button>
              )}
              
              <button
                onClick={handleSaveInterestsOptimized}
                disabled={filters.interests.length === 0 || isSaving}
                className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm flex items-center gap-2`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : filters.interests.length < 3 ? (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder ({filters.interests.length}/3)
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Sauvegarder et continuer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

  // États de chargement et erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des recommandations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
        <button
          onClick={fetchInitialData}
          className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-colors`}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <>
      {showInterestsModal && <InterestsModal />}

      <div className="space-y-6">
        {/* Banner si pas d'intérêts */}
        {filters.interests.length === 0 && !showInterestsModal && (
          <div className={`bg-gradient-to-r ${COLORS.primary.light} dark:${COLORS.primary.darkLight} border border-blue-200 dark:border-blue-800/30 rounded-2xl p-6 shadow-lg`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${COLORS.primary.bg} ${COLORS.primary.darkBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Personnalisez vos recommandations
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Pour générer des recommandations pertinentes, nous avons besoin de connaître vos centres d'intérêt.
                  Cela nous permettra de vous suggérer des sujets qui correspondent à vos aspirations académiques.
                </p>
                <button
                  onClick={() => setShowInterestsModal(true)}
                  className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all flex items-center gap-2 shadow-md`}
                >
                  <Tag className="w-4 h-4" />
                  Définir mes intérêts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* En-tête principal */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Recommandations IA</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {filters.interests.length > 0
                    ? `Sujets personnalisés basés sur vos intérêts : ${filters.interests.slice(0, 3).join(', ')}${filters.interests.length > 3 ? '...' : ''}`
                    : 'Définissez vos intérêts pour des recommandations personnalisées'
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilterPanel ? 'Masquer' : 'Afficher'} filtres
              </button>
              <button
                onClick={generateThreeSubjects}
                disabled={generating || filters.interests.length === 0}
                className={`px-4 py-2 ${COLORS.accent.bg} ${COLORS.accent.darkBg} text-white rounded-lg ${COLORS.accent.hoverBg} ${COLORS.accent.darkHoverBg} transition-all flex items-center gap-2 disabled:opacity-50 shadow-md`}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Générer 3 sujets IA
              </button>
              {/* REMPLACEZ le bouton ligne ~850 */}
<button
  onClick={handleGenerateWithAISmooth}  // <-- Utiliser la nouvelle fonction
  disabled={generating || filters.interests.length === 0}
  className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95`}
>
  {generating ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="animate-pulse">Génération...</span>
    </div>
  ) : (
    <>
      <Zap className="w-4 h-4" />
      Générer avec IA
    </>
  )}
</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Recommandations', value: stats.totalRecommendations, icon: Brain, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Match moyen', value: `${stats.averageMatch}%`, icon: Target, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Haut match (85%)', value: stats.highMatchCount, icon: Star, color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
            { label: 'Sujets sauvegardés', value: stats.savedCount, icon: Bookmark, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Panneau de filtres */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtres de recommandation</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowInterestsModal(true)}
                    className={`text-sm ${COLORS.primary.text} dark:${COLORS.primary.darkText} hover:${COLORS.primary.text}/80 transition-colors flex items-center gap-1`}
                  >
                    <Tag className="w-4 h-4" />
                    Modifier intérêts
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className={`text-sm ${COLORS.primary.text} dark:${COLORS.primary.darkText} hover:${COLORS.primary.text}/80 transition-colors`}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Intérêts actuels',
                    content: filters.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {filters.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800">
                            {interest}
                          </span>
                        ))}
                        {filters.interests.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            +{filters.interests.length - 3} autres
                          </span>
                        )}
                      </div>
                    ) : <span className="text-gray-500 dark:text-gray-400 italic">Aucun intérêt défini</span>
                  },
                  {
                    label: 'Niveau académique',
                    element: (
                      <select
                        value={filters.niveau}
                        onChange={(e) => handleUpdateFilters({ niveau: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      >
                        <option value="">Tous les niveaux</option>
                        {levels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    )
                  },
                  {
                    label: 'Difficulté',
                    element: (
                      <select
                        value={filters.difficulté}
                        onChange={(e) => handleUpdateFilters({ difficulté: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      >
                        <option value="">Toutes difficultés</option>
                        {difficulties.map(difficulty => (
                          <option key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </option>
                        ))}
                      </select>
                    )
                  },
                  {
                    label: 'Domaine',
                    element: (
                      <select
                        value={filters.domaine}
                        onChange={(e) => handleUpdateFilters({ domaine: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      >
                        <option value="">Tous les domaines</option>
                        {domains.map(domain => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    )
                  },
                  {
                    label: 'Faculté',
                    element: (
                      <input
                        type="text"
                        value={filters.faculté}
                        onChange={(e) => handleUpdateFilters({ faculté: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="Faculté des Sciences..."
                      />
                    )
                  },
                  {
                    label: 'Nombre de résultats',
                    element: (
                      <select
                        value={filters.limit}
                        onChange={(e) => handleUpdateFilters({ limit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      >
                        {[5, 10, 20, 50].map(num => (
                          <option key={num} value={num}>{num} résultats</option>
                        ))}
                      </select>
                    )
                  }
                ].map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                    </label>
                    {field.element || field.content}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    generateRecommendations()
                    setShowFilterPanel(false)
                  }}
                  disabled={generating || filters.interests.length === 0}
                  className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all flex items-center gap-2 disabled:opacity-50 shadow-md`}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recherche et génération */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {filteredRecommendations.length} recommandations trouvées
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Basées sur vos intérêts et préférences
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="search"
                  placeholder="Rechercher dans les recommandations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => generateRecommendations()}
                disabled={generating || filters.interests.length === 0}
                className={`px-4 py-2.5 ${COLORS.secondary.bg} ${COLORS.secondary.darkBg} text-white rounded-lg ${COLORS.secondary.hoverBg} ${COLORS.secondary.darkHoverBg} transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md`}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {recommendations.length > 0 ? 'Rafraîchir' : 'Générer'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal de sélection des 3 sujets */}
        {showSubjectSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
            >
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${COLORS.accent.light} dark:${COLORS.accent.darkLight}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choisissez votre sujet préféré</h2>
                      <p className="text-gray-600 dark:text-gray-400">L'IA a généré 3 sujets basés sur vos intérêts. Sélectionnez celui qui vous plaît le plus.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSubjectSelector(false)}
                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {aiGeneratedSubjects.map((subject, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border ${selectedSubject === subject ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800/30' : 'border-gray-200 dark:border-gray-700'} rounded-xl p-5 hover:shadow-xl transition-all cursor-pointer`}
                      onClick={() => setSelectedSubject(subject)}
                    >
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        selectedSubject === subject 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white border-2 border-blue-600 dark:border-blue-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedSubject === subject ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
                          Option {index + 1}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                        {subject.titre}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {subject.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          <span className="truncate">{subject.keywords.split(',').slice(0, 2).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <BookOpen className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          <span>{subject.domaine} • {subject.niveau}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          <span>{subject.durée_estimée} • {subject.difficulté}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className={`bg-gradient-to-r ${COLORS.primary.light} dark:${COLORS.primary.darkLight} border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 mb-6`}>
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Conseil</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choisissez le sujet qui correspond le mieux à vos aspirations. Une fois sélectionné, il sera sauvegardé dans votre collection personnelle et vous pourrez commencer à travailler dessus immédiatement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    {selectedSubject ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sélectionné: <span className="font-medium text-gray-900 dark:text-white">{selectedSubject.titre}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sélectionnez un sujet pour continuer
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowSubjectSelector(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Annuler
                    </button>
                    
                    <button
                      onClick={generateThreeSubjects}
                      className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 transition-all flex items-center gap-2 shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regénérer
                    </button>
                    
                    <button
                      onClick={() => selectedSubject && saveChosenSubject(selectedSubject)}
                      disabled={!selectedSubject}
                      className={`px-4 py-2 ${COLORS.secondary.bg} ${COLORS.secondary.darkBg} text-white rounded-lg ${COLORS.secondary.hoverBg} ${COLORS.secondary.darkHoverBg} transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder et continuer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            history={chatHistory}
            message={chatMessage}
            setMessage={setChatMessage}
            sendMessage={sendChatMessage}
          />
        )}

        {/* Bouton de chat flottant */}
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40 hover:scale-105"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Liste des recommandations */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRecommendations.map((recommendation, index) => {
              const sujet = recommendation.sujet
              const isSaved = savedSujets.includes(sujet.id)

              return (
                <motion.div
                  key={sujet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Contenu principal */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-3 py-1 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white text-sm font-medium rounded-full shadow-md`}>
                              {recommendation.score}% match
                            </span>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full shadow-sm ${
                              sujet.difficulté === 'facile' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                              sujet.difficulté === 'moyenne' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}>
                              {sujet.difficulté.charAt(0).toUpperCase() + sujet.difficulté.slice(1)}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full border border-gray-200 dark:border-gray-700">
                              {sujet.niveau}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {sujet.titre}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {sujet.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveSujet(sujet.id)}
                            className={`p-2 rounded-lg transition-all ${isSaved
                                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 shadow-sm'
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                          >
                            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleMarkAsInterested(sujet.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-800">
                          {sujet.domaine}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-800">
                          {sujet.faculté}
                        </span>
                        {sujet.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full border border-gray-200 dark:border-gray-700">
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Raisons de recommandation */}
                      {recommendation.raisons.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pourquoi ce sujet vous correspond :
                          </h4>
                          <ul className="space-y-1">
                            {recommendation.raisons.map((raison, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                {raison}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Critères respectés */}
                      {recommendation.critères_respectés.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Critères d'acceptation respectés :
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {recommendation.critères_respectés.map((critère, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800">
                                {critère}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Métadonnées */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {sujet.durée_estimée && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{sujet.durée_estimée}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{sujet.vue_count} vues</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{sujet.like_count} likes</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <div className="text-center mb-2">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {recommendation.score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Score de pertinence
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/sujets/${sujet.id}`}
                        className={`px-4 py-2.5 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
                      >
                        <Sparkles className="w-4 h-4" />
                        Explorer ce sujet
                      </Link>

                      <button className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Partager
                      </button>

                      <button className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <BarChart className="w-4 h-4" />
                        Comparer
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Aucune recommandation */}
          {filteredRecommendations.length === 0 && !generating && (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {recommendations.length === 0 ? 'Prêt à générer des recommandations' : 'Aucun résultat de recherche'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {recommendations.length === 0
                  ? 'Définissez vos intérêts et cliquez sur "Générer avec IA" pour obtenir des suggestions personnalisées.'
                  : 'Aucune recommandation ne correspond à votre recherche. Essayez de modifier vos termes.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {filters.interests.length === 0 && (
                  <button
                    onClick={() => setShowInterestsModal(true)}
                    className={`px-4 py-2 ${COLORS.primary.bg} ${COLORS.primary.darkBg} text-white rounded-lg ${COLORS.primary.hoverBg} ${COLORS.primary.darkHoverBg} transition-all inline-flex items-center gap-2 shadow-md`}
                  >
                    <Tag className="w-4 h-4" />
                    Définir mes intérêts
                  </button>
                )}
                <button
                  onClick={() => generateRecommendations()}
                  disabled={generating || filters.interests.length === 0}
                  className={`px-4 py-2 ${COLORS.secondary.bg} ${COLORS.secondary.darkBg} text-white rounded-lg ${COLORS.secondary.hoverBg} ${COLORS.secondary.darkHoverBg} transition-all inline-flex items-center gap-2 disabled:opacity-50 shadow-md`}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Générer des recommandations
                </button>
              </div>
            </div>
          )}

          {/* Chargement */}
          {generating && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Génération des recommandations en cours...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                L'IA analyse vos intérêts et les sujets disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}