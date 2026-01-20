// src/lib/api.ts - VERSION COMPLÈTE ET FONCTIONNELLE
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ========== TYPES DÉFINIS EN PREMIER ==========

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'enseignant' | 'etudiant';
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id?: number;
  user_id: number;
  bio?: string;
  location?: string;
  university?: string;
  field?: string;
  level?: string;
  interests?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: number;
  user_id: number;
  name: string;
  level: number;
  category?: string;
  created_at: string;
}

export interface UserStats {
  profile_completion: number;
  explored_subjects: number;
  recommendations_count: number;
  active_days: number;
  last_active: string;
}

export interface SujetDetailResponse {
  sujet: Sujet
  analyse?: AIAnalysisResponse
}

export interface Sujet {
  id: number;
  titre: string;
  keywords: string;
  domaine: string;
  faculté: string;
  niveau: string;
  problématique: string;
  méthodologie?: string;
  technologies?: string;
  description: string;
  difficulté: 'facile' | 'moyenne' | 'difficile';
  durée_estimée?: string;
  ressources?: string;
  vue_count: number;
  like_count: number;
  is_active: boolean;
  created_at: string;
  user_id?: number;
}
export function checkAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (!token) {
      // Rediriger vers login
      window.location.href = '/login'
      throw new Error('Non authentifié')
    }
  }
}
export interface RecommendedSujet {
  sujet: Sujet;
  score: number;
  raisons: string[];
  critères_respectés: string[];
}

export interface AIResponse {
  question: string;
  message: string;
  suggestions: string[];
}

export interface GeneratedSubject {
  titre: string;
  problématique: string;
  keywords: string;
  description: string;
  methodologie: string;
  difficulté: string;
  durée_estimée: string;
}

export interface AIAnalysisResponse {
  pertinence: number;
  points_forts: string[];
  points_faibles: string[];
  suggestions: string[];
  recommandations: string[];
}

export interface AcceptanceCriteria {
  critères_acceptation: string[];
  critères_rejet: string[];
  conseils_pratiques: string[];
}

export interface UserPreference {
  id: number;
  user_id: number;
  interests?: string;
  faculty?: string;
  level?: string;
  created_at: string;
  updated_at?: string;
}

export interface Feedback {
  id: number;
  user_id: number;
  sujet_id: number;
  rating?: number;
  pertinence?: number;
  commentaire?: string;
  intéressé: boolean;
  sélectionné: boolean;
  created_at: string;
}
// Fonction utilitaire pour vérifier l'authentification
export function checkAuth(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('access_token');
  return !!token;
}

// Fonction pour rediriger vers login si non authentifié
export function redirectToLoginIfNotAuthenticated(returnPath?: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('access_token');
  if (!token) {
    const currentPath = returnPath || window.location.pathname;
    const returnUrl = encodeURIComponent(currentPath);
    
    // Utiliser router.replace si dans un composant React
    // Sinon utiliser window.location
    if (window.location.pathname !== '/login') {
      window.location.href = `/login?returnUrl=${returnUrl}`;
    }
    return false;
  }
  
  return true;
}

// Fonction pour vérifier l'authentification (sans redirection)
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('access_token');
  return !!token;
}

// Fonction pour déconnecter et rediriger
export function logoutAndRedirect(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_preferences');
    
    // Rediriger vers la page d'accueil ou de login
    window.location.href = '/login';
  }
}
export interface StatsDomains {
  domaine: string;
  count: number;
  avg_views: number;
}

export interface PopularKeyword {
  keyword: string;
  count: number;
}

export interface HealthCheck {
  status: string;
  service: string;
}

export interface Config {
  database_url: string;
  gemini_api_key: string;
  environment: string;
}

// ========== CLASSE API SERVICE ==========
class ApiService {
 
  private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log('🔄 API Request:', {
    url,
    endpoint,
    method: options.method || 'GET'
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('access_token');
    console.log('Token available:', !!token);
  }

  // Liste des endpoints publics
  const isPublicEndpoint = 
    endpoint.includes('/auth/login') || 
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/forgot-password') ||
    endpoint.includes('/auth/reset-password') ||
    endpoint.includes('/ai/ask-public') ||
    endpoint.includes('/ai/analyze-public') ||
    endpoint.includes('/health') ||
    endpoint === '/config';

  // IMPORTANT: NE PAS REDIRIGER DANS LA MÉTHODE REQUEST
  // Juste vérifier et ajouter le token si disponible
  
  if (token && !endpoint.includes('/auth/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log('📡 API Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Gestion des erreurs 401
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      console.log('Token expiré ou invalide (401)');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_preferences');
      }
      
      throw {
        status: 401,
        message: 'Session expirée. Veuillez vous reconnecter.',
        isUnauthorized: true
      };
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ API Error Details:', errorData);
      } catch {
        const errorText = await response.text();
        errorData = { detail: errorText || `HTTP ${response.status}: ${response.statusText}` };
      }

      const errorMessage = typeof errorData === 'object'
        ? (errorData.detail || errorData.message || JSON.stringify(errorData))
        : errorData;

      if (endpoint.includes('/auth/login')) {
        throw new Error(errorMessage || 'Email ou mot de passe incorrect');
      }

      throw new Error(errorMessage || `Erreur HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return true as T;
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
    
  } catch (error) {
    console.error('🔥 API Request failed:', error);
    throw error;
  }
}

  // ========== AUTH ==========
  async login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string }>('/auth/login-json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    full_name: string;
    password: string;
    role: 'admin' | 'enseignant' | 'etudiant';
  }) {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, new_password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  }

  // ========== SUJETS UTILISATEUR ==========
  async getUserSujets(): Promise<Sujet[]> {
    return this.request<Sujet[]>('/sujets/user-sujets');
  }

  async getUserFavoris(): Promise<Sujet[]> {
    return this.request<Sujet[]>('/sujets/favoris');
  }

  async getRecentSujets(limit: number = 20): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/explore/recent?limit=${limit}`);
  }

  async getRecommandesSujets(limit: number = 10): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/stats/popular?limit=${limit}`);
  }

  async createUserSujet(data: {
    titre: string;
    description: string;
    keywords: string;
    domaine: string;
    niveau: string;
    faculté: string;
    problématique: string;
    méthodologie?: string;
    technologies?: string;
    difficulté: 'facile' | 'moyenne' | 'difficile';
    durée_estimée?: string;
    ressources?: string;
  }): Promise<Sujet> {
    return this.request<Sujet>('/sujets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserSujet(sujetId: number, data: Partial<{
    titre: string;
    description: string;
    keywords: string;
    domaine: string;
    niveau: string;
    faculté: string;
    problématique: string;
    méthodologie?: string;
    technologies?: string;
    difficulté: 'facile' | 'moyenne' | 'difficile';
    durée_estimée?: string;
    ressources?: string;
    is_active: boolean;
  }>): Promise<Sujet> {
    return this.request<Sujet>(`/sujets/${sujetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUserSujet(sujetId: number): Promise<boolean> {
    return this.request<boolean>(`/sujets/${sujetId}`, {
      method: 'DELETE',
    });
  }

  async likeSujet(sujetId: number): Promise<{message: string, like_count: number}> {
    return this.request<{message: string, like_count: number}>(`/sujets/${sujetId}/like`, {
      method: 'POST',
    });
  }

  // ========== HISTORIQUE & ACTIVITÉ ==========
  async getUserHistory(): Promise<any[]> {
    return this.request<any[]>('/users/me/historique');
  }

  async getUserActivity(): Promise<{
    feedbacks: any[];
    sujets_created: any[];
    conversations: any[];
  }> {
    return this.request<any>('/users/me/activity');
  }

  async getConversationHistory(limit: number = 20): Promise<any[]> {
    return this.request<any[]>(`/ai/conversations?limit=${limit}`);
  }

  // ========== STATISTIQUES UTILISATEUR ==========
  async getUserDashboardStats(): Promise<{
    total_sujets: number;
    user_sujets: number;
    saved_sujets: number;
    recommendations_count: number;
    last_activity: string;
    popular_keywords: PopularKeyword[];
    domain_stats: StatsDomains[];
  }> {
    return this.request('/users/me/dashboard-stats');
  }

  async getUserProgress(): Promise<{
    profile_completion: number;
    subjects_explored: number;
    recommendations_made: number;
    days_active: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }> {
    return this.request('/users/me/progress');
  }

  // ========== RECOMMANDATIONS AVANCÉES ==========
  async getPersonalizedRecommendations(params?: {
    limit?: number;
    similarity?: 'keywords' | 'domaine' | 'faculty' | 'all';
  }): Promise<RecommendedSujet[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.similarity) query.set('similarity', params.similarity);
    
    return this.request<RecommendedSujet[]>(
      `/ai/recommendations/personalized?${query.toString()}`
    );
  }

  async getTrendingSujets(period: 'day' | 'week' | 'month' = 'week'): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/stats/trending?period=${period}`);
  }

  // ========== SUJETS GÉNÉRAUX ==========
  async getSujets(params?: {
    search?: string;
    domaine?: string;
    faculté?: string;
    niveau?: string;
    skip?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    
    const endpoint = query.toString() ? `/sujets?${query}` : '/sujets';
    return this.request<Sujet[]>(endpoint);
  }

  async getSujet(id: number): Promise<{sujet: Sujet, analyse?: AIAnalysisResponse}> {
    return this.request<{sujet: Sujet, analyse?: AIAnalysisResponse}>(`/sujets/${id}`);
  }

  async recommendSujets(data: {
  interests: string[];
  niveau?: string;
  faculté?: string;
  domaine?: string;
  difficulté?: 'facile' | 'moyenne' | 'difficile';
  limit?: number;
}) {
  // Vérification et formatage
  const interestsArray = Array.isArray(data.interests) 
    ? data.interests 
    : [data.interests].filter(Boolean);
  
  const normalizedData = {
    interests: interestsArray,
    niveau: data.niveau || undefined,
    faculté: data.faculté || undefined,
    domaine: data.domaine || undefined,
    difficulté: data.difficulté || undefined,
    limit: data.limit || 10
  };
  
  console.log('📤 Envoi recommandations:', normalizedData);
  
  return this.request<RecommendedSujet[]>('/sujets/recommend', {
    method: 'POST',
    body: JSON.stringify(normalizedData),
  });
}
  // ========== IA AVANCÉE ==========
  async askAI(question: string, context?: string) {
    return this.request<AIResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }

  async saveChosenSubject(data: {
    titre: string;
    description: string;
    keywords: string;
    domaine: string;
    niveau: string;
    faculté: string;
    problématique: string;
    méthodologie: string;
    difficulté: string;
    durée_estimée: string;
    interests?: string[];
  }): Promise<Sujet> {
    // Normaliser la difficulté avant envoi
    const normalizedData = {
      ...data,
      difficulté: data.difficulté.toLowerCase(),
      keywords: data.keywords || '',
      méthodologie: data.méthodologie || '',
      durée_estimée: data.durée_estimée || '6 mois'
    };

    return this.request<Sujet>('/ai/save-chosen-subject', {
      method: 'POST',
      body: JSON.stringify(normalizedData),
    });
  }

  async generateThreeSubjects(data: {
    interests: string[];
    domaine?: string;
    niveau?: string;
    faculté?: string;
  }): Promise<{ subjects: any[]; session_id: string }> {
    return this.request<{ subjects: any[]; session_id: string }>('/ai/generate-three', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateSubjects(data: {
    interests: string[];
    domaine?: string;
    niveau?: string;
    faculté?: string;
    count?: number;
  }): Promise<GeneratedSubject[]> {
    return this.request<GeneratedSubject[]>('/sujets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeSubject(data: {
    titre: string;
    description: string;
    domaine?: string;
    niveau?: string;
    faculté?: string;
    problématique?: string;
    keywords?: string;
    context?: string;
  }) {
    return this.request<AIAnalysisResponse>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeMultipleSubjects(subjects: {
    titre: string;
    description: string;
    domaine?: string;
  }[]): Promise<{
    analyses: AIAnalysisResponse[];
    comparison: {
      best_score: number;
      most_original: number;
      easiest: number;
      hardest: number;
    };
  }> {
    return this.request('/ai/analyze-multiple', {
      method: 'POST',
      body: JSON.stringify({ subjects }),
    });
  }

  async getAcceptanceCriteria() {
    return this.request<AcceptanceCriteria>('/ai/criteria');
  }

  async getTips() {
    return this.request<{
      choix_sujet: string[];
      methodologie: string[];
      redaction: string[];
      soutenance: string[];
    }>('/ai/tips');
  }

  async getAITips(category: 'choix' | 'methodologie' | 'redaction' | 'soutenance'): Promise<string[]> {
    return this.request<string[]>(`/ai/tips/${category}`);
  }

  async getAIResources(type: 'templates' | 'guides' | 'examples'): Promise<any[]> {
    return this.request<any[]>(`/ai/resources/${type}`);
  }

  // ========== IA PUBLIQUE (sans authentification) ==========
  async askAIPublic(question: string, context?: string): Promise<AIResponse> {
    return this.request<AIResponse>('/ai/ask-public', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }

  async analyzeSubjectPublic(data: {
    titre: string;
    description: string;
    domaine?: string;
    niveau?: string;
    faculté?: string;
    problématique?: string;
    keywords?: string;
    context?: string;
  }): Promise<AIAnalysisResponse> {
    return this.request<AIAnalysisResponse>('/ai/analyze-public', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========== CHAT IA (conversationnel) ==========
  async chatWithAI(data: {
    message: string
    context?: string
  }): Promise<AIResponse> {
    return this.request<AIResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ========== USERS ==========
  async getUserProfile(userId: number): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>(`/users/${userId}/profile`);
    } catch (error) {
      console.log('Using mock profile data');
      return {
        user_id: userId,
        bio: '',
        location: '',
        university: '',
        field: '',
        level: '',
        interests: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async getUserSkills(userId: number): Promise<UserSkill[]> {
    try {
      return await this.request<UserSkill[]>(`/users/${userId}/skills`);
    } catch (error) {
      console.log('Using mock skills data');
      return [];
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    try {
      return await this.request<UserStats>(`/users/${userId}/stats`);
    } catch (error) {
      console.log('Using mock stats data');
      return {
        profile_completion: 0,
        explored_subjects: 0,
        recommendations_count: 0,
        active_days: 0,
        last_active: new Date().toISOString()
      };
    }
  }

  async updateUserProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>(`/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log('Mock update profile');
      return {
        user_id: userId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile;
    }
  }

  async updateUserSkills(userId: number, skills: Array<{ name: string; level: number; category?: string }>): Promise<UserSkill[]> {
    return this.request<UserSkill[]>(`/users/${userId}/skills`, {
      method: 'PUT',
      body: JSON.stringify(skills),
    });
  }

  // ========== FEEDBACK ==========
  async submitFeedback(data: {
    sujet_id: number;
    rating?: number;
    pertinence?: number;
    commentaire?: string;
    intéressé?: boolean;
    sélectionné?: boolean;
  }) {
    return this.request<Feedback>('/sujets/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========== STATISTIQUES ==========
  async getPopularSujets(limit: number = 10) {
    return this.request<Sujet[]>(`/sujets/stats/popular?limit=${limit}`);
  }

  async getPopularKeywords(limit: number = 20) {
    return this.request<PopularKeyword[]>(
      `/sujets/stats/keywords?limit=${limit}`
    );
  }

  async getDomainsStats() {
    return this.request<StatsDomains[]>(
      '/sujets/stats/domains'
    );
  }

  // ========== COMMUNITY ==========
  async getCommunitySujets(params?: {
    sort: 'recent' | 'popular' | 'trending';
    limit: number;
    domaine?: string;
  }): Promise<Sujet[]> {
    const query = new URLSearchParams();
    if (params?.sort) query.set('sort', params.sort);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.domaine) query.set('domaine', params.domaine);
    
    return this.request<Sujet[]>(`/community/sujets?${query.toString()}`);
  }

  async shareSujet(sujetId: number): Promise<{ success: boolean; share_url: string }> {
    return this.request(`/community/share/${sujetId}`, {
      method: 'POST',
    });
  }

  // ========== NOTIFICATIONS ==========
  async getNotifications(): Promise<any[]> {
    return this.request('/users/me/notifications');
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    return this.request(`/users/me/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request('/users/me/notifications/unread-count');
  }

  // ========== SETTINGS ==========
  async getSettings(): Promise<any> {
    return this.request('/settings');
  }

  async getPreferences(): Promise<any> {
    try {
      return await this.request('/settings/preferences');
    } catch (error) {
      console.log('Using default preferences');
      return {
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
      };
    }
  }

  async updatePreferences(preferences: any): Promise<any> {
    return this.request('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return this.request('/settings/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      }),
    });
  }

  // ========== UTILITAIRES AVANCÉS ==========
  async searchAdvanced(params: {
    query: string;
    domaines?: string[];
    niveaux?: string[];
    difficultes?: string[];
    faculties?: string[];
    sort?: 'relevance' | 'views' | 'likes' | 'recent';
    limit?: number;
  }): Promise<{
    results: Sujet[];
    suggestions: string[];
    filters: any;
  }> {
    return this.request('/sujets/search/advanced', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getAutoComplete(query: string): Promise<string[]> {
    return this.request<string[]>(`/sujets/autocomplete?query=${encodeURIComponent(query)}`);
  }

  async getRelatedSujets(sujetId: number): Promise<Sujet[]> {
    return this.request<Sujet[]>(`/sujets/${sujetId}/related`);
  }

  // ========== BACKEND HEALTH & INFO ==========
  async getSystemInfo(): Promise<{
    version: string;
    environment: string;
    database: {
      connected: boolean;
      tables: number;
    };
    ai: {
      available: boolean;
      model: string;
    };
    users: {
      total: number;
      active: number;
    };
  }> {
    return this.request('/system/info');
  }

  async clearCache(): Promise<{ success: boolean }> {
    return this.request('/system/clear-cache', {
      method: 'POST',
    });
  }

  // ========== EXPORT & IMPORT ==========
  async exportUserData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/users/me/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'export');
    return await response.blob();
  }

  async importUserData(file: File): Promise<{ success: boolean; imported: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/users/me/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'import');
    return await response.json();
  }

  // ========== UTILITAIRES ==========
  async healthCheck() {
    return this.request<HealthCheck>('/health');
  }

  async getConfig() {
    return this.request<Config>('/config');
  }
}

// ========== EXPORT ==========
export const api = new ApiService();

// Fonction utilitaire pour tester la connexion
export async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    const health = await fetch(`${API_BASE_URL}/health`);
    console.log('Backend health:', await health.json());
    return true;
  } catch (error) {
    console.error('Backend not reachable:', error);
    return false;
  }
}