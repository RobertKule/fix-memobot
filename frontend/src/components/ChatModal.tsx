// components/ChatModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Sparkles, RefreshCw, BookOpen, Zap } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  history: any[]
  message: string
  setMessage: (msg: string) => void
  sendMessage: () => void
}

export default function ChatModal({
  isOpen,
  onClose,
  history,
  message,
  setMessage,
  sendMessage
}: ChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [quickActions] = useState([
    {
      icon: Sparkles,
      text: 'Générer 3 sujets IA',
      prompt: 'Peux-tu générer 3 sujets de mémoire pour moi ?'
    },
    {
      icon: BookOpen,
      text: 'Affiner ma problématique',
      prompt: 'J\'ai une idée mais je n\'arrive pas à formuler la problématique'
    },
    {
      icon: Zap,
      text: 'Méthodologie adaptée',
      prompt: 'Quelle méthodologie utiliser pour une étude comparative ?'
    }
  ])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">MemoBot Assistant</h2>
                <p className="text-sm text-gray-600">Votre assistant IA pour les sujets de mémoire</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Actions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(action.prompt)
                  setTimeout(() => {
                    document.getElementById('chat-input')?.focus()
                  }, 100)
                }}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <action.icon className="w-4 h-4" />
                {action.text}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Bonjour ! Je suis MemoBot 🤖
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Je peux vous aider à trouver un sujet de mémoire, affiner votre problématique, 
                choisir une méthodologie, et bien plus encore. Comment puis-je vous aider aujourd'hui ?
              </p>
            </div>
          ) : (
            history.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-sm font-medium mb-2">Suggestions :</p>
                      <ul className="space-y-1">
                        {msg.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <Sparkles className="w-3 h-3 mt-0.5 text-yellow-500" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action: any, idx: number) => (
                          <button
                            key={idx}
                            className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-sm hover:bg-white/30 transition-colors"
                          >
                            {action.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-700" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="chat-input"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Posez votre question sur votre mémoire..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            MemoBot peut faire des erreurs. Consultez toujours votre directeur de mémoire.
          </p>
        </div>
      </motion.div>
    </div>
  )
}