'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, Search, GraduationCap, 
  ChevronRight, LogIn, UserPlus, 
  Home, BookOpen, MessageSquare, Info 
} from 'lucide-react'
import ThemeToggle from '@/components/ui/theme-toggle'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu si on change de page
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navItems = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Critères', href: '#criteria', icon: BookOpen },
    { label: 'Comment ça marche', href: '#how', icon: Info },
    { label: 'Témoignages', href: '#testimonials', icon: MessageSquare },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 py-2 shadow-sm' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          
          {/* LOGO - Plus compact et aligné */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Memo<span className="text-blue-600">Bot</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                IA Académique
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV - Espacements optimisés */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ACTIONS DROITE - Groupées logiquement */}
          <div className="hidden md:flex items-center gap-3">
            {/* <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm w-40 focus:w-56 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-900 dark:text-white"
              />
            </div>
             */}
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />
            
            <ThemeToggle />
            
            <Link
              href="/login"
              className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors px-2"
            >
              Connexion
            </Link>
            
            <Link
              href="/register"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 transition-all"
            >
              S&apos;inscrire
            </Link>
          </div>

          {/* MOBILE TOGGLE - Plus ergonomique */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-xl transition-colors ${
                isMenuOpen 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU - Refonte totale de l'ergonomie */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay pour focus sur le menu */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1] md:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="container mx-auto p-4 space-y-6">
                
                {/* Barre de recherche mobile - Très accessible */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Quel sujet cherchez-vous ?"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Liens avec icônes pour faciliter la lecture */}
                <div className="grid gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  ))}
                </div>

                {/* Boutons d'action en bas de menu */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 py-4 font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                  >
                    <LogIn className="w-5 h-5" />
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 py-4 font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20"
                  >
                    <UserPlus className="w-5 h-5" />
                    S&apos;inscrire
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}