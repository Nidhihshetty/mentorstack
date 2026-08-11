// Admin API service - Completely separate from main auth-api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ADMIN_API_BASE_URL = `${API_BASE_URL}/api/admin`;

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin';
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AdminLoginResponse {
  message: string;
  token: string;
  admin: AdminUser;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  reputation: number;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  createdAt: string;
  _count: {
    questions: number;
    answers: number;
    articles: number;
    mentorConnections: number;
    menteeConnections: number;
    communityPosts: number;
  };
}

export interface Community {
  id: number;
  name: string;
  description: string;
  skills: string[];
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    posts: number;
  };
}

export interface Question {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  _count: {
    answers: number;
    bookmarks?: number;
    tags?: number;
  };
}

export interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  author: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  _count?: {
    bookmarks?: number;
    tags?: number;
  }
}

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  author: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  community: {
    id: number;
    name: string;
  };
}

export interface Tag {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
    articles: number;
    communityPosts: number;
  };
}

export interface MentorshipRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestMessage: string | null;
  createdAt: string;
  updatedAt: string;
  mentor: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    skills: string[];
    reputation: number;
    _count: {
      mentorConnections: number;
      questions: number;
      answers: number;
      articles: number;
    };
  };
  mentee: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    skills: string[];
    reputation: number;
    _count: {
      menteeConnections: number;
      questions: number;
      answers: number;
      articles: number;
    };
  };
}

export interface Connection {
  id: number;
  acceptedAt: string;
  updatedAt: string;
  mentor: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    skills: string[];
    reputation: number;
    _count: {
      mentorConnections: number;
      questions: number;
      answers: number;
      articles: number;
    };
  };
  mentee: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    skills: string[];
    reputation: number;
    _count: {
      menteeConnections: number;
      questions: number;
      answers: number;
      articles: number;
    };
  };
  conversation?: {
    id: number;
    createdAt: string;
    updatedAt: string;
    _count: {
      messages: number;
    };
  };
  metrics?: {
    messageCount: number;
    lastMessageDate: string | null;
    lastMessageSender: string | null;
    lastMessage: string | null;
    daysSinceConnection: number;
    messagesPerWeek: number;
    engagementLevel: 'high' | 'medium' | 'low';
  };
}

export interface MentorshipStats {
  requests: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    acceptanceRate: number;
  };
  connections: {
    total: number;
    active: number;
    avgMessagesPerConnection: number;
  };
  messages: {
    total: number;
  };
  topMentors: Array<{
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    reputation: number;
    _count: {
      mentorConnections: number;
    };
  }>;
}

export interface OverviewStats {
  users: {
    total: number;
    mentors: number;
    mentees: number;
    admins: number;
    recentUsers: number;
    growth: string;
  };
  content: {
    questions: number;
    answers: number;
    articles: number;
    communities: number;
    communityPosts: number;
    questionGrowth: string;
    articleGrowth: string;
  };
  mentorship: {
    connections: number;
    requests: number;
    pendingRequests: number;
    acceptedRequests: number;
  };
  engagement: {
    avgQuestionsPerUser: string;
    avgAnswersPerQuestion: string;
    answerRate: string;
  };
  topContributors: Array<{
    id: number;
    name: string;
    email: string;
    reputation: number;
    role: string;
    avatarUrl?: string | null;
    _count: {
      questions: number;
      answers: number;
      articles: number;
    };
  }>;
  recentActivity: {
    questions: Array<{
      id: number;
      title: string;
      createdAt: string;
      author: {
        id: number;
        name: string;
        role: string;
      };
      _count: {
        answers: number;
      };
    }>;
    articles: Array<{
      id: number;
      title: string;
      createdAt: string;
      upvotes: number;
      downvotes: number;
      author: {
        id: number;
        name: string;
        role: string;
      };
    }>;
  };
  activityChart: Array<{
    date: string;
    users: number;
    questions: number;
    answers: number;
    articles: number;
  }>;
}

class AdminAPI {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('adminAuthToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // ==================== Authentication ====================
  
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Admin login failed');
    }

    const result = await response.json();
    
    // Store admin token separately from regular auth token
    if (result.token) {
      localStorage.setItem('adminAuthToken', result.token);
    }

    return result;
  }

  async getCurrentAdmin(): Promise<{ admin: AdminUser }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get admin data');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${ADMIN_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminAuthToken');
    }
  }

  getToken(): string | null {
    if (!('window' in globalThis)) return null;
    try {
      return globalThis.localStorage.getItem('adminAuthToken');
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ==================== Dashboard Stats ====================
  
  async getStats(): Promise<OverviewStats> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard stats');
    }

    return response.json();
  }

  // ==================== Badges Management ====================

  async getBadges(): Promise<{ badges: Array<{ id: number; name: string; description: string; reputationThreshold: number; imageUrl?: string | null; isActive: boolean; createdAt: string; updatedAt: string; awardedCount?: number; }> }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch badges');
    }
    return response.json();
  }

  async createBadge(data: { name: string; description: string; reputationThreshold: number; imageUrl?: string | null; isActive?: boolean; }): Promise<{ message: string; badge: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create badge');
    }
    return response.json();
  }

  async updateBadge(id: number, data: { name?: string; description?: string; reputationThreshold?: number; imageUrl?: string | null; isActive?: boolean; }): Promise<{ message: string; badge: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update badge');
    }
    return response.json();
  }

  async toggleBadgeActive(id: number): Promise<{ message: string; badge: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle badge');
    }
    return response.json();
  }

  async awardBadge(id: number, userId: number): Promise<{ message: string; userBadge: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges/${id}/award`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to award badge');
    }
    return response.json();
  }

  async uploadBadgeIcon(file: File): Promise<{ imageUrl: string }> {
    const form = new FormData();
    form.append('image', file);
    // Manually construct headers to include auth but let browser set Content-Type boundary
    const headers: HeadersInit = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${ADMIN_API_BASE_URL}/badges/upload-icon`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload badge icon');
    }
    return response.json();
  }

  // ==================== Reputation Management ====================

  async getReputationHistory(userId: number, page = 1, limit = 20): Promise<{ user: any; page: number; limit: number; total: number; items: any[] }> {
    const params = new URLSearchParams({ userId: String(userId), page: String(page), limit: String(limit) });
    const response = await fetch(`${ADMIN_API_BASE_URL}/reputation/history?${params}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reputation history');
    }
    return response.json();
  }

  async adjustReputation(data: { userId: number; points: number; reason?: string; entityType?: string; entityId?: number; }): Promise<{ message: string; history: any; user: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/reputation/adjust`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to adjust reputation');
    }
    return response.json();
  }

  // ==================== User Management ====================
  
  async getUsers(page = 1, limit = 20, role?: string, search?: string): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (role) params.append('role', role);
    if (search) params.append('search', search);

    const response = await fetch(`${ADMIN_API_BASE_URL}/users?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  }

  async getUserDetails(userId: number): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user details');
    }

    return response.json();
  }

  async updateUser(userId: number, data: {
    name?: string;
    email?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    skills?: string[];
    location?: string;
  }): Promise<{ message: string; user: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  }

  async updateUserRole(userId: number, role: 'mentor' | 'mentee' | 'admin'): Promise<{ message: string; user: any }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user role');
    }

    return response.json();
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    return response.json();
  }

  async getUserStats(userId: number): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}/stats`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user stats');
    }

    return response.json();
  }

  // ==================== Community Management ====================
  
  async getCommunities(page = 1, limit = 20): Promise<{
    communities: Community[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${ADMIN_API_BASE_URL}/communities?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch communities');
    }

    return response.json();
  }

  async getCommunityDetails(communityId: number): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/communities/${communityId}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch community details');
    }

    return response.json();
  }

  async deleteCommunity(communityId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/communities/${communityId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete community');
    }

    return response.json();
  }

  async updateCommunity(communityId: number, data: { name?: string; description?: string; skills?: string[] }): Promise<{ message: string; community: Community }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/communities/${communityId}`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update community');
    }

    return response.json();
  }

  async deleteCommunityMember(communityId: number, memberId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/communities/${communityId}/members/${memberId}` , {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove community member');
    }

    return response.json();
  }

  // ==================== Content Management ====================
  
  async getQuestions(page = 1, limit = 20): Promise<{
    questions: Question[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${ADMIN_API_BASE_URL}/content/questions?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch questions');
    }

    return response.json();
  }

  async deleteQuestion(questionId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete question');
    }

    return response.json();
  }

  async getQuestionDetails(questionId: number): Promise<{
    id: number; title: string; body: string; createdAt: string; updatedAt: string;
    author: { id: number; name: string; email: string; role: string; avatarUrl?: string | null };
    tags?: Array<{ id: number; name: string }>;
    _count: { answers: number; bookmarks?: number; tags?: number };
    answers: Array<{ id: number; body: string; upvotes: number; downvotes: number; createdAt: string; author: { id: number; name: string; email: string; role: string; avatarUrl?: string | null } }>;
  }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/questions/${questionId}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch question details');
    }
    return response.json();
  }

  async updateQuestion(questionId: number, data: { title?: string; body?: string }): Promise<{ message: string; question: { id: number; title: string; body: string; updatedAt: string } }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/questions/${questionId}`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update question');
    }
    return response.json();
  }

  async deleteAnswer(answerId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/answers/${answerId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete answer');
    }
    return response.json();
  }

  async getArticles(page = 1, limit = 20): Promise<{
    articles: Article[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${ADMIN_API_BASE_URL}/content/articles?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch articles');
    }

    return response.json();
  }

  async deleteArticle(articleId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/articles/${articleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete article');
    }

    return response.json();
  }

  async getCommunityPosts(page = 1, limit = 20): Promise<{
    posts: CommunityPost[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${ADMIN_API_BASE_URL}/content/posts?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch posts');
    }

    return response.json();
  }

  async deletePost(postId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/content/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete post');
    }

    return response.json();
  }

  // ==================== Tags Management ====================

  async getTags(): Promise<{ tags: Tag[] }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/tags`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tags');
    }

    return response.json();
  }

  async getTagById(tagId: number): Promise<{ tag: Tag }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/tags/${tagId}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tag');
    }

    return response.json();
  }

  async createTag(data: { name: string; description?: string }): Promise<{ message: string; tag: Tag }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/tags`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tag');
    }

    return response.json();
  }

  async updateTag(tagId: number, data: { name?: string; description?: string }): Promise<{ message: string; tag: Tag }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/tags/${tagId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update tag');
    }

    return response.json();
  }

  async deleteTag(tagId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/tags/${tagId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete tag');
    }

    return response.json();
  }

  // ==================== Analytics ====================
  
  async getOverviewStats(): Promise<OverviewStats> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats/overview`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch overview stats');
    }

    const raw = await response.json();

    // Normalize backend shape to the OverviewStats interface expected by the dashboard
    const normalized: OverviewStats = {
      users: {
        total: raw?.users?.total ?? 0,
        mentors: raw?.users?.mentors ?? 0,
        mentees: raw?.users?.mentees ?? 0,
        admins: raw?.users?.admins ?? 0,
        recentUsers: raw?.users?.newThisWeek ?? raw?.users?.newThisMonth ?? 0,
        growth: typeof raw?.users?.growthRate === 'number' ? `${raw.users.growthRate}%` : '0%'
      },
      content: {
        questions: raw?.content?.questions?.total ?? raw?.content?.questions ?? 0,
        answers: raw?.content?.answers?.total ?? raw?.content?.answers ?? 0,
        articles: raw?.content?.articles?.total ?? raw?.content?.articles ?? 0,
        communities: raw?.communities?.total ?? raw?.content?.communities ?? 0,
        communityPosts: raw?.communities?.posts ?? raw?.content?.communityPosts ?? 0,
        questionGrowth: typeof raw?.content?.questions?.growthRate === 'number' ? `${raw.content.questions.growthRate}%` : (raw?.content?.questionGrowth ?? '0%'),
        articleGrowth: typeof raw?.content?.articles?.growthRate === 'number' ? `${raw.content.articles.growthRate}%` : (raw?.content?.articleGrowth ?? '0%')
      },
      mentorship: {
        connections: raw?.mentorship?.totalConnections ?? raw?.mentorship?.connections ?? 0,
        requests: raw?.mentorship?.totalRequests ?? raw?.mentorship?.requests ?? 0,
        pendingRequests: raw?.mentorship?.pending ?? raw?.mentorship?.pendingRequests ?? 0,
        acceptedRequests: raw?.mentorship?.accepted ?? raw?.mentorship?.acceptedRequests ?? 0,
      },
      engagement: {
        avgQuestionsPerUser: raw?.engagement?.avgQuestionsPerUser ?? 'N/A',
        avgAnswersPerQuestion: raw?.engagement?.avgAnswersPerQuestion ?? 'N/A',
        answerRate: raw?.engagement?.answerRate ?? 'N/A',
      },
      topContributors: raw?.topActiveUsers ?? [],
      recentActivity: {
        questions: [],
        articles: []
      },
      activityChart: (raw?.activityTrends ?? []).map((d: any) => ({
        date: d.date,
        users: d.users ?? 0,
        questions: d.questions ?? 0,
        answers: d.answers ?? 0,
        articles: d.articles ?? 0,
      }))
    };

    return normalized;
  }



  async getContentActivity(days = 30): Promise<any> {
    // Backend exposes content statistics under /stats/content
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats/content?days=${days}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch content activity');
    }

    return response.json();
  }

  async getTopUsers(limit = 10): Promise<{ topUsers: any[] }> {
    // The stats overview returns topActiveUsers — reuse it if no dedicated endpoint exists on backend
    const overview = await this.getOverviewStats();
    // Attempt to map backend shape to an object with topUsers
    if ((overview as any).topActiveUsers) {
      return { topUsers: (overview as any).topActiveUsers.slice(0, limit) };
    }
    return { topUsers: (overview as any).topActiveUsers || [] };
  }

  async getTopCommunities(limit = 10): Promise<{ communities: any[] }> {
    const overview = await this.getOverviewStats();
    if ((overview as any).topCommunities) {
      return { communities: (overview as any).topCommunities.slice(0, limit) };
    }
    return { communities: (overview as any).topCommunities || [] };
  }

  async getMentorshipStats(): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/mentorship-stats`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentorship stats');
    }

    return response.json();
  }

  // ==================== Mentorship Management ====================

  async getMentorshipRequests(status?: 'pending' | 'accepted' | 'rejected' | 'all'): Promise<{ requests: MentorshipRequest[] }> {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${ADMIN_API_BASE_URL}/mentorship/requests?${params}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentorship requests');
    }

    return response.json();
  }

  async getMentorshipConnections(): Promise<{ connections: Connection[] }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/mentorship/connections`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentorship connections');
    }

    return response.json();
  }

  async getMentorshipOverview(): Promise<{ stats: MentorshipStats }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/mentorship/stats`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentorship overview stats');
    }

    return response.json();
  }

  async deleteMentorshipRequest(requestId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/mentorship/requests/${requestId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete mentorship request');
    }

    return response.json();
  }

  async deleteMentorshipConnection(connectionId: number): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/mentorship/connections/${connectionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete mentorship connection');
    }

    return response.json();
  }

  // Advanced Analytics Endpoints
  async getUserGrowth(period: string = '7d'): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/user-growth?period=${period}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user growth data');
    }

    return response.json();
  }

  async getEngagementTrends(period: string = '7d'): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/engagement-trends?period=${period}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch engagement trends');
    }

    return response.json();
  }

  async getMentorshipAnalytics(): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/mentorship-analytics`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentorship analytics');
    }

    return response.json();
  }

  async getContentPerformance(): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/content-performance`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch content performance');
    }

    return response.json();
  }

  async getRecentActivity(limit: number = 20): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/recent-activity?limit=${limit}`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch recent activity');
    }

    return response.json();
  }

  async getOverview(): Promise<any> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats/overview`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch overview');
    }

    return response.json();
  }

  // Mentor Impact Board
  async getMentorImpact(limit = 20): Promise<{ mentors: Array<{
    mentorId: number; name: string; avatarUrl?: string | null; email: string; sessions: number; messagesSent: number; avgResponseMinutes: number | null; impactScore: number;
  }> }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats/mentors/impact?limit=${limit}`, {
      headers: this.getHeaders(true)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentor impact');
    }
    return response.json();
  }

  // Mentee Progress Radar
  async getMenteeProgress(limit = 50): Promise<{ mentees: Array<{
    menteeId: number; name: string; avatarUrl?: string | null; raw: any; normalized: { questionsAsked: number; articlesSaved: number; communityEngagement: number; chatActivity: number; mentorshipParticipation: number };
  }>; maxima: any; }> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/stats/mentees/progress?limit=${limit}`, {
      headers: this.getHeaders(true)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch mentee progress');
    }
    return response.json();
  }
}

export const adminAPI = new AdminAPI();
