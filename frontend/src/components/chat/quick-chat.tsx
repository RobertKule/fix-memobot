'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

export default function QuickChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Bonjour ! Je suis MemoBot, votre assistant spécialisé dans la recherche de sujets de mémoire. Posez-moi votre question.", 
      sender: 'bot',
      timestamp: getCurrentTime()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Scroll vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Fermer le modal avec ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return
    
    // Ajouter message utilisateur
    const userMessage: Message = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: getCurrentTime()
    }
    
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      // Appel API réel
      const response = await api.askAI(message)
      
      // Ajouter réponse de l'IA
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.réponse || response.message || "Je n'ai pas pu traiter votre demande pour le moment. Pourriez-vous reformuler ?",
        sender: 'bot',
        timestamp: getCurrentTime()
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Erreur API:', error)
      
      // Message d'erreur
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Désolé, je rencontre une difficulté technique. Veuillez réessayer.",
        sender: 'bot',
        timestamp: getCurrentTime()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center group"
        aria-label="Ouvrir le chat"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
        </div>
        <span className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Discuter avec l'IA
        </span>
      </button>

      {/* Chat Modal avec fond flou */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/50 backdrop-blur-sm"
          onClick={handleBackgroundClick}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col animate-fade-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">MemoBot Assistant</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Posez vos questions sur votre mémoire</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'ml-auto' : ''}`}>
                    
                    {/* Message */}
                    <div className={`rounded-lg px-3 py-2 ${msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`mt-1 text-xs text-gray-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg rounded-bl-none px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Réponse en cours...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions de connexion discrète */}
            {messages.length > 2 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Pour sauvegarder cette conversation :
                  </span>
                  <Link
                    href="/login"
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="w-3 h-3" />
                    Se connecter
                  </Link>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Posez votre question sur votre mémoire..."
                    className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                    rows={1}
                    disabled={isLoading}
                    style={{ minHeight: '44px', maxHeight: '100px' }}
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                    {message.length}/500
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  aria-label="Envoyer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Indication très discrète */}
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                  <Link 
                    href="/register" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => setIsOpen(false)}
                  >
                    Créez un compte
                  </Link>
                  {' '}pour sauvegarder vos conversations
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </>
  )
}