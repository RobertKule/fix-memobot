// src/app/dashboard/historique/page.tsx
'use client'

import { Clock, Target, Eye, TrendingUp } from 'lucide-react'

export default function HistoriquePage() {
  const historique = [
    { id: 1, titre: "Énergies renouvelables", date: "Aujourd'hui", action: "Consultation" },
    { id: 2, titre: "Marketing digital", date: "Hier", action: "Recherche" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Votre activité récente sur la plateforme
        </p>
      </div>

      <div className="space-y-4">
        {historique.map((item) => (
          <div 
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.titre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.action} • {item.date}
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Revoir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}