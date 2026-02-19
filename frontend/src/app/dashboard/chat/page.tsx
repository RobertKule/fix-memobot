// src/app/dashboard/chat/page.tsx - Version avec génération automatique
'use client'
import React,{ useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Bot,
  User,
  Send,
  RefreshCw,
  Copy,
  BookOpen,
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  StopCircle,
  AlertCircle,
  Brain,
  GraduationCap,
  Code,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { api, Sujet } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Message {
  id: string
  sender: 'user' | 'bot'
  content: string
  time: string
  isError?: boolean
  suggestions?: string[]
  peutGenerer?: boolean
}

interface GeneratedSubject {
  id?: number
  titre: string
  description: string
  keywords: string
  domaine: string
  niveau: string
  problématique: string
  méthodologie: string
  difficulté: string
  durée_estimée: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicParam = searchParams?.get('topic')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [popularTopics, setPopularTopics] = useState<Sujet[]>([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSubjects, setGeneratedSubjects] = useState<GeneratedSubject[]>([])
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (messages.length === 0) {
      initializeConversation()
    }
    loadPopularTopics()
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const initializeConversation = async () => {
    try {
      if (!user || !user.id) {
        setMessages([{
          id: generateId(),
          sender: 'bot',
          content: "👋 Bonjour ! Je suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlez-moi de votre projet :\n• Quel est votre domaine d'étude ?\n• Quels sont vos centres d'intérêt ?\n• Avez-vous des idées de sujet ?",
          time: getCurrentTime()
        }])
        return
      }

      // Récupérer le profil
      let profile
      try {
        profile = await api.getUserProfile(user.id)
      } catch (error) {
        console.log("⚠️ Erreur profil:", error)
      }

      // Récupérer les compétences
      let skills: any[] = []
      try {
        skills = await api.getUserSkills(user.id)
      } catch (error) {
        console.log("⚠️ Erreur compétences:", error)
      }

      const name = user?.full_name ? user.full_name.split(' ')[0] : 'Cher utilisateur'
      
      let welcomeText = `👋 Bonjour ${name} ! `

      if (profile?.level || profile?.field) {
        welcomeText += `Je vois votre profil `
        if (profile.level) welcomeText += `en ${profile.level}`
        if (profile.field) welcomeText += profile.level ? ` en ${profile.field}` : `dans le domaine ${profile.field}`
        welcomeText += `.\n\n`
      } else {
        welcomeText += `\n\n`
      }

      if (profile?.interests) {
        const interests = profile.interests.split(',').map(i => i.trim()).slice(0, 3)
        if (interests.length > 0) {
          welcomeText += `Vous êtes intéressé par ${interests.join(', ')}. `
        }
      }

      if (skills.length > 0) {
        const topSkill = skills.sort((a, b) => b.level - a.level)[0]
        welcomeText += `Je vois que vous maîtrisez ${topSkill.name}. `
      }

      welcomeText += `\n\nJe suis là pour vous aider à trouver **le sujet de mémoire parfait**.\n\n`
      welcomeText += `Parlez-moi de votre projet :\n`
      welcomeText += `• Qu'est-ce qui vous inspire ?\n`
      welcomeText += `• Des idées en tête ?\n`
      welcomeText += `• Des technologies qui vous intéressent ?`

      setMessages([{
        id: generateId(),
        sender: 'bot',
        content: welcomeText,
        time: getCurrentTime()
      }])

    } catch (error) {
      console.error("❌ Erreur initialisation:", error)
      setMessages([{
        id: generateId(),
        sender: 'bot',
        content: "👋 Bonjour ! Je suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlez-moi de votre projet.",
        time: getCurrentTime()
      }])
    }
  }

  const loadPopularTopics = async () => {
    try {
      const topics = await api.getPopularSujets(3)
      setPopularTopics(topics || [])
    } catch (error) {
      console.error('Erreur chargement sujets:', error)
    }
  }

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      setIsTyping(false)
      setIsGenerating(false)
      toast.info('Génération arrêtée')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const trimmedInput = input.trim()
    const controller = new AbortController()
    setAbortController(controller)

    // Ajouter message utilisateur
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      content: trimmedInput,
      time: getCurrentTime()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Vérifier si c'est trop court
      if (trimmedInput.length < 15) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsTyping(false)
        
        const response: Message = {
          id: generateId(),
          sender: 'bot',
          content: "Votre message est un peu court. Pourriez-vous me donner plus de détails sur votre projet ou vos centres d'intérêt ?",
          time: getCurrentTime()
        }
        setMessages(prev => [...prev, response])
        setIsLoading(false)
        setAbortController(null)
        return
      }

      // Construire l'historique
      const conversationHistory = messages
        .map(m => `${m.sender === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
        .join('\n')

      // Appel API
      const response = await api.askAI(trimmedInput, conversationHistory)

      if (controller.signal.aborted) {
        setAbortController(null)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      setIsTyping(false)

      const botMessage: Message = {
        id: generateId(),
        sender: 'bot',
        content: response.message || "Je n'ai pas pu générer de réponse.",
        time: getCurrentTime(),
        suggestions: response.suggestions,
        peutGenerer: response.peut_generer
      }

      setMessages(prev => [...prev, botMessage])

      // Si l'IA dit qu'on peut générer, afficher le modal après 1 seconde
      if (response.peut_generer) {
        setTimeout(() => {
          setShowGenerateModal(true)
        }, 1000)
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Requête annulée')
      } else {
        console.error('Erreur:', error)
        const errorMessage: Message = {
          id: generateId(),
          sender: 'bot',
          content: "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler ?",
          time: getCurrentTime(),
          isError: true
        }
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleGenerateSubjects = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter')
      return
    }

    setIsGenerating(true)
    setShowGenerateModal(false)

    const waitingMessage: Message = {
      id: generateId(),
      sender: 'bot',
      content: "🔄 J'analyse notre conversation pour générer 3 sujets de mémoire personnalisés...\n\nCela prendra quelques secondes.",
      time: getCurrentTime()
    }
    setMessages(prev => [...prev, waitingMessage])

    try {
      // Extraire les intérêts de la conversation
      const userMessages = messages
        .filter(m => m.sender === 'user')
        .map(m => m.content)
        .join(' ')

      // Récupérer les préférences
      const prefs = await api.getPreferences()

      // Générer 3 sujets
      const result = await api.generateThreeSubjects({
        interests: userMessages.split(' ').filter(w => w.length > 3).slice(0, 10),
        domaine: prefs?.field || 'Informatique',
        niveau: prefs?.level || 'Master',
        faculté: prefs?.faculty || 'Sciences'
      })

      setGeneratedSubjects(result.subjects)

      // Message de succès
      const successMessage: Message = {
        id: generateId(),
        sender: 'bot',
        content: `✅ J'ai généré 3 sujets pour vous !\n\n**1. ${result.subjects[0].titre}**\n${result.subjects[0].description.substring(0, 100)}...\n\n**2. ${result.subjects[1].titre}**\n${result.subjects[1].description.substring(0, 100)}...\n\n**3. ${result.subjects[2].titre}**\n${result.subjects[2].description.substring(0, 100)}...\n\nLes détails complets sont disponibles ci-dessous.`,
        time: getCurrentTime()
      }
      setMessages(prev => [...prev, successMessage])

    } catch (error) {
      console.error('Erreur génération:', error)
      const errorMessage: Message = {
        id: generateId(),
        sender: 'bot',
        content: "Désolé, je n'ai pas pu générer de sujets. Continuons notre discussion !",
        time: getCurrentTime(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectSubject = (index: number) => {
    const subject = generatedSubjects[index]
    if (!subject) return

    // Sauvegarder dans localStorage
    localStorage.setItem('selected_subject', JSON.stringify(subject))
    
    // Rediriger vers la page de détails
    router.push('/dashboard/recommendations')
    toast.success('Sujet sélectionné')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    "Parle-moi de mon domaine",
    "Quels sujets me correspondent ?",
    "Explique-moi la méthodologie",
    "Donne-moi des exemples"
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Chat principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'lg:w-3/4' : 'w-full'}`}>
        {/* Header */}
        <header className="sticky top-16 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    MemoBot Assistant
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {messages.length} messages • Contexte préservé
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMessages([])
                    initializeConversation()
                    toast.success('Nouvelle conversation')
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Nouvelle conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
                >
                  {showSidebar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Zone de messages */}
        <main
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50"
        >
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    } ${msg.sender === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}>

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      {msg.sender === 'bot' ? (
                        <>
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">MemoBot</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-white/90">{user?.full_name?.split(' ')[0]}</span>
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        </>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{msg.time}</span>
                    </div>

{/* Affichage des messages sans trop de formatage */}
<div className="whitespace-pre-wrap text-sm">
  {msg.content}
</div>

{/* Supprimer les suggestions automatiques trop nombreuses */}
{msg.suggestions && msg.suggestions.length > 0 && (
  <div className="mt-3 pt-3 border-t border-gray-200">
    <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
    <div className="flex flex-wrap gap-2">
      {msg.suggestions.slice(0, 1).map((suggestion, i) => (
        <button
          key={i}
          onClick={() => setInput(suggestion)}
          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
)}

                    {/* Bouton de génération */}
                    {msg.peutGenerer && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowGenerateModal(true)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Générer 3 sujets de mémoire
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">MemoBot</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Zone de saisie */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Parlez-moi de votre projet..."
                  className="w-full px-4 py-3 pr-16 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 resize-none min-h-[60px] text-sm"
                  rows={2}
                  disabled={isLoading}
                />

                {isLoading ? (
                  <button
                    onClick={handleStopGeneration}
                    className="absolute right-2 bottom-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                    title="Arrêter"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Shift+Entrée pour nouvelle ligne • Entrée pour envoyer</span>
              {input.length > 0 && input.length < 15 && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Message court
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="hidden lg:block w-1/4 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
          <div className="p-4">
            {/* Info session */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                Session en cours
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Messages</span>
                  <span className="font-medium text-gray-900 dark:text-white">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vos messages</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {messages.filter(m => m.sender === 'user').length}
                  </span>
                </div>
              </div>
              {messages.filter(m => m.sender === 'user').length >= 3 && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  disabled={isGenerating}
                  className="mt-4 w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Générer des sujets
                </button>
              )}
            </div>

            {/* Sujets populaires */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sujets populaires</h3>
              <div className="space-y-3">
                {popularTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => setInput(`Parle-moi du sujet : ${topic.titre}`)}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {topic.titre}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {topic.domaine}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        {topic.vue_count || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de génération */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Sujets de mémoire générés
                </h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Génération des sujets...</p>
                </div>
              ) : generatedSubjects.length > 0 ? (
                <div className="space-y-4">
                  {generatedSubjects.map((subject, index) => (
                    <div
                      key={index}
                      className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {subject.titre}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {subject.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {subject.keywords.split(',').slice(0, 3).map((kw, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{subject.domaine}</span>
                            <span>•</span>
                            <span>{subject.niveau}</span>
                            <span>•</span>
                            <span className="capitalize">{subject.difficulté}</span>
                          </div>
                          <button
                            onClick={() => handleSelectSubject(index)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Choisir ce sujet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <button
                    onClick={handleGenerateSubjects}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800"
                  >
                    Générer 3 sujets maintenant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}