// src/components/layout/footer.tsx
'use client'

import Link from 'next/link'
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, BookOpen, Users, Shield, Target } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    'Trouver son sujet': [
      { label: 'Par domaine', href: '#' },
      { label: 'Par critères', href: '#' },
      { label: 'Par niveau', href: '#' },
      { label: 'Sujets populaires', href: '#' },
    ],
    'Recommandations': [
      { label: 'Personnalisées', href: '#' },
      { label: 'Basées sur profil', href: '#' },
      { label: 'Par intérêts', href: '#' },
      { label: 'Par compétences', href: '#' },
    ],
    'Ressources': [
      { label: 'Guides méthodologiques', href: '#' },
      { label: 'Modèles de plan', href: '#' },
      { label: 'Bibliothèques', href: '#' },
      { label: 'Outils de recherche', href: '#' },
    ],
    'Support': [
      { label: 'FAQ académique', href:'#' },
      { label: 'Contact tuteurs', href: '#' },
      { label: 'Centre d\'aide', href: '#' },
      { label: 'Forum étudiant', href: '#'},
    ],
  }

  const features = [
    { icon: Target, title: 'Précision', desc: 'Recommandations ciblées' },
    { icon: BookOpen, title: 'Expertise', desc: 'Sujets validés académiquement' },
    { icon: Users, title: 'Communauté', desc: 'Échanges entre étudiants' },
    { icon: Shield, title: 'Fiabilité', desc: 'Sources vérifiées' },
  ]

  const contactInfo = [
    { icon: Mail, text: 'happykitsa5@gmail.com', href: 'mailto:happykitsa5@gmail.com' },
    { icon: Phone, text: '+243 970 000 000', href: 'tel:+243970000000' },
    { icon: MapPin, text: 'ULPGL Goma, République Démocratique du Congo', href: 'https://maps.google.com' },
  ]

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-6">
      
        {/* Main Footer */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#1E40AF] rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MemoBot</h2>
                  <p className="text-[#1E40AF] dark:text-blue-400 font-medium">
                    Votre partenaire pour trouver votre sujet de mémoire
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                Nous accompagnons les étudiants dans leur recherche académique avec des recommandations 
                personnalisées basées sur leurs intérêts, compétences et critères spécifiques.
              </p>
              
              {/* CTA */}
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#1E40AF] text-white font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg mb-8"
              >
                <BookOpen className="w-5 h-5" />
                Commencer ma recherche
              </Link>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Contact académique</h4>
                <div className="space-y-3">
                  {contactInfo.map((contact, index) => (
                    <a
                      key={index}
                      href={contact.href}
                      className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-[#1E40AF] dark:hover:text-blue-400 transition-colors group"
                    >
                      <contact.icon className="w-5 h-5" />
                      <span className="text-sm">{contact.text}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">{category}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#1E40AF] dark:hover:text-blue-400 transition-colors flex items-center gap-2 group"
                      >
                        <div className="w-1 h-1 bg-[#1E40AF] dark:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      
        {/* Bottom Bar */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; {currentYear} MemoBot • Conçu pour les étudiants de l'ULPGL Goma et au-delà.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/privacy" className="hover:text-[#1E40AF] dark:hover:text-blue-400 transition-colors">
                Vie privée
              </Link>
              <Link href="/terms" className="hover:text-[#1E40AF] dark:hover:text-blue-400 transition-colors">
                Conditions académiques
              </Link>
              <Link href="/cookies" className="hover:text-[#1E40AF] dark:hover:text-blue-400 transition-colors">
                Cookies
              </Link>
              <div className="flex items-center gap-2 text-[#1E40AF] dark:text-blue-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Service académique en ligne</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}