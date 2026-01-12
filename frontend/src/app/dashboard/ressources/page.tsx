// src/app/dashboard/ressources/page.tsx
'use client'

import { useState } from 'react'
import { 
  FileText, 
  Download, 
  Book, 
  Video, 
  Link as LinkIcon,
  Search,
  Filter,
  ExternalLink,
  Eye,
  Calendar,
  User,
  Folder,
  Clock,
  Star,
  Brain,
  Zap
} from 'lucide-react'

interface Ressource {
  id: number
  title: string
  type: 'PDF' | 'VIDEO' | 'ARTICLE' | 'GUIDE' | 'LINK'
  category: string
  size: string
  description: string
  views: number
  rating: number
  date: string
  author?: string
  tags: string[]
}

export default function RessourcesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  
  const ressources: Ressource[] = [
    {
      id: 1,
      title: "Guide complet de méthodologie de recherche",
      type: "GUIDE",
      category: "Méthodologie",
      size: "2.4 MB",
      description: "Guide étape par étape pour mener une recherche académique efficace",
      views: 1245,
      rating: 4.8,
      date: "2024-01-15",
      author: "Prof. Martin Dubois",
      tags: ["méthodologie", "recherche", "académique"]
    },
    {
      id: 2,
      title: "Comment rédiger un mémoire universitaire",
      type: "PDF",
      category: "Rédaction",
      size: "1.8 MB",
      description: "Conseils pratiques pour la rédaction et la structuration d'un mémoire",
      views: 1890,
      rating: 4.9,
      date: "2024-02-20",
      author: "Dr. Sophie Laurent",
      tags: ["rédaction", "mémoire", "structure"]
    },
    {
      id: 3,
      title: "Vidéo : Structure d'un mémoire de recherche",
      type: "VIDEO",
      category: "Tutoriel",
      size: "45 MB",
      description: "Vidéo explicative sur l'organisation des différentes parties d'un mémoire",
      views: 890,
      rating: 4.7,
      date: "2024-03-10",
      tags: ["vidéo", "tutoriel", "structure"]
    },
    {
      id: 4,
      title: "Bibliographie et citations - Normes APA",
      type: "ARTICLE",
      category: "Rédaction",
      size: "850 KB",
      description: "Guide des normes APA pour les citations et références bibliographiques",
      views: 2100,
      rating: 4.6,
      date: "2024-01-30",
      author: "Dr. Thomas Bernard",
      tags: ["citations", "APA", "bibliographie"]
    },
    {
      id: 5,
      title: "Analyse statistique pour la recherche",
      type: "GUIDE",
      category: "Analyse",
      size: "3.2 MB",
      description: "Méthodes d'analyse statistique adaptées à la recherche académique",
      views: 956,
      rating: 4.5,
      date: "2024-02-28",
      author: "Prof. Éric Moreau",
      tags: ["statistiques", "analyse", "méthodes"]
    },
    {
      id: 6,
      title: "Outils gratuits pour la recherche",
      type: "LINK",
      category: "Outils",
      size: "N/A",
      description: "Liste d'outils en ligne gratuits pour faciliter vos recherches",
      views: 1560,
      rating: 4.8,
      date: "2024-03-05",
      tags: ["outils", "gratuit", "recherche"]
    }
  ]

  const categories = ['all', ...new Set(ressources.map(r => r.category))]
  const types = ['all', 'PDF', 'VIDEO', 'ARTICLE', 'GUIDE', 'LINK']
  
  const filteredRessources = ressources.filter(ressource => {
    const matchesSearch = searchQuery === '' || 
      ressource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ressource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ressource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || ressource.category === selectedCategory
    const matchesType = selectedType === 'all' || ressource.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />
      case 'VIDEO': return <Video className="w-5 h-5 text-blue-500" />
      case 'ARTICLE': return <Book className="w-5 h-5 text-green-500" />
      case 'GUIDE': return <Brain className="w-5 h-5 text-blue-500" />
      case 'LINK': return <LinkIcon className="w-5 h-5 text-orange-500" />
      default: return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'PDF': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      case 'VIDEO': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case 'ARTICLE': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'GUIDE': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case 'LINK': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ressources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Documents et guides pour vous aider dans vos recherches
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Télécharger tout
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher une ressource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Toutes catégories' : category}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tous types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{ressources.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ressources</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {ressources.filter(r => r.type === 'PDF').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">PDFs</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {ressources.reduce((sum, r) => sum + r.views, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vues totales</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(ressources.reduce((sum, r) => sum + r.rating, 0) / ressources.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Note moyenne</div>
          </div>
        </div>
      </div>

      {/* Liste des ressources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRessources.map((ressource) => (
          <div 
            key={ressource.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {getTypeIcon(ressource.type)}
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(ressource.type)}`}>
                      {ressource.type}
                    </span>
                    <span className="ml-2 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-full">
                      {ressource.category}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {ressource.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {ressource.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {ressource.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* Métadonnées */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{ressource.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{ressource.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(ressource.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {ressource.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{ressource.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Folder className="w-4 h-4" />
                    <span>{ressource.size}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4" />
                  {ressource.type === 'LINK' ? 'Visiter le site' : 'Voir les détails'}
                </button>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-500">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aucun résultat */}
      {filteredRessources.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune ressource trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}

      {/* Conseils */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Conseil du jour</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Consultez régulièrement les ressources de méthodologie pour améliorer la qualité de votre recherche.
              Les guides pratiques peuvent vous faire gagner beaucoup de temps !
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}