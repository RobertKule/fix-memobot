// src/components/assistant/MemoBotAssistant.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, X, Send, Bot, Loader2, Sparkles, Brain, User, 
  StopCircle, RefreshCw, AlertCircle 
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    timestamp: string
    isError?: boolean
}

// Clé pour le localStorage
const STORAGE_KEY = 'memobot_conversation'

export default function MemoBotAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [abortController, setAbortController] = useState<AbortController | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { user } = useAuth()

    // Charger la conversation depuis localStorage au démarrage
    useEffect(() => {
        const savedConversation = localStorage.getItem(STORAGE_KEY)
        if (savedConversation) {
            try {
                const parsed = JSON.parse(savedConversation)
                setMessages(parsed)
            } catch (e) {
                console.error('Erreur chargement conversation:', e)
            }
        }
    }, [])

    // Sauvegarder la conversation dans localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        }
    }, [messages])

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Fonction pour générer un ID unique
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialiser la conversation si vide
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            initializeConversation()
        }
    }, [isOpen])

    // Scroll vers le dernier message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // Focus sur l'input quand le chat s'ouvre
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 300)
        }
    }, [isOpen])

    // Initialiser la conversation avec les infos utilisateur
    const initializeConversation = async () => {
        try {
            console.log("🔍 Récupération des données utilisateur...")

            if (!user || !user.id) {
                const welcomeMessage: Message = {
                    id: generateId(),
                    text: "Bonjour ! 👋\n\nJe suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlez-moi de votre projet :\n• Quel est votre domaine d'étude ?\n• Quels sont vos centres d'intérêt ?\n• Avez-vous des idées de sujet ?",
                    sender: 'bot',
                    timestamp: getCurrentTime()
                }
                setMessages([welcomeMessage])
                return
            }

            // Récupérer le profil utilisateur
            let profile
            try {
                profile = await api.getUserProfile(user.id)
                console.log("✅ Profil récupéré:", profile)
            } catch (error) {
                console.log("⚠️ Impossible de récupérer le profil:", error)
            }

            // Récupérer les compétences
            let skills: any[] = []
            try {
                skills = await api.getUserSkills(user.id)
                console.log("✅ Compétences récupérées:", skills)
            } catch (error) {
                console.log("⚠️ Impossible de récupérer les compétences:", error)
            }

            // Construire le message d'accueil personnalisé
            const name = user?.full_name ? user.full_name.split(' ')[0] : 'Cher utilisateur'
            
            let welcomeText = `Bonjour ${name} ! 👋\n\n`

            if (profile?.level || profile?.field) {
                welcomeText += `Je vois votre profil `
                if (profile.level) welcomeText += `en ${profile.level}`
                if (profile.field) welcomeText += profile.level ? ` en ${profile.field}` : `dans le domaine ${profile.field}`
                welcomeText += `.\n\n`
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

            const welcomeMessage: Message = {
                id: generateId(),
                text: welcomeText,
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages([welcomeMessage])

        } catch (error) {
            console.error("❌ Erreur initialisation conversation:", error)
            const fallbackMessage: Message = {
                id: generateId(),
                text: "Bonjour ! 👋\n\nJe suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlez-moi de votre projet.",
                sender: 'bot',
                timestamp: getCurrentTime()
            }
            setMessages([fallbackMessage])
        }
    }

    // Arrêter la génération en cours
    const handleStopGeneration = () => {
        if (abortController) {
            abortController.abort()
            setAbortController(null)
            setIsLoading(false)
            setIsTyping(false)
            toast.info('Génération arrêtée')
        }
    }

    // Détecter si un message est trop court
    const isMessageTooShort = (text: string): boolean => {
        const words = text.trim().split(/\s+/).length
        return words < 3 || text.length < 20
    }

    // Générer une suggestion basée sur un message trop court
    const getSuggestionForShortMessage = (text: string): string => {
        const lowerText = text.toLowerCase()
        
        if (lowerText.includes('bonjour') || lowerText.includes('salut')) {
            return "Pour mieux vous aider, pourriez-vous me parler de votre domaine d'étude ou de vos centres d'intérêt ?"
        }
        
        if (lowerText.includes('aide') || lowerText.includes('aider')) {
            return "Je suis là pour ça ! Pour commencer, quel est votre domaine d'étude et qu'est-ce qui vous passionne ?"
        }
        
        if (lowerText.includes('sujet') || lowerText.includes('mémoire')) {
            return "Excellent ! Pour vous proposer des sujets pertinents, pourriez-vous me dire dans quel domaine vous étudiez et ce qui vous intéresse particulièrement ?"
        }
        
        return "Votre message est un peu court. Pourriez-vous me donner plus de détails sur votre projet, votre domaine d'étude ou vos centres d'intérêt ?"
    }

    // Envoyer un message
    const handleSend = useCallback(async (text?: string) => {
        const messageToSend = text || message.trim()
        if (!messageToSend || isLoading) return

        // Créer un nouvel AbortController pour cette requête
        const controller = new AbortController()
        setAbortController(controller)

        // Ajouter le message utilisateur
        const userMessage: Message = {
            id: generateId(),
            text: messageToSend,
            sender: 'user',
            timestamp: getCurrentTime()
        }

        setMessages(prev => [...prev, userMessage])
        if (!text) setMessage('')
        setIsLoading(true)
        setIsTyping(true)

        try {
            // Vérifier si le message est trop court
            if (isMessageTooShort(messageToSend)) {
                await new Promise(resolve => setTimeout(resolve, 800))
                setIsTyping(false)
                
                const suggestionMessage: Message = {
                    id: generateId(),
                    text: getSuggestionForShortMessage(messageToSend),
                    sender: 'bot',
                    timestamp: getCurrentTime()
                }
                setMessages(prev => [...prev, suggestionMessage])
                setIsLoading(false)
                setAbortController(null)
                return
            }

            // Construire l'historique complet pour le contexte
            const conversationHistory = messages
                .map(m => `${m.sender === 'user' ? 'Étudiant' : 'MemoBot'}: ${m.text}`)
                .join('\n\n')

            // Appel API avec AbortController
            const response = await api.chatWithAI({
                message: messageToSend,
                context: conversationHistory
            })

            // Vérifier si la requête a été annulée
            if (controller.signal.aborted) {
                setAbortController(null)
                return
            }

            // Simulation de frappe naturelle
            await new Promise(resolve => setTimeout(resolve, 1000))
            setIsTyping(false)

            // Ajouter la réponse du bot
            const botMessage: Message = {
                id: generateId(),
                text: response.message || "Je vais réfléchir à cela et vous proposer des pistes intéressantes.",
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages(prev => [...prev, botMessage])

            // Vérifier si on a assez d'infos pour proposer la génération
            const userMessages = [...messages, userMessage].filter(m => m.sender === 'user')
            const totalUserText = userMessages.map(m => m.text).join(' ').length
            
            if (totalUserText > 300 && !showGenerateModal && !isGenerating) {
                setTimeout(() => {
                    setShowGenerateModal(true)
                }, 1500)
            }

        } catch (error: any) {
            if (error.name === 'AbortError' || controller.signal.aborted) {
                console.log('Requête annulée')
            } else {
                console.error('Erreur API:', error)
                setIsTyping(false)

                const errorMessage: Message = {
                    id: generateId(),
                    text: "Je rencontre une difficulté technique. Pouvez-vous reformuler votre demande ?",
                    sender: 'bot',
                    timestamp: getCurrentTime(),
                    isError: true
                }

                setMessages(prev => [...prev, errorMessage])
            }
        } finally {
            setIsLoading(false)
            setAbortController(null)
        }
    }, [message, isLoading, messages, showGenerateModal, isGenerating])

    // Réinitialiser la conversation
    const handleResetConversation = async () => {
        try {
            if (abortController) {
                abortController.abort()
                setAbortController(null)
            }

            await api.resetConversation()
            setMessages([])
            localStorage.removeItem(STORAGE_KEY)
            setShowResetConfirm(false)
            setShowGenerateModal(false)

            initializeConversation()
            toast.success('Conversation réinitialisée')

        } catch (error) {
            console.error('Erreur réinitialisation:', error)
            setMessages([])
            localStorage.removeItem(STORAGE_KEY)
            setShowResetConfirm(false)

            const welcomeMessage: Message = {
                id: generateId(),
                text: "Conversation réinitialisée. Parlons d'un nouveau sujet !",
                sender: 'bot',
                timestamp: getCurrentTime()
            }
            setMessages([welcomeMessage])
        }
    }

    // Gérer la génération de sujets depuis la conversation
    const handleGenerateFromConversation = async () => {
        if (!user) {
            toast.error('Veuillez vous connecter pour générer des sujets')
            return
        }

        setIsGenerating(true)
        setShowGenerateModal(false)

        const waitingMessage: Message = {
            id: generateId(),
            text: "🔄 J'analyse toute notre conversation pour générer des sujets parfaitement adaptés...\n\nCela prendra quelques secondes.",
            sender: 'bot',
            timestamp: getCurrentTime()
        }
        setMessages(prev => [...prev, waitingMessage])

        try {
            const response = await api.generateFromConversation()

            if (response?.subjects && response.subjects.length > 0) {
                const successMessage: Message = {
                    id: generateId(),
                    text: `✅ J'ai généré ${response.subjects.length} sujets basés sur l'ensemble de notre discussion !\n\nRedirection vers la page des recommandations...`,
                    sender: 'bot',
                    timestamp: getCurrentTime()
                }
                setMessages(prev => [...prev, successMessage])

                localStorage.setItem('generated_subjects', JSON.stringify(response.subjects))
                localStorage.setItem('generation_session_id', response.session_id)

                setTimeout(() => {
                    window.location.href = '/dashboard/recommendations/chat?source=chat&session=' + response.session_id
                }, 2000)
            }

        } catch (error) {
            console.error('Erreur génération:', error)

            const errorMessage: Message = {
                id: generateId(),
                text: "Désolé, je n'ai pas pu générer de sujets. Continuons notre discussion !",
                sender: 'bot',
                timestamp: getCurrentTime(),
                isError: true
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsGenerating(false)
        }
    }

    // Gestion du clavier
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === 'Escape' && isOpen) {
            setIsOpen(false)
        }
    }

    return (
        <>
            {/* Bouton flottant */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 animate-bounce z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                aria-label="Discuter avec MemoBot"
            >
                <Brain className="w-6 h-6" />

                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="absolute -top-10 transform -translate-x-1/2 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Trouvez votre sujet
                </span>
            </button>

            {/* Modal de chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl h-[600px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* En-tête */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white">MemoBot Assistant</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {messages.length} messages • Contexte préservé
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {messages.length > 1 && (
                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Réinitialiser la conversation"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Zone de messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] ${msg.sender === 'user' ? 'ml-auto' : ''}`}>
                                                <div className={`rounded-lg px-3 py-2 ${
                                                    msg.sender === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : msg.isError
                                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                                                }`}>
                                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                                    <div className={`text-xs mt-1 ${
                                                        msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                                                    }`}>
                                                        {msg.timestamp}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Indicateur de frappe */}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">MemoBot réfléchit...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Zone de saisie */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Parlez-moi de votre projet de mémoire..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm placeholder-gray-500"
                                            rows={1}
                                            disabled={isLoading}
                                        />
                                        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                                            {message.length > 0 && `${message.length} caractères`}
                                        </div>
                                    </div>
                                    
                                    {isLoading ? (
                                        <button
                                            onClick={handleStopGeneration}
                                            className="px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                                            title="Arrêter"
                                        >
                                            <StopCircle className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!message.trim()}
                                            className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                                    <span>Shift+Entrée pour nouvelle ligne • Entrée pour envoyer</span>
                                    {message.length > 0 && message.length < 20 && (
                                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Message court
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de confirmation réinitialisation */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={() => setShowResetConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <RefreshCw className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                    Réinitialiser la conversation ?
                                </h3>

                                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                    Tous les messages de cette conversation seront supprimés ({messages.length} messages).
                                </p>

                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={handleResetConversation}
                                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                                    >
                                        Oui, réinitialiser
                                    </button>
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de génération */}
            <AnimatePresence>
                {showGenerateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={() => !isGenerating && setShowGenerateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                                <div className="flex items-center justify-center mb-4">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-center mb-2">
                                    {isGenerating ? 'Génération en cours...' : 'Prêt à générer !'}
                                </h3>
                                <p className="text-blue-100 text-center text-sm">
                                    Basé sur vos {messages.filter(m => m.sender === 'user').length} messages
                                </p>
                            </div>

                            <div className="p-6">
                                {isGenerating ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                <Brain className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                                    Analyse de votre conversation...
                                                </p>
                                                <button
                                                    onClick={handleStopGeneration}
                                                    className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto"
                                                >
                                                    <StopCircle className="w-4 h-4" />
                                                    Arrêter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                                                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                                        Résumé de notre discussion :
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                        Vous avez échangé {messages.filter(m => m.sender === 'user').length} fois sur votre projet.
                                                        Je vais analyser tous ces échanges pour créer des sujets personnalisés.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                            <button
                                                onClick={handleGenerateFromConversation}
                                                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                <span>Générer 3 sujets depuis la conversation</span>
                                            </button>
                                            <button
                                                onClick={() => setShowGenerateModal(false)}
                                                className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors"
                                            >
                                                Continuer la discussion
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}