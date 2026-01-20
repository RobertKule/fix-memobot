// src/lib/api.ts - VERSION OPTIMISÉE

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ====== TYPES ======
export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'enseignant' | 'etudiant'
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id?: number
  user_id: number
  bio?: string
  location?: string
  university?: string
  field?: string
  level?: string
  interests?: string
  phone?: string
  website?: string
  linkedin?: string
  github?: string
  created_at: string
  updated_at: string
}

export interface UserSkill {
  id: number
  user_id: number
  name: string
  level: number
  category?: string
  created_at: string
}

export interface UserStats {
  profile_completion: number
  explored_subjects: number
  recommendations_count: number
  active_days: number
  last_active: string
}

export interface SujetDetailResponse {
  sujet: Sujet
  analyse?: AIAnalysisResponse
}

export interface Sujet {
  id: number
  titre: string
  keywords: string
  domaine: string
  faculté: string
  niveau: string
  problématique: string
  méthodologie?: string
  technologies?: string
  description: string
  difficulté: 'facile' | 'moyenne' | 'difficile'
  durée_estimée?: string
  ressources?: string
  vue_count: number
  like_count: number
  is_active: boolean
  created_at: string
  user_id?: number
}

export function checkAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      throw new Error('Non authentifié')
    }
  }
}

export interface RecommendedSujet {
  sujet: Sujet
  score: number
  raisons: string[]
  critères_respectés: string[]
}

export interface AIResponse {
  question: string
  message: string
  suggestions: string[]
}

export interface GeneratedSubject {
  titre: string
  problématique: string
  keywords: string
  description: string
  methodologie: string
  difficulté: string
  durée_estimée: string
}

export interface AIAnalysisResponse {
  pertinence: number
  points_forts: string[]
  points_faibles: string[]
  suggestions: string[]
  recommandations: string[]
}

export interface AcceptanceCriteria {
  critères_acceptation: string[]
  critères_rejet: string[]
  conseils_pratiques: string[]
}

export interface UserPreference {
  id: number
  user_id: number
  interests?: string
  faculty?: string
  level?: string
  created_at: string
  updated_at?: string
}

export interface Feedback {
  id: number
  user_id: number
  sujet_id: number
  rating?: number
  pertinence?: number
  commentaire?: string
  intéressé: boolean
  sélectionné: boolean
  created_at: string
}

export function checkAuth(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!localStorage.getItem('access_token')
}

export function redirectToLoginIfNotAuthenticated(returnPath?: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const token = localStorage.getItem('access_token')
  if (!token) {
    const currentPath = returnPath || window.location.pathname
    const returnUrl = encodeURIComponent(currentPath)

    if (window.location.pathname !== '/login') {
      window.location.href = `/login?returnUrl=${returnUrl}`
    }
    return false
  }

  return true
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!localStorage.getItem('access_token')
}

export function logoutAndRedirect(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_preferences')
    window.location.href = '/login'
  }
}

export interface StatsDomains {
  domaine: string
  count: number
  avg_views: number
}

export interface PopularKeyword {
  keyword: string
  count: number
}

export interface HealthCheck {
  status: string
  service: string
}

export interface Config {
  database_url: string
  gemini_api_key: string
  environment: string
}

// ========= UTILITAIRES PERF / CACHE =========

// Cache simple en mémoire (par onglet, pas SSR)
type CacheEntry<T> = {
  timestamp: number
  data: T
}

const memoryCache = new Map<string, CacheEntry<any>>()

// TTL en ms pour certains endpoints peu changeants
const DEFAULT_TTL = 60_000 // 1 minute
const LONG_TTL = 5 * 60_000 // 5 minutes

function getCacheKey(endpoint: string, options?: RequestInit) {
  const method = options?.method || 'GET'
  const body = options?.body ? String(options.body) : ''
  return `${method}:${endpoint}:${body}`
}

function getFromCache<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    memoryCache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  memoryCache.set(key, { timestamp: Date.now(), data })
}

// ========= CLASSE API =========
class ApiService {
  // liste minimaliste d’endpoints à logguer / non-cachables
  private noisyEndpoints = ['/auth/login-json', '/auth/register']

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    opts?: { cacheTTL?: number; disableCache?: boolean }
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }

    let token: string | null = null
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('access_token')
    }

    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register')

    if (token && !isAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const method = (options.method || 'GET').toUpperCase()
    const isSafeMethod = method === 'GET'

    // Gestion du cache seulement pour GET
    const cacheKey = getCacheKey(endpoint, options)
    const cacheTTL = opts?.cacheTTL ?? DEFAULT_TTL

    if (isSafeMethod && !opts?.disableCache) {
      const cached = getFromCache<T>(cacheKey, cacheTTL)
      if (cached) {
        return cached
      }
    }

    const shouldLog = this.noisyEndpoints.some(e => endpoint.includes(e)) === false

    if (shouldLog && process.env.NODE_ENV === 'development') {
      console.debug('API Request:', { url, method, endpoint })
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (shouldLog && process.env.NODE_ENV === 'development') {
        console.debug('API Response:', {
          url,
          status: response.status,
          ok: response.ok,
        })
      }

      if (response.status === 401 && !isAuthEndpoint) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('user_preferences')
        }

        throw {
          status: 401,
          message: 'Session expirée. Veuillez vous reconnecter.',
          isUnauthorized: true,
        }
      }

       if (!response.ok) {
        let errorMessage: string | undefined
        let errorPayload: any = undefined

        try {
          // FastAPI renvoie souvent un body JSON avec detail
          const errorData = await response.json()
          errorPayload = errorData

          if (typeof errorData?.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData?.detail)) {
            // Cas typique de validation FastAPI: list de {loc, msg, type}
            const msgs = errorData.detail
              .map((d: any) => d?.msg)
              .filter(Boolean)
              .join(' | ')
            errorMessage = msgs || undefined
          } else if (errorData?.message) {
            errorMessage = errorData.message
          }
        } catch {
          const text = await response.text().catch(() => '')
          if (text) {
            errorMessage = text
          }
        }

        if (!errorMessage) {
          errorMessage = `Erreur HTTP ${response.status}`
        }

        const finalError: any = new Error(errorMessage)
        finalError.status = response.status
        finalError.payload = errorPayload

        if (isAuthEndpoint) {
          // message plus explicite côté auth
          finalError.message = errorMessage || 'Email ou mot de passe incorrect'
        }

        throw finalError
      }

      if (response.status === 204) {
        return true as T
      }

      const data = (await response.json()) as T

      if (isSafeMethod && !opts?.disableCache) {
        setCache(cacheKey, data)
      }

      return data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Request failed:', error)
      }
      throw error
    }
  }

  // ========== AUTH ==========
  async login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string }>('/auth/login-json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, { disableCache: true })
  }

  async register(data: {
    email: string
    full_name: string
    password: string
    role: 'admin' | 'enseignant' | 'etudiant'
  }) {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me', {}, { cacheTTL: 30_000 })
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, { disableCache: true })
  }

  async resetPassword(token: string, new_password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }, { disableCache: true })
  }

  // ========== SUJETS UTILISATEUR ==========
  async getUserSujets(): Promise<Sujet[]> {
    return this.request<Sujet[]>('/sujets/user-sujets', {}, { cacheTTL: 10_000 })
  }

  async getUserFavoris(): Promise<Sujet[]> {
    return this.request<Sujet[]>('/sujets/favoris', {}, { cacheTTL: 10_000 })
  }

  async getRecentSujets(limit: number = 20): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/explore/recent?limit=${limit}`, {}, { cacheTTL: 10_000 })
  }

  async getRecommandesSujets(limit: number = 10): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/stats/popular?limit=${limit}`, {}, { cacheTTL: 10_000 })
  }

  async createUserSujet(data: {
    titre: string
    description: string
    keywords: string
    domaine: string
    niveau: string
    faculté: string
    problématique: string
    méthodologie?: string
    technologies?: string
    difficulté: 'facile' | 'moyenne' | 'difficile'
    durée_estimée?: string
    ressources?: string
  }): Promise<Sujet> {
    return this.request<Sujet>('/sujets/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async updateUserSujet(
    sujetId: number,
    data: Partial<{
      titre: string
      description: string
      keywords: string
      domaine: string
      niveau: string
      faculté: string
      problématique: string
      méthodologie?: string
      technologies?: string
      difficulté: 'facile' | 'moyenne' | 'difficile'
      durée_estimée?: string
      ressources?: string
      is_active: boolean
    }>,
  ): Promise<Sujet> {
    return this.request<Sujet>(`/sujets/${sujetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async deleteUserSujet(sujetId: number): Promise<boolean> {
    return this.request<boolean>(`/sujets/${sujetId}`, {
      method: 'DELETE',
    }, { disableCache: true })
  }

  async likeSujet(sujetId: number): Promise<{ message: string; like_count: number }> {
    return this.request<{ message: string; like_count: number }>(`/sujets/${sujetId}/like`, {
      method: 'POST',
    }, { disableCache: true })
  }

  // ========== HISTORIQUE & ACTIVITÉ ==========
  async getUserHistory(): Promise<any[]> {
    return this.request<any[]>('/users/me/historique', {}, { cacheTTL: 15_000 })
  }

  async getUserActivity(): Promise<{
    feedbacks: any[]
    sujets_created: any[]
    conversations: any[]
  }> {
    return this.request<any>('/users/me/activity', {}, { cacheTTL: 15_000 })
  }

  async getConversationHistory(limit: number = 20): Promise<any[]> {
    return this.request<any[]>(`/ai/conversations?limit=${limit}`, {}, { cacheTTL: 10_000 })
  }

  // ========== STATISTIQUES UTILISATEUR ==========
  async getUserDashboardStats(): Promise<{
    total_sujets: number
    user_sujets: number
    saved_sujets: number
    recommendations_count: number
    last_activity: string
    popular_keywords: PopularKeyword[]
    domain_stats: StatsDomains[]
  }> {
    return this.request('/users/me/dashboard-stats', {}, { cacheTTL: 15_000 })
  }

  async getUserProgress(): Promise<{
    profile_completion: number
    subjects_explored: number
    recommendations_made: number
    days_active: number
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }> {
    return this.request('/users/me/progress', {}, { cacheTTL: 15_000 })
  }

  // ========== RECOMMANDATIONS AVANCÉES ==========
  async getPersonalizedRecommendations(params?: {
    limit?: number
    similarity?: 'keywords' | 'domaine' | 'faculty' | 'all'
  }): Promise<RecommendedSujet[]> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.similarity) query.set('similarity', params.similarity)

    return this.request<RecommendedSujet[]>(
      `/ai/recommendations/personalized?${query.toString()}`,
      {},
      { cacheTTL: 10_000 },
    )
  }

  async getTrendingSujets(period: 'day' | 'week' | 'month' = 'week'): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/stats/trending?period=${period}`, {}, { cacheTTL: 10_000 })
  }

  // ========== SUJETS GÉNÉRAUX ==========
  async getSujets(params?: {
    search?: string
    domaine?: string
    faculté?: string
    niveau?: string
    skip?: number
    limit?: number
  }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }

    const endpoint = query.toString() ? `/sujets?${query}` : '/sujets'
    return this.request<Sujet[]>(endpoint, {}, { cacheTTL: 10_000 })
  }

  async getSujet(id: number): Promise<{ sujet: Sujet; analyse?: AIAnalysisResponse }> {
    return this.request<{ sujet: Sujet; analyse?: AIAnalysisResponse }>(`/sujets/${id}`, {}, { cacheTTL: 30_000 })
  }

  async recommendSujets(data: {
    interests: string[]
    niveau?: string
    faculté?: string
    domaine?: string
    difficulté?: 'facile' | 'moyenne' | 'difficile'
    limit?: number
  }) {
    const interestsArray = Array.isArray(data.interests)
      ? data.interests
      : [data.interests].filter(Boolean)

    const normalizedData = {
      interests: interestsArray,
      niveau: data.niveau || undefined,
      faculté: data.faculté || undefined,
      domaine: data.domaine || undefined,
      difficulté: data.difficulté || undefined,
      limit: data.limit || 10,
    }

    return this.request<RecommendedSujet[]>('/sujets/recommend', {
      method: 'POST',
      body: JSON.stringify(normalizedData),
    }, { disableCache: true })
  }

  // ========== IA AVANCÉE ==========
  async askAI(question: string, context?: string) {
    return this.request<AIResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    }, { disableCache: true })
  }

  async saveChosenSubject(data: {
    titre: string
    description: string
    keywords: string
    domaine: string
    niveau: string
    faculté: string
    problématique: string
    méthodologie: string
    difficulté: string
    durée_estimée: string
    interests?: string[]
  }): Promise<Sujet> {
    const normalizedData = {
      ...data,
      difficulté: data.difficulté.toLowerCase(),
      keywords: data.keywords || '',
      méthodologie: data.méthodologie || '',
      durée_estimée: data.durée_estimée || '6 mois',
    }

    return this.request<Sujet>('/ai/save-chosen-subject', {
      method: 'POST',
      body: JSON.stringify(normalizedData),
    }, { disableCache: true })
  }

  async generateThreeSubjects(data: {
    interests: string[]
    domaine?: string
    niveau?: string
    faculté?: string
  }): Promise<{ subjects: any[]; session_id: string }> {
    return this.request<{ subjects: any[]; session_id: string }>('/ai/generate-three', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async generateSubjects(data: {
    interests: string[]
    domaine?: string
    niveau?: string
    faculté?: string
    count?: number
  }): Promise<GeneratedSubject[]> {
    return this.request<GeneratedSubject[]>('/sujets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async analyzeSubject(data: {
    titre: string
    description: string
    domaine?: string
    niveau?: string
    faculté?: string
    problématique?: string
    keywords?: string
    context?: string
  }) {
    return this.request<AIAnalysisResponse>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  async analyzeMultipleSubjects(
    subjects: {
      titre: string
      description: string
      domaine?: string
    }[],
  ): Promise<{
    analyses: AIAnalysisResponse[]
    comparison: {
      best_score: number
      most_original: number
      easiest: number
      hardest: number
    }
  }> {
    return this.request('/ai/analyze-multiple', {
      method: 'POST',
      body: JSON.stringify({ subjects }),
    }, { disableCache: true })
  }

  async getAcceptanceCriteria() {
    return this.request<AcceptanceCriteria>('/ai/criteria', {}, { cacheTTL: LONG_TTL })
  }

  async getTips() {
    return this.request<{
      choix_sujet: string[]
      methodologie: string[]
      redaction: string[]
      soutenance: string[]
    }>('/ai/tips', {}, { cacheTTL: LONG_TTL })
  }

  async getAITips(category: 'choix' | 'methodologie' | 'redaction' | 'soutenance'): Promise<string[]> {
    return this.request<string[]>(`/ai/tips/${category}`, {}, { cacheTTL: LONG_TTL })
  }

  async getAIResources(type: 'templates' | 'guides' | 'examples'): Promise<any[]> {
    return this.request<any[]>(`/ai/resources/${type}`, {}, { cacheTTL: LONG_TTL })
  }

  // ========== IA PUBLIQUE ==========
  async askAIPublic(question: string, context?: string): Promise<AIResponse> {
    return this.request<AIResponse>('/ai/ask-public', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    }, { disableCache: true })
  }

  async analyzeSubjectPublic(data: {
    titre: string
    description: string
    domaine?: string
    niveau?: string
    faculté?: string
    problématique?: string
    keywords?: string
    context?: string
  }): Promise<AIAnalysisResponse> {
    return this.request<AIAnalysisResponse>('/ai/analyze-public', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  // ========== CHAT IA ==========
  async chatWithAI(data: { message: string; context?: string }): Promise<AIResponse> {
    return this.request<AIResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  // ========== USERS ==========
  async getUserProfile(userId: number): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>(`/users/${userId}/profile`, {}, { cacheTTL: 30_000 })
    } catch (error) {
      return {
        user_id: userId,
        bio: '',
        location: '',
        university: '',
        field: '',
        level: '',
        interests: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  }

  async getUserSkills(userId: number): Promise<UserSkill[]> {
    try {
      return await this.request<UserSkill[]>(`/users/${userId}/skills`, {}, { cacheTTL: 30_000 })
    } catch {
      return []
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    try {
      return await this.request<UserStats>(`/users/${userId}/stats`, {}, { cacheTTL: 30_000 })
    } catch {
      return {
        profile_completion: 0,
        explored_subjects: 0,
        recommendations_count: 0,
        active_days: 0,
        last_active: new Date().toISOString(),
      }
    }
  }

  async updateUserProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>(`/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, { disableCache: true })
    } catch {
      return {
        user_id: userId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserProfile
    }
  }

  async updateUserSkills(
    userId: number,
    skills: Array<{ name: string; level: number; category?: string }>,
  ): Promise<UserSkill[]> {
    return this.request<UserSkill[]>(`/users/${userId}/skills`, {
      method: 'PUT',
      body: JSON.stringify(skills),
    }, { disableCache: true })
  }

  // ========== FEEDBACK ==========
  async submitFeedback(data: {
    sujet_id: number
    rating?: number
    pertinence?: number
    commentaire?: string
    intéressé?: boolean
    sélectionné?: boolean
  }) {
    return this.request<Feedback>('/sujets/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { disableCache: true })
  }

  // ========== STATISTIQUES ==========
  async getPopularSujets(limit: number = 10) {
    return this.request<Sujet[]>(`/sujets/stats/popular?limit=${limit}`, {}, { cacheTTL: 10_000 })
  }

  async getPopularKeywords(limit: number = 20) {
    return this.request<PopularKeyword[]>(`/sujets/stats/keywords?limit=${limit}`, {}, { cacheTTL: LONG_TTL })
  }

  async getDomainsStats() {
    return this.request<StatsDomains[]>('/sujets/stats/domains', {}, { cacheTTL: LONG_TTL })
  }

  // ========== COMMUNITY ==========
  async getCommunitySujets(params?: {
    sort: 'recent' | 'popular' | 'trending'
    limit: number
    domaine?: string
  }): Promise<Sujet[]> {
    const query = new URLSearchParams()
    if (params?.sort) query.set('sort', params.sort)
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.domaine) query.set('domaine', params.domaine)

    return this.request<Sujet[]>(`/community/sujets?${query.toString()}`, {}, { cacheTTL: 10_000 })
  }

  async shareSujet(sujetId: number): Promise<{ success: boolean; share_url: string }> {
    return this.request(`/community/share/${sujetId}`, {
      method: 'POST',
    }, { disableCache: true })
  }

  // ========== NOTIFICATIONS ==========
  async getNotifications(): Promise<any[]> {
    return this.request('/users/me/notifications', {}, { cacheTTL: 10_000 })
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    return this.request(`/users/me/notifications/${notificationId}/read`, {
      method: 'POST',
    }, { disableCache: true })
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request('/users/me/notifications/unread-count', {}, { cacheTTL: 5_000 })
  }

  // ========== SETTINGS ==========
  async getSettings(): Promise<any> {
    return this.request('/settings', {}, { cacheTTL: LONG_TTL })
  }

  async getPreferences(): Promise<any> {
    try {
      return await this.request('/settings/preferences', {}, { cacheTTL: LONG_TTL })
    } catch {
      return {
        theme: 'system',
        language: 'fr',
        notifications: {
          email: true,
          push: true,
          newsletter: false,
          recommendations: true,
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showActivity: true,
        },
      }
    }
  }

  async updatePreferences(preferences: any): Promise<any> {
    return this.request('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }, { disableCache: true })
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return this.request('/settings/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    }, { disableCache: true })
  }

  // ========== UTILITAIRES AVANCÉS ==========
  async searchAdvanced(params: {
    query: string
    domaines?: string[]
    niveaux?: string[]
    difficultes?: string[]
    faculties?: string[]
    sort?: 'relevance' | 'views' | 'likes' | 'recent'
    limit?: number
  }): Promise<{
    results: Sujet[]
    suggestions: string[]
    filters: any
  }> {
    return this.request('/sujets/search/advanced', {
      method: 'POST',
      body: JSON.stringify(params),
    }, { disableCache: true })
  }

  async getAutoComplete(query: string): Promise<string[]> {
    return this.request<string[]>(`/sujets/autocomplete?query=${encodeURIComponent(query)}`, {}, { cacheTTL: 5_000 })
  }

  async getRelatedSujets(sujetId: number): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/${sujetId}/related`, {}, { cacheTTL: 10_000 })
  }

  // ========== BACKEND HEALTH & INFO ==========
  async getSystemInfo(): Promise<{
    version: string
    environment: string
    database: {
      connected: boolean
      tables: number
    }
    ai: {
      available: boolean
      model: string
    }
    users: {
      total: number
      active: number
    }
  }> {
    return this.request('/system/info', {}, { cacheTTL: LONG_TTL })
  }

  async clearCache(): Promise<{ success: boolean }> {
    memoryCache.clear()
    return this.request('/system/clear-cache', {
      method: 'POST',
    }, { disableCache: true })
  }

  // ========== EXPORT & IMPORT ==========
  async exportUserData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const response = await fetch(`${API_BASE_URL}/users/me/export?format=${format}`, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    })

    if (!response.ok) throw new Error("Erreur lors de l'export")
    return await response.blob()
  }

  async importUserData(file: File): Promise<{ success: boolean; imported: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const response = await fetch(`${API_BASE_URL}/users/me/import`, {
      method: 'POST',
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
      body: formData,
    })

    if (!response.ok) throw new Error("Erreur lors de l'import")
    return await response.json()
  }

  // ========== UTILITAIRES ==========
  async healthCheck() {
    return this.request<HealthCheck>('/health', {}, { cacheTTL: 5_000 })
  }

  async getConfig() {
    return this.request<Config>('/config', {}, { cacheTTL: LONG_TTL })
  }
}

// ========== EXPORT ==========
export const api = new ApiService()

// Fonction utilitaire pour tester la connexion (dev seulement)
export async function testBackendConnection() {
  try {
    const health = await fetch(`${API_BASE_URL}/health`)
    await health.json().catch(() => null)
    return true
  } catch {
    return false
  }
}
