// src/components/assistant/MemoBotAssistant.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Brain, User } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
    id: number
    text: string
    sender: 'user' | 'bot'
    timestamp: string
}

export default function MemoBotAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { user } = useAuth()

    // Fonction utilitaire pour l'heure
    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Initialiser la conversation quand le modal s'ouvre
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            initializeConversation()
        }
    }, [isOpen, messages.length])


    // Initialiser la conversation avec les infos utilisateur
    const initializeConversation = async () => {
        try {
            // Récupérer les préférences de l'utilisateur
            const preferences = await api.getPreferences()

            const initialMessage: Message = {
                id: 1,
                text: getInitialGreeting(user, preferences),
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages([initialMessage])
        } catch (error) {
            // Message par défaut en cas d'erreur
            const fallbackMessage: Message = {
                id: 1,
                text: `Bonjour ${user?.full_name ? user.full_name.split(' ')[0] : ''} !\n\nJe suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlez-moi de votre projet académique.`,
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages([fallbackMessage])
        }
    }

    // Générer le message initial personnalisé
    const getInitialGreeting = (user: any, preferences: any) => {
        const name = user?.full_name ? user.full_name.split(' ')[0] : ''
        let greeting = `Bonjour ${name} ! 👋\n\n`

        if (preferences?.level) {
            greeting += `Je vois que vous êtes en ${preferences.level}. `
        }

        if (preferences?.faculty) {
            greeting += `À la faculté de ${preferences.faculty}, `
        }

        if (preferences?.interests) {
            greeting += `vos intérêts sont : ${preferences.interests}. `
        }

        greeting += `\n\nParlez-moi de votre projet de mémoire. Que cherchez-vous ?\n• Votre domaine de prédilection\n• Vos contraintes temporelles\n• Les technologies qui vous intéressent\n• Toute autre information utile`

        return greeting
    }

    // Scroll vers le dernier message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus sur l'input quand le chat s'ouvre
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 300)
        }
    }, [isOpen])
    const handleResetConversation = async () => {
        try {
            // Appeler l'API pour réinitialiser côté serveur
            await api.resetConversation()

            // Réinitialiser localement
            setMessages([])
            setShowResetConfirm(false)
            setShowGenerateModal(false)

            // Réinitialiser avec un nouveau message
            const resetMessage: Message = {
                id: Date.now(),
                text: "🧹 La conversation a été réinitialisée.\n\nJe suis MemoBot, votre assistant pour trouver le sujet de mémoire idéal.\n\nParlons d'un nouveau sujet !\n\nDe quoi voulez-vous discuter ?\n• Votre domaine d'étude\n• Vos intérêts de recherche\n• Vos contraintes académiques",
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages([resetMessage])

        } catch (error) {
            console.error('Erreur réinitialisation:', error)

            // Fallback local
            setMessages([])
            setShowResetConfirm(false)

            const errorMessage: Message = {
                id: Date.now(),
                text: "Conversation réinitialisée localement. Parlons d'un nouveau sujet !",
                sender: 'bot',
                timestamp: getCurrentTime()
            }
            setMessages([errorMessage])
        }
    }
    // Nouveau useEffect pour détecter quand afficher le modal
    useEffect(() => {
        if (messages.length >= 2) { // Au moins 2 échanges
            const lastMessage = messages[messages.length - 1]
            const secondLastMessage = messages[messages.length - 2]

            // Vérifier si l'utilisateur vient de donner des informations substantielles
            if (lastMessage.sender === 'user' && lastMessage.text.length > 50) {
                // Compter les messages utilisateur récents
                const recentUserMessages = messages
                    .slice(-4) // 4 derniers messages
                    .filter(m => m.sender === 'user')
                    .map(m => m.text)

                const totalUserText = recentUserMessages.join(' ').length

                // Si l'utilisateur a donné assez d'informations (au moins 200 caractères)
                if (totalUserText > 200 && !showGenerateModal) {
                    // Attendre 1 seconde pour ne pas interrompre
                    setTimeout(() => {
                        setShowGenerateModal(true)

                        // Optionnel : Ajouter un message du bot
                        const botMessage: Message = {
                            id: Date.now(),
                            text: "✨ Excellent ! J'ai bien compris votre projet. Je peux maintenant vous proposer des sujets de mémoire adaptés.",
                            sender: 'bot',
                            timestamp: getCurrentTime()
                        }
                        setMessages(prev => [...prev, botMessage])
                    }, 1000)
                }
            }
        }
    }, [messages, showGenerateModal])

    // Fonction pour envoyer un message
    const handleSend = useCallback(async (text?: string) => {
        const messageToSend = text || message.trim()
        if (!messageToSend || isLoading) return

        // Ajouter message utilisateur
        const userMessage: Message = {
            id: Date.now(),
            text: messageToSend,
            sender: 'user',
            timestamp: getCurrentTime()
        }

        setMessages(prev => [...prev, userMessage])
        if (!text) setMessage('')

        setIsLoading(true)
        setIsTyping(true)

        try {
            // Construire le contexte
            const conversationContext = messages
                .map(m => `${m.sender}: ${m.text}`)
                .join('\n')

            // Utiliser l'API de chat
            const response = await api.chatWithAI({
                message: messageToSend,
                context: conversationContext
            })

            // Simulation de frappe naturelle
            await new Promise(resolve => setTimeout(resolve, 1000))
            setIsTyping(false)

            // Ajouter réponse de l'IA
            const botMessage: Message = {
                id: Date.now() + 1,
                text: response.message || "Je vais réfléchir à cela et vous proposer des pistes intéressantes.",
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages(prev => [...prev, botMessage])

            // DÉTECTION AMÉLIORÉE pour afficher le modal
            // Vérifier si l'utilisateur a donné une description complète
            const isCompleteDescription =
                messageToSend.length > 100 &&
                (messageToSend.toLowerCase().includes('je veux') ||
                    messageToSend.toLowerCase().includes('mon projet') ||
                    messageToSend.toLowerCase().includes('sujet') ||
                    messageToSend.toLowerCase().includes('mémoire'))

            // Compter tous les messages utilisateur
            const allUserMessages = [...messages, userMessage]
                .filter(m => m.sender === 'user')
                .map(m => m.text)
                .join(' ')

            const hasEnoughInfo = allUserMessages.length > 300

            if ((isCompleteDescription || hasEnoughInfo) && !showGenerateModal) {
                // Attendre 2 secondes avant d'afficher le modal
                setTimeout(() => {
                    setShowGenerateModal(true)
                }, 2000)
            }

        } catch (error) {
            console.error('Erreur API:', error)
            setIsTyping(false)

            const errorMessage: Message = {
                id: Date.now() + 1,
                text: "Je rencontre une difficulté technique. Pouvez-vous reformuler votre demande ?",
                sender: 'bot',
                timestamp: getCurrentTime()
            }

            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [message, isLoading, messages, showGenerateModal])

    // Gérer la génération de sujets
    const handleGenerateSubjects = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour générer des sujets')
            return
        }

        setIsGenerating(true)

        // Ajouter message d'attente
        const waitingMessage: Message = {
            id: Date.now(),
            text: "🔄 J'analyse notre conversation et je génère des sujets pertinents pour vous...\n\nCela prendra quelques secondes.",
            sender: 'bot',
            timestamp: getCurrentTime()
        }
        setMessages(prev => [...prev, waitingMessage])

        try {
            // Extraire les intérêts de la conversation
            const userText = messages
                .filter(m => m.sender === 'user')
                .map(m => m.text)
                .join(' ')

            // Récupérer les préférences
            const preferences = await api.getPreferences()

            // Générer 3 sujets
            const subjects = await api.generateThreeSubjects({
                interests: userText.split(/[\s,.!?]+/).filter(w => w.length > 3).slice(0, 5),
                domaine: preferences?.field || 'Informatique',
                niveau: preferences?.level || 'Master',
                faculté: preferences?.faculty || 'Sciences'
            })

            setShowGenerateModal(false)

            if (subjects?.subjects && subjects.subjects.length > 0) {
                // Message de succès
                const successMessage: Message = {
                    id: Date.now() + 1,
                    text: `✅ J'ai généré ${subjects.subjects.length} sujets basés sur notre discussion !\n\nVous pouvez maintenant :\n1. Consulter les détails de chaque sujet\n2. Les sauvegarder dans votre collection\n3. Continuer à affiner avec moi`,
                    sender: 'bot',
                    timestamp: getCurrentTime()
                }
                setMessages(prev => [...prev, successMessage])

                // Rediriger vers la page de recommandations
                // setTimeout(() => {
                //     window.location.href = '/dashboard/recommendations'
                // }, 3000)
            }

        } catch (error) {
            console.error('Erreur génération:', error)

            const errorMessage: Message = {
                id: Date.now() + 1,
                text: "Désolé, je n'ai pas pu générer de sujets pour le moment. Continuons notre discussion pour mieux cerner vos besoins.",
                sender: 'bot',
                timestamp: getCurrentTime()
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

    // Fonction pour analyser si la conversation est "mûre" pour la génération
    const isConversationReadyForGeneration = useCallback((msgs: Message[]): boolean => {
        if (msgs.length < 3) return false

        const userMessages = msgs
            .filter(m => m.sender === 'user')
            .map(m => m.text.toLowerCase())

        // Mots-clés indiquant une description de projet
        const projectKeywords = [
            'je veux', 'je souhaite', 'mon projet', 'mon idée',
            'développer', 'créer', 'faire', 'réaliser',
            'application', 'système', 'logiciel', 'mobile', 'web',
            'surveiller', 'analyser', 'optimiser', 'automatiser',
            'mémoire', 'sujet', 'thème', 'problématique'
        ]

        // Compter les mots-clés présents
        const keywordCount = projectKeywords.filter(keyword =>
            userMessages.some(msg => msg.includes(keyword))
        ).length

        // Vérifier la longueur totale
        const totalTextLength = userMessages.join(' ').length

        // Conditions pour générer :
        // 1. Au moins 4 mots-clés de projet
        // 2. Au moins 200 caractères de texte
        // 3. Pas déjà en train de générer
        return keywordCount >= 4 && totalTextLength > 200 && !isGenerating
    }, [isGenerating])


    useEffect(() => {
        if (isConversationReadyForGeneration(messages) && !showGenerateModal) {
            // Attendre un peu
            setTimeout(() => {
                setShowGenerateModal(true)
            }, 1500)
        }
    }, [messages, isConversationReadyForGeneration, showGenerateModal])
    return (
        <>
            {/* Bouton flottant simple */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 animate-bounce z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                aria-label="Discuter avec MemoBot"
            >
                <Brain className="w-6 h-6" />

                {/* Badge de notification */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />

                {/* Texte au survol */}
                <span className="absolute -top-10 transform -translate-x-1/2 bg-gray-900 text-white text-xs dark:bg-blue-700 hover:animate-none  p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Votre guide pour le sujet idéal</p>
                                    </div>
                                </div>

                                {/* Boutons d'action */}
                                <div className="flex items-center gap-2">
                                    {/* Bouton Réinitialiser - visible seulement avec au moins 2 messages */}
                                    {messages.length > 1 && (
                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Réinitialiser la conversation"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
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
                                                <div className={`rounded-lg px-3 py-2 ${msg.sender === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                                    <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
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
                                            ↵ pour envoyer
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!message.trim() || isLoading}
                                        className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de confirmation pour réinitialiser */}
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
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                    Réinitialiser la conversation ?
                                </h3>

                                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                    Tous les messages de cette conversation seront supprimés et vous commencerez une nouvelle discussion.
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
                                        Non, continuer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Modal simple de génération */}
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
                            {/* En-tête colorée */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                                <div className="flex items-center justify-center mb-4">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-center mb-2">
                                    {isGenerating ? 'Génération en cours...' : 'Sujets personnalisés prêts !'}
                                </h3>
                                <p className="text-blue-100 text-center text-sm">
                                    {isGenerating
                                        ? "Analyse de votre conversation et création de sujets adaptés"
                                        : "Basé sur notre discussion, je peux créer des sujets spécialement pour vous"
                                    }
                                </p>
                            </div>

                            <div className="p-6">
                                {isGenerating ? (
                                    <div className="space-y-4">
                                        {/* Animation de chargement améliorée */}
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                                <Brain className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                                    Création de vos sujets...
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                    J'analyse :<br />
                                                    • Vos intérêts et contraintes<br />
                                                    • Les technologies mentionnées<br />
                                                    • Le niveau académique requis
                                                </p>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
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
                                                        Ce que j'ai compris :
                                                    </h4>
                                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                                        {messages
                                                            .filter(m => m.sender === 'user')
                                                            .slice(-3)
                                                            .map((msg, idx) => (
                                                                <li key={idx} className="flex items-start">
                                                                    <span className="text-blue-500 mr-2">•</span>
                                                                    <span className="truncate">{msg.text.substring(0, 60)}...</span>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                            <button
                                                onClick={handleGenerateSubjects}
                                                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                <span>Générer 3 sujets personnalisés</span>
                                            </button>

                                            <button
                                                onClick={() => setShowGenerateModal(false)}
                                                className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors"
                                            >
                                                Continuer la discussion
                                            </button>

                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                                Les sujets générés seront sauvegardés dans votre espace personnel
                                            </p>
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