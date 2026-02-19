// src/components/skeletons/DashboardSkeleton.tsx
'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-2xl p-8">
        <Skeleton className="h-8 w-64 bg-white/20 mb-2" />
        <Skeleton className="h-5 w-96 bg-white/20 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-32 bg-white/20 rounded-full" />
          <Skeleton className="h-8 w-32 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Profile and Actions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full mt-4 rounded-lg" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}