// src/app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Mail,
  Lock,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  LogOut,
  Calendar,
  Clock,
  ShieldCheck,
  Database,
  Users,
  CreditCard,
  Smartphone as Device
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    newsletter: boolean
    recommendations: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts'
    showEmail: boolean
    showActivity: boolean
  }
}

interface SecurityLog {
  id: number
  action: string
  ip_address: string
  device: string
  location: string
  timestamp: string
}

interface ConnectedDevice {
  id: number
  name: string
  type: string
  last_active: string
  current: boolean
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'preferences' | 'privacy' | 'billing'>('account')
  
  // État pour la section de changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // État pour la section des informations du compte
  const [accountForm, setAccountForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  })
  
  // État pour les préférences
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      newsletter: false,
      recommendations: true
    },
    privacy: {
      profileVisibility: 'private',
      showEmail: false,
      showActivity: true
    }
  })
  
  // Données de sécurité
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([
    {
      id: 1,
      name: 'Chrome sur Windows',
      type: 'desktop',
      last_active: new Date().toISOString(),
      current: true
    }
  ])
  
  // États pour les modales
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [deletionStep, setDeletionStep] = useState<'confirm' | 'verify'>('confirm')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  // Charger les données
  useEffect(() => {
    loadUserData()
    loadSecurityLogs()
  }, [])
  
  const loadUserData = async () => {
    try {
      setLoading(true)
      // Charger les préférences depuis l'API
      const prefs = await api.getPreferences()
      if (prefs) {
        // Convertir les préférences JSON si nécessaire
        const userPrefs = typeof prefs === 'string' ? JSON.parse(prefs) : prefs
        setPreferences(userPrefs)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadSecurityLogs = async () => {
    try {
      // Simuler des logs de sécurité
      setSecurityLogs([
        {
          id: 1,
          action: 'Connexion réussie',
          ip_address: '192.168.1.1',
          device: 'Chrome sur Windows',
          location: 'Paris, France',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          action: 'Changement de mot de passe',
          ip_address: '192.168.1.1',
          device: 'Chrome sur Windows',
          location: 'Paris, France',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          action: 'Tentative de connexion échouée',
          ip_address: '89.156.32.45',
          device: 'Firefox sur Android',
          location: 'Lyon, France',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading security logs:', error)
    }
  }
  
  const handleSaveAccount = async () => {
    if (!user?.id) return
    
    try {
      setSaving(true)
      
      // Mettre à jour les informations du compte via l'API
      // Note: Dans un cas réel, vous auriez besoin d'une API pour mettre à jour l'email et le nom
      const updatedUser = { ...user, ...accountForm }
      updateUser(updatedUser)
      
      toast.success('Informations du compte mises à jour avec succès')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }
  
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    
    try {
      setSaving(true)
      
      // Appeler l'API pour changer le mot de passe
      // Note: Vous devez implémenter cette route dans votre backend
      await api.changePassword?.(passwordForm.currentPassword, passwordForm.newPassword)
      
      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Mot de passe changé avec succès')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setSaving(false)
    }
  }
  
  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      
      // Sauvegarder les préférences
      await api.updatePreferences(preferences)
      
      toast.success('Préférences sauvegardées avec succès')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }
  
  const handleRevokeDevice = (deviceId: number) => {
    setConnectedDevices(devices => devices.filter(d => d.id !== deviceId))
    toast.success('Appareil déconnecté')
  }
  
  const handleExportData = async () => {
    try {
      setSaving(true)
      
      // Simuler l'exportation de données
      const exportData = {
        user: user,
        preferences: preferences,
        security_logs: securityLogs,
        export_date: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memo-bot-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Données exportées avec succès')
      setShowExportModal(false)
    } catch (error) {
      toast.error('Erreur lors de l\'exportation des données')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    if (deletionStep === 'confirm') {
      setDeletionStep('verify')
      return
    }
    
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }
    
    try {
      setSaving(true)
      
      // Ici, vous appelleriez l'API pour supprimer le compte
      // await api.deleteAccount()
      
      // Simuler la suppression
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Compte supprimé avec succès')
      logout()
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setSaving(false)
      setShowDeleteModal(false)
      setDeletionStep('confirm')
      setDeleteConfirmation('')
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez vos préférences, sécurité et paramètres du compte
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation latérale */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <nav className="space-y-1 p-2">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <User className="w-4 h-4" />
                Compte
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                Sécurité
              </button>
              
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Palette className="w-4 h-4" />
                Préférences
              </button>
              
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'privacy'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                Confidentialité
              </button>
              
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'billing'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Facturation
              </button>
            </nav>
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className="lg:col-span-3 space-y-6">
          {/* Onglet Compte */}
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Informations du compte
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={accountForm.full_name}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full max-w-md px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full max-w-md px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Votre adresse email est utilisée pour la connexion et les notifications.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveAccount}
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Export et suppression */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Gestion des données
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Exporter vos données</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Téléchargez une copie de toutes vos données
                      </p>
                    </div>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-400">Supprimer le compte</h3>
                      <p className="text-sm text-red-600 dark:text-red-500">
                        Cette action est irréversible. Toutes vos données seront supprimées.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer le compte
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Onglet Sécurité */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Changement de mot de passe */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Changer le mot de passe
                </h2>
                
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Appareils connectés */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Appareils connectés
                </h2>
                
                <div className="space-y-4">
                  {connectedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Device className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {device.name}
                            </span>
                            {device.current && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Dernière activité : {formatDate(device.last_active)}
                          </div>
                        </div>
                      </div>
                      {!device.current && (
                        <button
                          onClick={() => handleRevokeDevice(device.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Déconnecter
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Journal de sécurité */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Journal de sécurité
                </h2>
                
                <div className="space-y-3">
                  {securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-1.5 rounded-full ${
                          log.action.includes('échouée')
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {log.action.includes('échouée') ? (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {log.action}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {log.device} • {log.location} • {log.ip_address}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Onglet Préférences */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Thème */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Apparence
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Thème
                    </label>
                    <div className="flex gap-4">
                      {[
                        { value: 'light', label: 'Clair', icon: '☀️' },
                        { value: 'dark', label: 'Sombre', icon: '🌙' },
                        { value: 'system', label: 'Système', icon: '⚙️' }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value as any }))}
                          className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                            preferences.theme === theme.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <span className="text-2xl mb-2">{theme.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {theme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notifications */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Notifications
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {key === 'email' && 'Notifications par email'}
                          {key === 'push' && 'Notifications push'}
                          {key === 'newsletter' && 'Newsletter'}
                          {key === 'recommendations' && 'Nouvelles recommandations'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {key === 'email' && 'Recevoir des emails concernant votre activité'}
                          {key === 'push' && 'Notifications dans le navigateur'}
                          {key === 'newsletter' && 'Actualités et mises à jour'}
                          {key === 'recommendations' && 'Nouveaux sujets recommandés'}
                        </div>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [key]: !value
                          }
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder les préférences
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Onglet Confidentialité */}
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Visibilité du profil */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Confidentialité du profil
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Visibilité du profil
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'public', label: 'Public', description: 'Tout le monde peut voir votre profil' },
                        { value: 'private', label: 'Privé', description: 'Seuls vous pouvez voir votre profil' },
                        { value: 'contacts', label: 'Contacts uniquement', description: 'Visibles par vos contacts' }
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value={option.value}
                            checked={preferences.privacy.profileVisibility === option.value}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                profileVisibility: e.target.value as any
                              }
                            }))}
                            className="text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    {[
                      { key: 'showEmail', label: 'Afficher l\'email', description: 'Rendre votre adresse email visible' },
                      { key: 'showActivity', label: 'Afficher l\'activité', description: 'Partager votre activité sur la plateforme' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              [item.key]: !prev.privacy[item.key as keyof typeof prev.privacy]
                            }
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.privacy[item.key as keyof typeof preferences.privacy]
                              ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.privacy[item.key as keyof typeof preferences.privacy]
                              ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder les paramètres
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Onglet Facturation */}
          {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Gestion de la facturation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    La gestion des abonnements et factures sera disponible prochainement. Pour toute question, contactez notre support.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                      Gratuit
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Plan actuel
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Usage actuel
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sujets explorés</span>
                      <span className="font-medium">24/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Recommandations</span>
                      <span className="font-medium">12/50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Stockage</span>
                      <span className="font-medium">150MB/1GB</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Prochain renouvellement
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date</span>
                      <span className="font-medium">Jamais (gratuit)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Statut</span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                        Actif
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Prix</span>
                      <span className="font-medium">€0,00/mois</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Modal d'exportation */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Exporter vos données
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Cette opération peut prendre quelques minutes. Un fichier JSON contenant toutes vos données sera téléchargé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Exporter maintenant
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Modal de suppression de compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            {deletionStep === 'confirm' ? (
              <>
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <AlertCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Supprimer votre compte ?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                  Cette action est irréversible. Toutes vos données, y compris votre profil, vos préférences et votre historique, seront définitivement supprimés.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletionStep('verify')}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Continuer
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <AlertCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Confirmation finale
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                  Pour confirmer la suppression, veuillez taper <strong>SUPPRIMER</strong> ci-dessous :
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg mb-6"
                  placeholder="SUPPRIMER"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving || deleteConfirmation !== 'SUPPRIMER'}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Supprimer définitivement'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeletionStep('confirm')
                      setDeleteConfirmation('')
                    }}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}