'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Share2,
  Link as LinkIcon,
  Copy,
  Check,
  Mail,
  Twitter,
  Linkedin,
  MessageSquare,
  Eye,
  Heart,
  TrendingUp,
  Calendar,
  User,
  Globe,
  Hash,
  Search,
  Filter
} from 'lucide-react'
import { api, Sujet } from '@/lib/api'
import { toast } from 'sonner'

export default function CommunitySharePage() {
  const [sujets, setSujets] = useState<Sujet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSujet, setSelectedSujet] = useState<Sujet | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareLinks, setShareLinks] = useState<Record<number, string>>({})
  const [filters, setFilters] = useState({
    domaine: '',
    niveau: '',
    faculté: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Charger les sujets
  useEffect(() => {
    fetchSujets()
  }, [])

  const fetchSujets = async () => {
    try {
      setLoading(true)
      const data = await api.getSujets({ limit: 20 })
      setSujets(data)
      
      // Générer les liens de partage
      const links: Record<number, string> = {}
      data.forEach(sujet => {
        links[sujet.id] = generateShareLink(sujet)
      })
      setShareLinks(links)
      
    } catch (error: any) {
      toast.error('Erreur lors du chargement des sujets')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generateShareLink = (sujet: Sujet): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/share/sujet/${sujet.id}`
  }

  const handleCopyLink = (sujetId: number) => {
    const link = shareLinks[sujetId]
    if (!link) return

    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true)
        toast.success('Lien copié dans le presse-papier')
        
        setTimeout(() => {
          setCopied(false)
        }, 2000)
      })
      .catch(() => {
        toast.error('Erreur lors de la copie du lien')
      })
  }

  const handleShareEmail = (sujet: Sujet) => {
    const subject = encodeURIComponent(`Sujet de mémoire: ${sujet.titre}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nJe vous partage ce sujet de mémoire qui pourrait vous intéresser :\n\n` +
      `📝 ${sujet.titre}\n` +
      `📚 Domaine: ${sujet.domaine}\n` +
      `🎓 Niveau: ${sujet.niveau}\n` +
      `🏛️ Faculté: ${sujet.faculté}\n\n` +
      `🔗 Voir les détails : ${shareLinks[sujet.id]}\n\n` +
      `Cordialement`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleShareTwitter = (sujet: Sujet) => {
    const text = encodeURIComponent(
      `Découvrez ce sujet de mémoire : "${sujet.titre}"\n` +
      `Domaine: ${sujet.domaine} | Niveau: ${sujet.niveau}\n` +
      `#MemoBot #SujetMemoire #${sujet.domaine.replace(/\s+/g, '')}`
    )
    const url = encodeURIComponent(shareLinks[sujet.id])
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`)
  }

  const handleShareLinkedIn = (sujet: Sujet) => {
    const summary = encodeURIComponent(
      `Sujet de mémoire : ${sujet.titre}\n` +
      `Domaine: ${sujet.domaine}\n` +
      `Niveau: ${sujet.niveau}\n` +
      `Faculté: ${sujet.faculté}\n\n` +
      `Partagé via MemoBot`
    )
    const url = encodeURIComponent(shareLinks[sujet.id])
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${summary}`)
  }

  const filteredSujets = sujets.filter(sujet => {
    if (searchQuery && !sujet.titre.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filters.domaine && !sujet.domaine.toLowerCase().includes(filters.domaine.toLowerCase())) {
      return false
    }
    if (filters.niveau && sujet.niveau !== filters.niveau) {
      return false
    }
    if (filters.faculté && !sujet.faculté.toLowerCase().includes(filters.faculté.toLowerCase())) {
      return false
    }
    return true
  })

  // Récupérer les valeurs uniques pour les filtres
  const domaines = [...new Set(sujets.map(s => s.domaine))]
  const niveaux = [...new Set(sujets.map(s => s.niveau))]
  const facultés = [...new Set(sujets.map(s => s.faculté))]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Partager des sujets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Partagez des sujets de mémoire avec vos collègues et votre réseau
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {sujets.length} sujets partageables
            </span>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher un sujet à partager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Filtres */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domaine
                </label>
                <select
                  value={filters.domaine}
                  onChange={(e) => setFilters(prev => ({ ...prev, domaine: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Tous les domaines</option>
                  {domaines.map(domaine => (
                    <option key={domaine} value={domaine}>{domaine}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niveau
                </label>
                <select
                  value={filters.niveau}
                  onChange={(e) => setFilters(prev => ({ ...prev, niveau: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Faculté
                </label>
                <select
                  value={filters.faculté}
                  onChange={(e) => setFilters(prev => ({ ...prev, faculté: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Toutes les facultés</option>
                  {facultés.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Comment partager ?
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                <li>• Cliquez sur "Partager" pour un sujet</li>
                <li>• Copiez le lien ou partagez directement sur les réseaux</li>
                <li>• Tous les sujets sont publics et peuvent être partagés</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des sujets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          // Squelette de chargement
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="flex gap-2 mb-6">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        ) : (
          filteredSujets.map((sujet, index) => (
            <motion.div
              key={sujet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    {sujet.user_id && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Utilisateur #{sujet.user_id}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {sujet.titre}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full">
                      {sujet.domaine}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                      {sujet.niveau}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full">
                      {sujet.faculté}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {sujet.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{sujet.vue_count} vues</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{sujet.like_count} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Partageable</span>
                </div>
              </div>

              {/* Options de partage */}
              <div className="space-y-3">
                {/* Lien de partage */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                      <LinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={shareLinks[sujet.id] || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-transparent text-sm text-gray-900 dark:text-white truncate"
                    />
                    <button
                      onClick={() => handleCopyLink(sujet.id)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Boutons de partage rapide */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleCopyLink(sujet.id)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 mb-1" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">Copier</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareEmail(sujet)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareTwitter(sujet)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-blue-400 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => handleShareLinkedIn(sujet)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Lien vers les détails */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/dashboard/sujets/${sujet.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
                >
                  Voir les détails complets
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Aucun résultat */}
      {!loading && filteredSujets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun sujet à partager
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aucun sujet ne correspond à vos critères de recherche
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ domaine: '', niveau: '', faculté: '' })
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
            <Link
              href="/dashboard/sujets/explore"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Explorer tous les sujets
            </Link>
          </div>
        </div>
      )}

      {/* Sélectionné pour partage (modal-like) */}
      {selectedSujet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Partager "{selectedSujet.titre}"
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLinks[selectedSujet.id] || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleCopyLink(selectedSujet.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShareEmail(selectedSujet)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => handleShareTwitter(selectedSujet)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShareLinkedIn(selectedSujet)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </button>
                <button
                  onClick={() => {
                    // Simuler un partage WhatsApp
                    const text = encodeURIComponent(
                      `Découvrez ce sujet de mémoire : "${selectedSujet.titre}"\n` +
                      `Lien : ${shareLinks[selectedSujet.id]}`
                    )
                    window.open(`https://wa.me/?text=${text}`)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSujet(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}