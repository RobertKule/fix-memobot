// src/app/dashboard/sujets/mes-sujets/page.tsx
// On adapte le frontend à l’erreur 422 "Input should be a valid integer, unable to parse string as an integer"
// qui vient clairement du backend (Pydantic). On ne peut pas la corriger côté React, on la rend juste lisible.

'use client'

import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Tag,
  GraduationCap,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { api, Sujet } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function MesSujetsPage() {
  const { user } = useAuth()
  const [sujets, setSujets] = useState<Sujet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [technicalError, setTechnicalError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        await fetchUserSujetsDirect(cancelled)
      } catch {
        // erreur déjà gérée dans fetchUserSujetsDirect
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const fetchUserSujetsDirect = async (cancelled = false) => {
    try {
      setLoading(true)
      setError(null)
      setTechnicalError(null)

      if (!user?.id) {
        if (!cancelled) setSujets([])
        return
      }

      const data = await api.getUserSujets()
      if (!cancelled) {
        setSujets(Array.isArray(data) ? data : [])
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de vos sujets:', err)

      // Messages lisibles pour l’utilisateur
      let userMessage =
        err?.message ||
        err?.payload?.detail ||
        'Erreur lors du chargement de vos sujets'

      // Cas particulier de Pydantic: "Input should be a valid integer, unable to parse string as an integer"
      if (
        typeof err?.message === 'string' &&
        err.message.includes('Input should be a valid integer')
      ) {
        userMessage =
          "Erreur de données renvoyées par le serveur (un identifiant n'est pas un nombre valide). " +
          "Contactez l'administrateur ou vérifiez que vos données de sujets sont correctes."
      }

      if (!cancelled) {
        setError(userMessage)
        setTechnicalError(
          typeof err?.message === 'string' ? err.message : JSON.stringify(err?.payload || err)
        )
      }
      toast.error(userMessage)
      throw err
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  const fetchUserSujets = () => fetchUserSujetsDirect(false)

  const handleDeleteSujet = async (sujetId: number) => {
    try {
      await api.deleteUserSujet(sujetId)
      toast.success('Sujet supprimé avec succès')
      await fetchUserSujets()
      setShowDeleteConfirm(null)
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      toast.error(err?.message || 'Erreur lors de la suppression')
    }
  }

  const filteredSujets = sujets.filter((sujet) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sujet.titre.toLowerCase().includes(query) ||
      sujet.description.toLowerCase().includes(query) ||
      sujet.keywords.toLowerCase().includes(query) ||
      sujet.domaine.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Connexion au serveur, nous préparons vos sujets pour vous...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Erreur lors du chargement de vos sujets
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
            {error}
          </p>
          {technicalError && (
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Détail technique: {technicalError}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUserSujets}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Vous devez être connecté pour voir vos sujets
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Connectez-vous puis revenez sur cette page pour gérer vos sujets.
        </p>
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Aller à la page de connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mes sujets
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez vos sujets de mémoire créés
            </p>
          </div>
          <Link
            href="/dashboard/sujets/nouveau"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau sujet
          </Link>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher dans vos sujets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Liste des sujets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSujets.map((sujet) => (
          <div
            key={sujet.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {sujet.titre}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {sujet.domaine}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {sujet.niveau}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                      sujet.difficulté === 'facile'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : sujet.difficulté === 'moyenne'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {sujet.difficulté}
                  </span>
                </div>
              </div>

              {/* Menu d'actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/sujets/${sujet.id}`}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  title="Voir les détails"
                >
                  <Eye className="w-5 h-5" />
                </Link>
                <Link
                  href={`/dashboard/sujets/${sujet.id}/edit`}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                  title="Modifier"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(sujet.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {sujet.description}
            </p>

            {/* Métadonnées */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {sujet.problématique && (
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-24">Problématique:</span>
                  <p className="line-clamp-2">{sujet.problématique}</p>
                </div>
              )}

              {sujet.faculté && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Faculté:</span>
                  <span>{sujet.faculté}</span>
                </div>
              )}

              {sujet.durée_estimée && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{sujet.durée_estimée}</span>
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Créé le {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {sujet.vue_count} vues
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {sujet.like_count} likes
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aucun sujet */}
      {filteredSujets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'Aucun sujet correspondant' : 'Aucun sujet créé'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par créer votre premier sujet de mémoire'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/sujets/nouveau"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer mon premier sujet
            </Link>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmer la suppression
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer ce sujet ? Cette action est
              irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteSujet(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
