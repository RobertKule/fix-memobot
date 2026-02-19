// src/app/dashboard/admin/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  FileText,
  Settings,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserX,
  Archive,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Brain,
  Filter,
  Plus,
  X,
  Save,
  BookOpen,
  GraduationCap,
  Tag,
  AlignLeft,
  ListTodo,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { api, User, Sujet } from '@/lib/api'
import { toast } from 'sonner'

// Types
interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSujets: number
  activeSujets: number
  aiAnalyses: number
  newUsers7d: number
  newSujets7d: number
  systemHealth: number
}

interface RecentActivity {
  id: number
  type: 'user' | 'sujet' | 'ai' | 'system' | 'feedback'
  action: string
  user: string
  timestamp: string
  icon: React.ReactNode
  color: string
}

interface DomainStat {
  domaine: string
  count: number
  avg_views: number
}

interface RoleStat {
  role: string
  count: number
}

// Type pour le formulaire de création de sujet
interface NewSujetForm {
  titre: string
  description: string
  keywords: string
  domaine: string
  niveau: string
  faculté: string
  problématique: string
  méthodologie: string
  technologies: string
  difficulté: 'facile' | 'moyenne' | 'difficile'
  durée_estimée: string
  ressources: string
}

// --- SKELETON ---
const AdminSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div>
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>

      <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="text-right">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
// Créer un composant séparé pour le modal
const CreateSujetModal = ({ isOpen, onClose, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sujet: Sujet) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'academic' | 'methodology' | 'resources'>('info')
  const [createLoading, setCreateLoading] = useState(false)
  const [newSujet, setNewSujet] = useState<NewSujetForm>({
    titre: '',
    description: '',
    keywords: '',
    domaine: '',
    niveau: '',
    faculté: '',
    problématique: '',
    méthodologie: '',
    technologies: '',
    difficulté: 'moyenne',
    durée_estimée: '',
    ressources: ''
  })

  const tabs = [
    { id: 'info', label: 'Informations', icon: FileText },
    { id: 'academic', label: 'Académique', icon: GraduationCap },
    { id: 'methodology', label: 'Méthodologie', icon: ListTodo },
    { id: 'resources', label: 'Ressources', icon: BookOpen },
  ]

  const isTabValid = (tabId: string): boolean => {
    switch (tabId) {
      case 'info':
        return newSujet.titre.trim() !== '' &&
          newSujet.description.trim() !== ''
      case 'academic':
        return newSujet.domaine.trim() !== '' &&
          newSujet.niveau.trim() !== ''
      default:
        return true
    }
  }

  const handleCreateSujet = async () => {
    // Validation
    if (!newSujet.titre.trim()) {
      toast.error('Titre requis', {
        description: 'Veuillez saisir un titre pour le sujet.'
      })
      setActiveTab('info')
      return
    }
    if (!newSujet.description.trim()) {
      toast.error('Description requise', {
        description: 'Veuillez saisir une description.'
      })
      setActiveTab('info')
      return
    }
    if (!newSujet.domaine.trim()) {
      toast.error('Domaine requis', {
        description: 'Veuillez saisir le domaine.'
      })
      setActiveTab('academic')
      return
    }
    if (!newSujet.niveau.trim()) {
      toast.error('Niveau requis', {
        description: 'Veuillez saisir le niveau.'
      })
      setActiveTab('academic')
      return
    }

    setCreateLoading(true)
    const toastId = toast.loading('Création du sujet en cours...')

    try {
      const createdSujet = await api.createUserSujet(newSujet)

      toast.success('Sujet créé avec succès', {
        description: `Le sujet "${createdSujet.titre}" a été ajouté.`,
        icon: <CheckCircle className="w-4 h-4" />,
        id: toastId
      })

      onSuccess(createdSujet)
      onClose()

      // Réinitialiser le formulaire
      setNewSujet({
        titre: '',
        description: '',
        keywords: '',
        domaine: '',
        niveau: '',
        faculté: '',
        problématique: '',
        méthodologie: '',
        technologies: '',
        difficulté: 'moyenne',
        durée_estimée: '',
        ressources: ''
      })
      setActiveTab('info')

    } catch (error: any) {
      toast.error('Erreur lors de la création', {
        description: error?.message || 'Une erreur est survenue.',
        id: toastId
      })
    } finally {
      setCreateLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 shadow-2xl my-8 flex flex-col max-h-[90vh]"
      >
        {/* En-tête fixe */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Créer un nouveau sujet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Remplissez les informations pour créer un nouveau sujet de mémoire
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation par onglets */}
          <div className="flex flex-wrap gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isValid = isTabValid(tab.id)

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium relative ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {!isValid && tab.id !== activeTab && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  {!isValid && tab.id === activeTab && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-200 px-1.5 py-0.5 rounded-full">
                      Requis
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Corps défilant avec les différents onglets */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Onglet Informations de base */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du sujet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSujet.titre}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, titre: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!newSujet.titre.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Ex: Intelligence Artificielle dans l'éducation"
                />
                {!newSujet.titre.trim() && (
                  <p className="text-xs text-red-500 mt-1">Le titre est requis</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newSujet.description}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!newSujet.description.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Description détaillée du sujet..."
                />
                {!newSujet.description.trim() && (
                  <p className="text-xs text-red-500 mt-1">La description est requise</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mots-clés
                </label>
                <input
                  type="text"
                  value={newSujet.keywords}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="IA, Machine Learning, Éducation (séparés par des virgules)"
                />
                <p className="text-xs text-gray-500 mt-1">Séparez les mots-clés par des virgules</p>
              </div>
            </motion.div>
          )}

          {/* Onglet Académique */}
          {activeTab === 'academic' && (
            <motion.div
              key="academic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domaine <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSujet.domaine}
                    onChange={(e) => setNewSujet(prev => ({ ...prev, domaine: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!newSujet.domaine.trim() ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="Informatique, Sciences, etc."
                  />
                  {!newSujet.domaine.trim() && (
                    <p className="text-xs text-red-500 mt-1">Le domaine est requis</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Niveau <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newSujet.niveau}
                    onChange={(e) => setNewSujet(prev => ({ ...prev, niveau: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!newSujet.niveau ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <option value="">Sélectionner un niveau</option>
                    <option value="Licence 1">Licence 1</option>
                    <option value="Licence 2">Licence 2</option>
                    <option value="Licence 3">Licence 3</option>
                    <option value="Master 1">Master 1</option>
                    <option value="Master 2">Master 2</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                  {!newSujet.niveau && (
                    <p className="text-xs text-red-500 mt-1">Le niveau est requis</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Faculté
                </label>
                <input
                  type="text"
                  value={newSujet.faculté}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, faculté: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Faculté des sciences, etc."
                />
              </div>
            </motion.div>
          )}

          {/* Onglet Méthodologie */}
          {activeTab === 'methodology' && (
            <motion.div
              key="methodology"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Problématique
                </label>
                <textarea
                  value={newSujet.problématique}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, problématique: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Question de recherche principale..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Méthodologie
                </label>
                <textarea
                  value={newSujet.méthodologie}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, méthodologie: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Méthodes de recherche envisagées..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Technologies
                </label>
                <input
                  type="text"
                  value={newSujet.technologies}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, technologies: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Python, TensorFlow, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulté
                  </label>
                  <select
                    value={newSujet.difficulté}
                    onChange={(e) => setNewSujet(prev => ({ ...prev, difficulté: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="facile">Facile</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durée estimée
                  </label>
                  <input
                    type="text"
                    value={newSujet.durée_estimée}
                    onChange={(e) => setNewSujet(prev => ({ ...prev, durée_estimée: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6 mois, 1 an, etc."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Onglet Ressources */}
          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ressources
                </label>
                <textarea
                  value={newSujet.ressources}
                  onChange={(e) => setNewSujet(prev => ({ ...prev, ressources: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Liens, bibliographie, ressources recommandées..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajoutez des liens utiles, des références bibliographiques ou toute autre ressource
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pied fixe avec progression et actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progression</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Object.values({
                  info: newSujet.titre && newSujet.description,
                  academic: newSujet.domaine && newSujet.niveau,
                  methodology: true,
                  resources: true
                }).filter(Boolean).length}/4 onglets
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(Object.values({
                    info: newSujet.titre && newSujet.description,
                    academic: newSujet.domaine && newSujet.niveau,
                    methodology: true,
                    resources: true
                  }).filter(Boolean).length / 4) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab)
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1].id as any)
                  }
                }}
                disabled={activeTab === tabs[0].id}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Précédent
              </button>
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab)
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id as any)
                  }
                }}
                disabled={activeTab === tabs[tabs.length - 1].id}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Suivant
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSujet}
                disabled={createLoading || !newSujet.titre || !newSujet.description || !newSujet.domaine || !newSujet.niveau}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Créer le sujet
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'sujets'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'admin' | 'enseignant' | 'etudiant'>('all')
  const [sujetFilter, setSujetFilter] = useState<'all' | 'active' | 'inactive' | 'popular' | 'recent'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Données
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSujets: 0,
    activeSujets: 0,
    aiAnalyses: 0,
    newUsers7d: 0,
    newSujets7d: 0,
    systemHealth: 100
  })

  const [users, setUsers] = useState<User[]>([])
  const [sujets, setSujets] = useState<Sujet[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [domainStats, setDomainStats] = useState<DomainStat[]>([])
  const [roleStats, setRoleStats] = useState<RoleStat[]>([])

  // États de chargement pour les actions
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  // Pagination
  const [usersPage, setUsersPage] = useState(1)
  const [sujetsPage, setSujetsPage] = useState(1)
  const itemsPerPage = 20

  // Sélections
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedSujets, setSelectedSujets] = useState<number[]>([])

  // Modal de création de sujet
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Modal
  interface ConfirmModalData {
    title: string
    message: string
    action: () => Promise<void>
    type: 'delete' | 'deactivate' | 'activate'
    itemId?: number
    itemType?: 'user' | 'sujet'
  }
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null)

  // Charger toutes les données
  // Charger toutes les données
const fetchDashboardData = useCallback(async (showToast = false) => {
  try {
    setLoading(true)
    setError(null)

    // Récupérer les stats admin
    const adminStats = await api.getAdminStats().catch(() => null)
    
    // Récupérer TOUS les sujets avec pagination
    let allSujets: Sujet[] = []
    let sujetSkip = 0
    const limit = 100
    
    try {
      let hasMoreSujets = true
      while (hasMoreSujets) {
        const sujetsPage = await api.getSujets({ 
          skip: sujetSkip,
          limit: limit
        })
        
        if (sujetsPage && sujetsPage.length > 0) {
          allSujets = [...allSujets, ...sujetsPage]
          sujetSkip += limit
          
          if (sujetsPage.length < limit) {
            hasMoreSujets = false
          }
        } else {
          hasMoreSujets = false
        }
      }
      
      console.log(`✅ ${allSujets.length} sujets chargés`)
      
    } catch (error) {
      console.warn('Erreur chargement sujets:', error)
      const fallbackSujets = await api.getSujets({ limit: 100 }).catch(() => [])
      allSujets = fallbackSujets
    }

    // Récupérer TOUS les utilisateurs avec pagination
    let allUsers: User[] = []
    let userSkip = 0
    
    try {
      let hasMoreUsers = true
      while (hasMoreUsers) {
        // L'API admin/users retourne { users: [], total, skip, limit }
        const usersResponse = await api.getAdminUsers({ 
          skip: userSkip,
          limit: limit
        })
        
        console.log('Réponse users page:', usersResponse) // Debug
        
        if (usersResponse && usersResponse.users && usersResponse.users.length > 0) {
          allUsers = [...allUsers, ...usersResponse.users]
          userSkip += limit
          
          // Vérifier si on a atteint la fin
          if (usersResponse.users.length < limit || 
              allUsers.length >= usersResponse.total) {
            hasMoreUsers = false
          }
        } else {
          hasMoreUsers = false
        }
      }
      
      console.log(`✅ ${allUsers.length} utilisateurs chargés`)
      
    } catch (error) {
      console.warn('Erreur chargement utilisateurs:', error)
      // Fallback sur données mockées
      allUsers = await getMockUsers()
      console.log(`⚠️ ${allUsers.length} utilisateurs mockés chargés`)
    }

    // Mettre à jour les états
    setUsers(allUsers)
    setSujets(allSujets)

    if (adminStats) {
      setStats({
        totalUsers: adminStats.total_users,
        activeUsers: adminStats.active_users,
        totalSujets: adminStats.total_sujets,
        activeSujets: adminStats.active_sujets,
        aiAnalyses: adminStats.ai_analyses,
        newUsers7d: adminStats.recent_stats?.new_users_7d || 0,
        newSujets7d: adminStats.recent_stats?.new_sujets_7d || 0,
        systemHealth: calculateSystemHealth(adminStats)
      })

      setDomainStats(adminStats.domain_stats || [])
      setRoleStats(adminStats.role_stats || [])

      if (adminStats.recent_activities) {
        setRecentActivities(
          adminStats.recent_activities.slice(0, 6).map((act, idx) => ({
            id: idx + 1,
            type: act.type as any,
            action: act.action,
            user: act.user,
            timestamp: formatTimestamp(act.timestamp),
            icon: getActivityIcon(act.type),
            color: getActivityColor(act.type)
          }))
        )
      }
    }

    if (showToast) {
      toast.success('Données actualisées avec succès', {
        description: `${allSujets.length} sujets • ${allUsers.length} utilisateurs`
      })
    }

  } catch (err: any) {
    console.error('❌ Erreur chargement admin:', err)
    setError(err?.message || 'Erreur lors du chargement des données')
    if (showToast) {
      toast.error('Erreur lors du chargement des données')
    }
  } finally {
    setLoading(false)
  }
}, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const calculateSystemHealth = (stats: any): number => {
    let score = 100
    if (!stats) return 0
    if (stats.total_users === 0) score -= 20
    if (stats.total_sujets === 0) score -= 20
    if (stats.active_users === 0) score -= 30
    if (stats.active_sujets === 0) score -= 30
    return Math.max(0, score)
  }

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) return 'À l\'instant'
      if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
      if (diffHours < 24) return `Il y a ${diffHours} h`
      if (diffDays === 1) return 'Hier'
      if (diffDays < 7) return `Il y a ${diffDays} jours`
      return date.toLocaleDateString('fr-FR')
    } catch {
      return timestamp
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />
      case 'sujet': return <FileText className="w-4 h-4" />
      case 'ai': return <Brain className="w-4 h-4" />
      case 'feedback': return <MessageSquare className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'sujet': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'ai': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'feedback': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getMockUsers = async (): Promise<User[]> => {
    return [
      {
        id: 1,
        email: 'admin@memoguide.com',
        full_name: 'Admin Principal',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        email: 'jean.dupont@universite.fr',
        full_name: 'Jean Dupont',
        role: 'enseignant',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        email: 'marie.martin@etudiant.fr',
        full_name: 'Marie Martin',
        role: 'etudiant',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        email: 'inactif@email.com',
        full_name: 'Compte Inactif',
        role: 'etudiant',
        is_active: false,
        created_at: new Date().toISOString()
      }
    ]
  }

  // Filtrage optimisé avec useMemo
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!user.email.toLowerCase().includes(query) &&
          !user.full_name.toLowerCase().includes(query)) {
          return false
        }
      }

      if (userFilter === 'active') return user.is_active
      if (userFilter === 'inactive') return !user.is_active
      if (userFilter === 'admin') return user.role === 'admin'
      if (userFilter === 'enseignant') return user.role === 'enseignant'
      if (userFilter === 'etudiant') return user.role === 'etudiant'

      return true
    })
  }, [users, searchQuery, userFilter])

  const filteredSujets = useMemo(() => {
    return sujets.filter(sujet => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!sujet.titre.toLowerCase().includes(query) &&
          !sujet.description.toLowerCase().includes(query)) {
          return false
        }
      }

      if (sujetFilter === 'active') return sujet.is_active
      if (sujetFilter === 'inactive') return !sujet.is_active
      if (sujetFilter === 'popular') return sujet.vue_count > 50
      if (sujetFilter === 'recent') {
        const date = new Date(sujet.created_at)
        const now = new Date()
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
        return diffDays < 7
      }

      return true
    })
  }, [sujets, searchQuery, sujetFilter])

  // Pagination
  const paginatedUsers = useMemo(() =>
    filteredUsers.slice(
      (usersPage - 1) * itemsPerPage,
      usersPage * itemsPerPage
    ), [filteredUsers, usersPage]
  )

  const paginatedSujets = useMemo(() =>
    filteredSujets.slice(
      (sujetsPage - 1) * itemsPerPage,
      sujetsPage * itemsPerPage
    ), [filteredSujets, sujetsPage]
  )

  const totalUsersPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const totalSujetsPages = Math.ceil(filteredSujets.length / itemsPerPage)

  // Actions utilisateur
  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate' | 'delete') => {
    const actionKey = `user-${userId}-${action}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      if (action === 'delete') {
        await api.deleteUser(userId)
        setUsers(prev => prev.filter(u => u.id !== userId))
        setSelectedUsers(prev => prev.filter(id => id !== userId))
        toast.success('Utilisateur supprimé avec succès', {
          description: `L'utilisateur a été définitivement supprimé.`,
          icon: <Trash2 className="w-4 h-4" />
        })
      } else if (action === 'activate') {
        await api.activateUser(userId)
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_active: true } : u
        ))
        toast.success('Utilisateur activé avec succès', {
          description: `L'utilisateur peut maintenant se connecter.`,
          icon: <UserCheck className="w-4 h-4" />
        })
      } else {
        await api.deactivateUser(userId)
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_active: false } : u
        ))
        toast.warning('Utilisateur désactivé', {
          description: `L'utilisateur ne peut plus se connecter.`,
          icon: <UserX className="w-4 h-4" />
        })
      }

      setStats(prev => ({
        ...prev,
        activeUsers: action === 'activate' ? prev.activeUsers + 1 :
          action === 'deactivate' ? prev.activeUsers - 1 :
            prev.activeUsers,
        totalUsers: action === 'delete' ? prev.totalUsers - 1 : prev.totalUsers
      }))

      setConfirmModal(null)
    } catch (error: any) {
      toast.error('Erreur lors de l\'opération', {
        description: error?.message || 'Une erreur est survenue.'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Actions sujet
  const handleSujetAction = async (sujetId: number, action: 'activate' | 'deactivate' | 'delete') => {
    const actionKey = `sujet-${sujetId}-${action}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      if (action === 'delete') {
        await api.deleteUserSujet(sujetId)
        setSujets(prev => prev.filter(s => s.id !== sujetId))
        setSelectedSujets(prev => prev.filter(id => id !== sujetId))
        toast.success('Sujet supprimé avec succès', {
          description: `Le sujet a été définitivement supprimé.`,
          icon: <Trash2 className="w-4 h-4" />
        })
      } else {
        await api.updateUserSujet(sujetId, { is_active: action === 'activate' })
        setSujets(prev => prev.map(s =>
          s.id === sujetId ? { ...s, is_active: action === 'activate' } : s
        ))

        if (action === 'activate') {
          toast.success('Sujet activé avec succès', {
            description: `Le sujet est maintenant visible par tous.`,
            icon: <Archive className="w-4 h-4" />
          })
        } else {
          toast.warning('Sujet désactivé', {
            description: `Le sujet n'est plus visible.`,
            icon: <Archive className="w-4 h-4" />
          })
        }
      }

      setStats(prev => ({
        ...prev,
        activeSujets: action === 'activate' ? prev.activeSujets + 1 :
          action === 'deactivate' ? prev.activeSujets - 1 :
            prev.activeSujets,
        totalSujets: action === 'delete' ? prev.totalSujets - 1 : prev.totalSujets
      }))

      setConfirmModal(null)
    } catch (error: any) {
      toast.error('Erreur lors de l\'opération', {
        description: error?.message || 'Une erreur est survenue.'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Création de sujet
  const handleCreateSujet = async () => {
    // Validation
    if (!newSujet.titre.trim()) {
      toast.error('Titre requis', {
        description: 'Veuillez saisir un titre pour le sujet.'
      })
      return
    }
    if (!newSujet.description.trim()) {
      toast.error('Description requise', {
        description: 'Veuillez saisir une description.'
      })
      return
    }
    if (!newSujet.domaine.trim()) {
      toast.error('Domaine requis', {
        description: 'Veuillez saisir le domaine.'
      })
      return
    }
    if (!newSujet.niveau.trim()) {
      toast.error('Niveau requis', {
        description: 'Veuillez saisir le niveau.'
      })
      return
    }

    setCreateLoading(true)
    const toastId = toast.loading('Création du sujet en cours...')

    try {
      const createdSujet = await api.createUserSujet(newSujet)

      // Ajouter le nouveau sujet à la liste
      setSujets(prev => [createdSujet, ...prev])

      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        totalSujets: prev.totalSujets + 1,
        activeSujets: prev.activeSujets + 1
      }))

      // Ajouter une activité récente
      const newActivity: RecentActivity = {
        id: Date.now(),
        type: 'sujet',
        action: 'Sujet créé',
        user: 'Admin',
        timestamp: 'À l\'instant',
        icon: <FileText className="w-4 h-4" />,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      }
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 5)])

      toast.success('Sujet créé avec succès', {
        description: `Le sujet "${createdSujet.titre}" a été ajouté.`,
        icon: <CheckCircle className="w-4 h-4" />,
        id: toastId
      })

      // Fermer le modal et réinitialiser le formulaire
      setShowCreateModal(false)
      setNewSujet({
        titre: '',
        description: '',
        keywords: '',
        domaine: '',
        niveau: '',
        faculté: '',
        problématique: '',
        méthodologie: '',
        technologies: '',
        difficulté: 'moyenne',
        durée_estimée: '',
        ressources: ''
      })

    } catch (error: any) {
      toast.error('Erreur lors de la création', {
        description: error?.message || 'Une erreur est survenue.',
        id: toastId
      })
    } finally {
      setCreateLoading(false)
    }
  }

  // Export avec toast
  const handleExport = async (type: 'users' | 'sujets') => {
    const toastId = toast.loading(`Préparation de l'export ${type}...`)

    try {
      const data = type === 'users' ? users : sujets
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memoguide_${type}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Export réussi', {
        description: `${data.length} ${type === 'users' ? 'utilisateurs' : 'sujets'} exportés.`,
        id: toastId
      })
    } catch (error) {
      toast.error('Erreur lors de l\'export', {
        description: 'Veuillez réessayer plus tard.',
        id: toastId
      })
    }
  }

  // Rafraîchissement avec toast
  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const systemStatus = stats.systemHealth > 80 ? 'healthy' : stats.systemHealth > 50 ? 'warning' : 'critical'

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 p-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Erreur de chargement</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (loading) return <AdminSkeleton />

  // Modal de confirmation
  const ConfirmModal = () => {
    if (!confirmModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${confirmModal.type === 'delete' ? 'bg-red-100 dark:bg-red-900/30' :
                confirmModal.type === 'deactivate' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-green-100 dark:bg-green-900/30'
              }`}>
              {confirmModal.type === 'delete' && <Trash2 className="w-6 h-6 text-red-600" />}
              {confirmModal.type === 'deactivate' && <UserX className="w-6 h-6 text-yellow-600" />}
              {confirmModal.type === 'activate' && <UserCheck className="w-6 h-6 text-green-600" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{confirmModal.title}</h3>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmModal.message}</p>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal(null)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={confirmModal.action}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  confirmModal.type === 'deactivate' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-green-600 hover:bg-green-700'
                }`}
            >
              Confirmer
            </button>
          </div>
        </motion.div>
      </div>
    )
  }



  return (
    <div className="space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {confirmModal && <ConfirmModal />}
        <CreateSujetModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newSujet) => {
            // Mettre à jour la liste des sujets
            setSujets(prev => [newSujet, ...prev])
            // Mettre à jour les stats
            setStats(prev => ({
              ...prev,
              totalSujets: prev.totalSujets + 1,
              activeSujets: prev.activeSujets + 1
            }))
            // Ajouter une activité récente
            const newActivity: RecentActivity = {
              id: Date.now(),
              type: 'sujet',
              action: 'Sujet créé',
              user: 'Admin',
              timestamp: 'À l\'instant',
              icon: <FileText className="w-4 h-4" />,
              color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }
            setRecentActivities(prev => [newActivity, ...prev.slice(0, 5)])
          }}
        />
      </AnimatePresence>

      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Administration</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestion de la plateforme MémoGuide
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-500' :
                    systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Système {systemStatus === 'healthy' ? 'Opérationnel' :
                    systemStatus === 'warning' ? 'Alerte' : 'Critique'}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleString('fr-FR')}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'sujets', label: 'Sujets', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${selectedTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {selectedTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Utilisateurs
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{stats.newUsers7d} cette semaine
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.activeUsers} actifs
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalSujets}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Sujets
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{stats.newSujets7d} cette semaine
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.activeSujets} actifs
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.aiAnalyses}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Analyses IA
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(stats.aiAnalyses / Math.max(stats.totalUsers, 1))} par utilisateur
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.systemHealth}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Santé système
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${stats.systemHealth > 80 ? 'bg-green-500' :
                    stats.systemHealth > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.systemHealth > 80 ? 'Excellent' :
                    stats.systemHealth > 60 ? 'Bon' : 'À surveiller'}
                </span>
              </div>
            </div>
          </div>

          {/* Activités récentes et statistiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activités récentes */}
<div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
    <Activity className="w-5 h-5" />
    Activités récentes
  </h3>

  <div className="space-y-3">
    {recentActivities.length > 0 ? (
      recentActivities.map((activity) => (
        <div 
          key={`activity-${activity.id}`}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${activity.color}`}>
              {activity.icon}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                {activity.action}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{activity.user}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {activity.timestamp}
          </div>
        </div>
      ))
    ) : (
      <div key="no-activities" className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Aucune activité récente</p>
      </div>
    )}
  </div>
</div>

            {/* Statistiques des rôles */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Répartition des rôles
              </h3>

              <div className="space-y-4">
                {roleStats.length > 0 ? (
                  roleStats.map((stat) => (
                    <div key={stat.role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700 dark:text-gray-300">
                          {stat.role === 'admin' ? 'Administrateurs' :
                            stat.role === 'enseignant' ? 'Enseignants' : 'Étudiants'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{stat.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(stat.count / stats.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Domaines populaires */}
          {domainStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Domaines les plus populaires
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {domainStats.slice(0, 4).map((stat) => (
                  <div key={stat.domaine} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">{stat.domaine}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.count} sujets</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">{stat.avg_views} vues ∅</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Gestion des utilisateurs */}
      {selectedTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* En-tête */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredUsers.length} utilisateur(s) • {stats.activeUsers} actif(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                  {(userFilter !== 'all' || searchQuery) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => handleExport('users')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtres */}
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="all">Tous les utilisateurs</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="admin">Administrateurs</option>
                  <option value="enseignant">Enseignants</option>
                  <option value="etudiant">Étudiants</option>
                </select>
              </div>
            )}
          </div>

          {/* Liste des utilisateurs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Utilisateur
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Rôle
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inscription
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedUsers.map((user) => {
                    const actionKey = `user-${user.id}`
                    const isLoading = actionLoading[`user-${user.id}-activate`] ||
                      actionLoading[`user-${user.id}-deactivate`] ||
                      actionLoading[`user-${user.id}-delete`]

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                              user.role === 'enseignant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {user.role === 'admin' ? 'Admin' :
                              user.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm font-medium ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {user.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmModal({
                                title: user.is_active ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
                                message: user.is_active
                                  ? `L'utilisateur ${user.email} ne pourra plus se connecter.`
                                  : `L'utilisateur ${user.email} pourra à nouveau se connecter.`,
                                action: () => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate'),
                                type: user.is_active ? 'deactivate' : 'activate',
                                itemId: user.id,
                                itemType: 'user'
                              })}
                              disabled={isLoading}
                              className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title={user.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.is_active ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmModal({
                                title: 'Supprimer l\'utilisateur',
                                message: `Êtes-vous sûr de vouloir supprimer ${user.email} ? Cette action est irréversible.`,
                                action: () => handleUserAction(user.id, 'delete'),
                                type: 'delete',
                                itemId: user.id,
                                itemType: 'user'
                              })}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalUsersPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                  {filteredUsers.length} utilisateur(s) • Page {usersPage}/{totalUsersPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    {usersPage}
                  </span>
                  <button
                    onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                    disabled={usersPage === totalUsersPages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Gestion des sujets */}
      {selectedTab === 'sujets' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* En-tête avec bouton de création */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des sujets</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredSujets.length} sujet(s) • {stats.activeSujets} actif(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau sujet
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                  {(sujetFilter !== 'all' || searchQuery) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => handleExport('sujets')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher un sujet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtres */}
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={sujetFilter}
                  onChange={(e) => setSujetFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="all">Tous les sujets</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="popular">Populaires (50+ vues)</option>
                  <option value="recent">Récents (7 jours)</option>
                </select>
              </div>
            )}
          </div>

          {/* Liste des sujets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Titre
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Domaine
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Vues / Likes
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSujets.map((sujet) => {
                    const actionKey = `sujet-${sujet.id}`
                    const isLoading = actionLoading[`sujet-${sujet.id}-activate`] ||
                      actionLoading[`sujet-${sujet.id}-deactivate`] ||
                      actionLoading[`sujet-${sujet.id}-delete`]

                    return (
                      <tr key={sujet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {sujet.titre.length > 50 ? `${sujet.titre.substring(0, 50)}...` : sujet.titre}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {sujet.description.length > 80 ? `${sujet.description.substring(0, 80)}...` : sujet.description}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                            {sujet.domaine}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">{sujet.vue_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">{sujet.like_count}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${sujet.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm font-medium ${sujet.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {sujet.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/sujets/${sujet.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setConfirmModal({
                                title: sujet.is_active ? 'Désactiver le sujet' : 'Activer le sujet',
                                message: sujet.is_active
                                  ? `Le sujet "${sujet.titre}" ne sera plus visible par les utilisateurs.`
                                  : `Le sujet "${sujet.titre}" sera à nouveau visible par les utilisateurs.`,
                                action: () => handleSujetAction(sujet.id, sujet.is_active ? 'deactivate' : 'activate'),
                                type: sujet.is_active ? 'deactivate' : 'activate',
                                itemId: sujet.id,
                                itemType: 'sujet'
                              })}
                              disabled={isLoading}
                              className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title={sujet.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmModal({
                                title: 'Supprimer le sujet',
                                message: `Êtes-vous sûr de vouloir supprimer "${sujet.titre}" ? Cette action est irréversible.`,
                                action: () => handleSujetAction(sujet.id, 'delete'),
                                type: 'delete',
                                itemId: sujet.id,
                                itemType: 'sujet'
                              })}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalSujetsPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                  {filteredSujets.length} sujet(s) • Page {sujetsPage}/{totalSujetsPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSujetsPage(p => Math.max(1, p - 1))}
                    disabled={sujetsPage === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    {sujetsPage}
                  </span>
                  <button
                    onClick={() => setSujetsPage(p => Math.min(totalSujetsPages, p + 1))}
                    disabled={sujetsPage === totalSujetsPages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}