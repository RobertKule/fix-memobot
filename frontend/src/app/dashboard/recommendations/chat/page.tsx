'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Save, Star, Clock, Target, Check, ArrowLeft } from 'lucide-react'

export default function RecommendationsPage() {
    const [subjects, setSubjects] = useState<any[]>([])
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [sessionId, setSessionId] = useState<string>('')
    const [saveSuccess, setSaveSuccess] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()

    useEffect(() => {
        loadGeneratedSubjects()
    }, [])

    const loadGeneratedSubjects = async () => {
        try {
            setIsLoading(true)

            // Vérifier si on a des sujets en localStorage
            const storedSubjects = localStorage.getItem('generated_subjects')
            const storedSessionId = localStorage.getItem('generation_session_id')

            if (storedSubjects && storedSessionId) {
                setSubjects(JSON.parse(storedSubjects))
                setSessionId(storedSessionId)
            } else {
                // Essayer de récupérer depuis l'URL
                const urlSessionId = searchParams.get('session')
                if (urlSessionId) {
                    // Ici vous pourriez récupérer depuis l'API si nécessaire
                    console.log('Session ID from URL:', urlSessionId)
                }
            }
        } catch (error) {
            console.error('Erreur chargement sujets:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectSubject = (index: number) => {
        setSelectedSubject(index)
    }

    const handleSaveSubject = async () => {
        if (selectedSubject === null || !user) return

        setIsSaving(true)
        try {
            const subject = subjects[selectedSubject]

            // Préparer les données pour sauvegarde
            const saveData = {
                titre: subject.titre,
                description: subject.description,
                keywords: subject.keywords,
                domaine: subject.domaine,
                niveau: subject.niveau,
                faculté: subject.faculté,
                problématique: subject.problématique,
                méthodologie: subject.methodologie || subject.méthodologie || '',
                difficulté: subject.difficulté,
                durée_estimée: subject.durée_estimée,
                interests: subject.keywords.split(',').map((k: string) => k.trim())
            }

            const savedSujet = await api.saveChosenSubject(saveData)

            if (savedSujet && savedSujet.id) {
                setSaveSuccess(true)

                // Nettoyer le localStorage
                localStorage.removeItem('generated_subjects')
                localStorage.removeItem('generation_session_id')

                // Rediriger vers la page du sujet après 2 secondes
                setTimeout(() => {
                    router.push(`/dashboard/sujets/${savedSujet.id}`)
                }, 2000)
            }

        } catch (error) {
            console.error('Erreur sauvegarde:', error)
            alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement de vos sujets générés...</p>
                </div>
            </div>
        )
    }

    if (subjects.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Aucun sujet généré
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Vous n'avez pas encore généré de sujets depuis le chat.
                        Retournez discuter avec MemoBot pour générer des sujets personnalisés.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retour au tableau de bord
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Vos sujets générés
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Sélectionnez le sujet qui vous intéresse le plus pour le sauvegarder dans votre collection
                    </p>
                </div>

                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4"
                    >
                        <div className="flex items-center">
                            <Check className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                            <div>
                                <h3 className="font-semibold text-green-800 dark:text-green-300">
                                    Sujet sauvegardé avec succès !
                                </h3>
                                <p className="text-green-700 dark:text-green-400 text-sm">
                                    Redirection vers vos sujets...
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 ${selectedSubject === index
                                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            onClick={() => handleSelectSubject(index)}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <Target className="w-5 h-5 text-blue-500 mr-2" />
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                Sujet {index + 1}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            {subject.titre}
                                        </h3>
                                    </div>
                                    {selectedSubject === index && (
                                        <div className="ml-4">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Problématique
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {subject.problématique}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {subject.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Star className="w-4 h-4 mr-1" />
                                                <span className="capitalize">{subject.difficulté}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{subject.durée_estimée}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            {subject.domaine}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {selectedSubject !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Vous avez sélectionné : {subjects[selectedSubject].titre}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                    Ce sujet sera ajouté à votre collection personnelle
                                </p>
                            </div>

                            <button
                                onClick={handleSaveSubject}
                                disabled={isSaving}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sauvegarde...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Sauvegarder ce sujet
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}