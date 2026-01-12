// src/app/dashboard/favoris/page.tsx
'use client'

import { Heart, Target, Eye, TrendingUp } from 'lucide-react'

export default function FavorisPage() {
  const favoris = [
    { id: 1, titre: "L'IA dans la santé", domaine: "Médecine", vues: 150 },
    { id: 2, titre: "Cryptomonnaies", domaine: "Finance", vues: 200 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes favoris</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sujets que vous avez marqués comme intéressants
        </p>
      </div>

      {favoris.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {favoris.map((favori) => (
            <div 
              key={favori.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-full">
                      {favori.domaine}
                    </span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {favori.titre}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{favori.vues} vues</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Explorer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun favori
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Ajoutez des sujets à vos favoris en cliquant sur l'icône cœur
          </p>
        </div>
      )}
    </div>
  )
}