'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  Calendar, 
  User, 
  Globe, 
  Copy,
  Check,
  Share2 
} from 'lucide-react'
import Link from 'next/link'
import { api, Sujet } from '@/lib/api'
import { toast } from 'sonner'

export default function PublicSujetPage() {
  const params = useParams()
  const [sujet, setSujet] = useState<Sujet | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchSujet()
  }, [params.id])

  const fetchSujet = async () => {
    try {
      setLoading(true)
      const data = await api.getSujet(Number(params.id))
      setSujet(data.sujet)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!sujet) return
    
    const link = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true)
        toast.success('Lien copié')
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        toast.error('Erreur lors de la copie')
      })
  }

  if (error) {
    return notFound()
  }

  if (loading || !sujet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Sujet partagé
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Partagé depuis MemoBot
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Créé le {new Date(sujet.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {sujet.user_id && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Utilisateur #{sujet.user_id}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{sujet.vue_count} vues</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{sujet.like_count} likes</span>
              </div>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {sujet.titre}
          </h2>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
              {sujet.domaine}
            </span>
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
              {sujet.niveau}
            </span>
            <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">
              {sujet.faculté}
            </span>
            <span className={`px-4 py-2 rounded-full font-medium ${
              sujet.difficulté === 'facile' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
              sujet.difficulté === 'moyenne' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              Difficulté : {sujet.difficulté}
            </span>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {sujet.description}
            </p>
          </div>

          {/* Problématique */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problématique</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {sujet.problématique}
            </p>
          </div>

          {/* Mots-clés */}
          {sujet.keywords && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Mots-clés</h3>
              <div className="flex flex-wrap gap-2">
                {sujet.keywords.split(',').map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {sujet.durée_estimée && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Durée estimée</h4>
                <p className="text-gray-900 dark:text-white">{sujet.durée_estimée}</p>
              </div>
            )}
            {sujet.technologies && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Technologies</h4>
                <p className="text-gray-900 dark:text-white">{sujet.technologies}</p>
              </div>
            )}
            {sujet.ressources && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ressources</h4>
                <p className="text-gray-900 dark:text-white">{sujet.ressources}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Lien copié !' : 'Copier le lien'}
            </button>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Rejoindre MemoBot
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ce sujet a été partagé via MemoBot • Plateforme de recommandation de sujets de mémoire
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}