'use client'

import { useState } from 'react'
import { Plus, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function NouveauSujetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    keywords: '',
    domaine: '',
    niveau: 'L3',
    faculté: '',
    problématique: '',
    méthodologie: '',
    technologies: '',
    difficulté: 'moyenne' as 'facile' | 'moyenne' | 'difficile',
    durée_estimée: '6 mois',
    ressources: ''
  })

  const domainesOptions = [
    'Informatique', 'Génie Civil', 'Médecine', 'Droit', 
    'Économie', 'Commerce', 'Sciences', 'Lettres', 'Arts'
  ]

  const niveauxOptions = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat']
  const difficultesOptions = ['facile', 'moyenne', 'difficile']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validation
      if (!formData.titre.trim() || !formData.description.trim()) {
        toast.error('Le titre et la description sont obligatoires')
        return
      }

      const sujet = await api.createUserSujet(formData)
      
      toast.success('Sujet créé avec succès!')
      router.push(`/dashboard/sujets/${sujet.id}`)
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du sujet')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/sujets/mes-sujets"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à mes sujets
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau sujet
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Créez un nouveau sujet de mémoire personnalisé
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations de base
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre du sujet *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: L'impact de l'IA sur la cybersécurité moderne"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Domaine *
              </label>
              <select
                name="domaine"
                value={formData.domaine}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner un domaine</option>
                {domainesOptions.map(domaine => (
                  <option key={domaine} value={domaine}>{domaine}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveau académique *
              </label>
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {niveauxOptions.map(niveau => (
                  <option key={niveau} value={niveau}>{niveau}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Faculté *
              </label>
              <input
                type="text"
                name="faculté"
                value={formData.faculté}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: Faculté des Sciences"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulté
              </label>
              <select
                name="difficulté"
                value={formData.difficulté}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {difficultesOptions.map(difficulte => (
                  <option key={difficulte} value={difficulte}>{difficulte}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée estimée
              </label>
              <input
                type="text"
                name="durée_estimée"
                value={formData.durée_estimée}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 6 mois"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mots-clés
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Séparez les mots-clés par des virgules (ex: IA, cybersécurité, machine learning)"
              />
            </div>
          </div>
        </div>

        {/* Description et problématique */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Description détaillée
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description du sujet *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Décrivez en détail votre sujet de mémoire..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problématique *
              </label>
              <textarea
                name="problématique"
                value={formData.problématique}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Formulez clairement la problématique de recherche..."
              />
            </div>
          </div>
        </div>

        {/* Méthodologie et ressources */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Méthodologie et ressources
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Méthodologie suggérée
              </label>
              <textarea
                name="méthodologie"
                value={formData.méthodologie}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Décrivez votre approche méthodologique..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technologies à utiliser
              </label>
              <input
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: Python, React, TensorFlow, MongoDB..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ressources nécessaires
              </label>
              <textarea
                name="ressources"
                value={formData.ressources}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Listez les ressources nécessaires (matériel, logiciels, accès aux données)..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/sujets/mes-sujets"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Créer le sujet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}