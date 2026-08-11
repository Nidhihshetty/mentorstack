// API service for authentication
const FALLBACK_DEPLOYED_BACKEND_URL = 'https://mentorstack-backend.onrender.com';
const isLocalFrontendHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BACKEND_URL = isLocalFrontendHost
  ? 'http://localhost:5000'
  : (process.env.NEXT_PUBLIC_API_URL || FALLBACK_DEPLOYED_BACKEND_URL);
const API_BASE_URL = `${BACKEND_URL}/api`;

export interface SignupData {
  email: string;
  password: string;
  role: 'mentor' | 'mentee';
  firstName: string;
  lastName: string;
  skills: string[];
  bio: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  avatarUrl?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface MenteeProfile {
  id: number;
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string | null;
  skills: string[];
  reputation: number;
  joinedDate: string;
  questions: Question[];
  communityPosts: Array<{
    id: number;
    title: string;
    content: string;
    communityId: number;
    communityName: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
  }>;
  answeredQuestions: Array<{
    id: number;
    questionId: number;
    questionTitle: string;
    content: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
  }>;
  articles: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
  }>;
  stats: {
    questionsAsked: number;
    bookmarksCount: number;
    mentorshipRequestsCount: number;
  };
}

export interface MentorProfile {
  id: number;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
  location: string | null;
  jobTitle: string | null;
  department: string | null;
  reputation: number;
  joinedDate: string;
  questions: Question[];
  answers: Array<{
    id: number;
    content: string;
    createdAt: string;
    question: {
      id: number;
      title: string;
      createdAt: string;
    };
  }>;
  articles: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
  }>;
  connections: Array<{
    id: number;
    acceptedAt: string;
    mentee: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  mentorshipRequests: Array<{
    id: number;
    status: string;
    requestMessage?: string;
    createdAt: string;
    mentee: {
      id: number;
      name: string;
    };
  }>;
  stats: {
    answersProvided: number;
    articlesWritten: number;
    menteesConnected: number;
    mentorshipRequests: number;
  };
}

export interface Mentor {
  id: number;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
  location: string | null;
  reputation: number;
  jobTitle: string | null;
  department: string | null;
  createdAt: string;
}

export interface Question {
  id: number;
  title: string;
  description?: string;
  tags: string[];
  createdAt: string;
  authorId?: number;
  authorName: string;
  answerCount?: number;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  questionId: number;
  content: string;
  authorId?: number;
  authorName: string;
  authorRole: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  voteScore: number;
  userVote?: 'upvote' | 'downvote' | null;
}

export interface Community {
  id: number;
  name: string;
  description: string;
  skills: string[];
  createdById: number; // matches schema field name
  createdBy?: number; // deprecated, for backwards compatibility
  createdAt: string;
  updatedAt: string;
  memberSkills?: string[]; // Real-time skills from members
  _count: {
    members: number;
    posts: number;
  };
}

export interface CommunityCategory {
  name: string;
  count: number;
  communities: string[];
}

export interface CommunityPost {
  id: number;
  communityId: number;
  authorId?: number; // for authorization checks
  userRole: string;
  userId: number;
  userName?: string;
  title: string;
  content: string;
  imageUrls: string[];
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  votes: CommunityPostVote[];
  userVote: 'upvote' | 'downvote' | null;
  tags?: string[]; // for editing tags
  _count: {
    votes: number;
  };
}

export interface CommunityPostVote {
  id: number;
  userRole: string;
  userId: number;
  postId: number;
  voteType: 'upvote' | 'downvote';
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: number;
  communityId: number;
  userRole: string;
  userId: number;
  joinedAt: string;
  updatedAt: string;
}

export interface UpdateProfileResponse {
  message: string;
  profile: {
    id: number;
    name: string;
    bio: string;
    skills: string[];
  };
}

export interface Article {
  id: number;
  title: string;
  content: string;
  imageUrls: string[];
  authorId?: number;
  authorName: string;
  authorBio?: string;
  authorAvatar?: string;
  upvotes: number;
  downvotes: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Tag {
  name: string;
  count: number;
  color: string;
}

export interface ReputationEntry {
  id: number;
  points: number;
  action: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  createdAt: string;
}

export interface ReputationHistoryResponse {
  entries: ReputationEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Award result shape mirroring backend response
export interface ReputationAwardResult {
  applied: boolean;
  appliedPoints: number;
  currentReputation: number;
  reason: string;
  capRemaining?: number;
}

class AuthAPI {
  private getHeaders(includeAuth = false, includeContentType = true): HeadersInit {
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Bookmarks API
  async getMyBookmarks(): Promise<{questions: Array<{questionId: number; title: string; createdAt: string}>; articles: Array<{articleId: number; title: string; createdAt: string}>; posts: Array<{postId: number; title: string; communityId: number; communityName?: string; createdAt: string}>;}> {
    const response = await fetch(`${API_BASE_URL}/bookmarks`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get bookmarks');
    }
    return response.json();
  }

  async addQuestionBookmark(questionId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/questions/${questionId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bookmark question');
    }
    return response.json();
  }

  async removeQuestionBookmark(questionId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove bookmark');
    }
    return response.json();
  }

  async addArticleBookmark(articleId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/articles/${articleId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bookmark article');
    }
    return response.json();
  }

  async removeArticleBookmark(articleId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/articles/${articleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove bookmark');
    }
    return response.json();
  }

  async addCommunityPostBookmark(postId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/community-posts/${postId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bookmark post');
    }
    return response.json();
  }

  async removeCommunityPostBookmark(postId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookmarks/community-posts/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove bookmark');
    }
    return response.json();
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const result = await response.json();
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('authToken', result.token);
    }

    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('authToken', result.token);
    }

    return result;
  }

  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request password reset');
    }

    return response.json();
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<UserResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem('authToken');
      }
      throw new Error(error.message || 'Failed to get user data');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token from localStorage, even if API call fails
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('authToken');
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Mentee profile methods
  async getMenteeProfile(): Promise<MenteeProfile> {
    const response = await fetch(`${API_BASE_URL}/mentees/profile/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mentee profile');
    }

    return response.json();
  }

  async updateMenteeProfile(data: { name: string; bio: string; skills: string[] }): Promise<UpdateProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/mentees/profile/me`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  // Mentor profile methods
  async getMentorProfile(): Promise<MentorProfile> {
    const response = await fetch(`${API_BASE_URL}/mentors/profile/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mentor profile');
    }

    return response.json();
  }

  async updateMentorProfile(data: { name: string; bio: string; skills: string[]; location?: string }): Promise<UpdateProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/mentors/profile/me`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  async getMentors(): Promise<Mentor[]> {
    const response = await fetch(`${API_BASE_URL}/mentors`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mentors');
    }

    return response.json();
  }

  // Mentor List methods (with request status)
  async getMentorsWithStatus(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/mentor-list/mentors`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mentors');
    }

    return response.json();
  }

  async getMentorshipRequestsByStatus(status: 'pending' | 'accepted' | 'rejected'): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/mentor-list/requests/${status}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get requests');
    }

    return response.json();
  }

  async sendMentorshipRequest(mentorId: string, message: string): Promise<{ message: string; request: any; reputation?: ReputationAwardResult }> {
    const response = await fetch(`${API_BASE_URL}/mentor-list/request`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ mentorId, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send request');
    }

    return response.json();
  }

  async cancelMentorshipRequest(mentorId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/mentor-list/request/${mentorId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel request');
    }

    return response.json();
  }

  async getMentorStats(mentorId: string): Promise<{
    answersProvided: number;
    articlesWritten: number;
    activeConnections: number;
    totalAcceptedRequests: number;
    reputation: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/mentor-list/mentor/${mentorId}/stats`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mentor stats');
    }

    return response.json();
  }

  // Reputation history
  async getReputationHistory(page = 1, limit = 50): Promise<ReputationHistoryResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/reputation/history?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch reputation history');
    }
    return response.json();
  }

  // ==================== Badge Methods ====================
  
  // Get all available badges with user's earned status
  async getAvailableBadges(): Promise<{
    currentReputation: number;
    badges: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl: string | null;
      category: string | null;
      reputationThreshold: number;
      isEarned: boolean;
      isEligible: boolean;
      awardedAt: Date | null;
      isDisplayed: boolean;
      progressPercent: number;
    }>;
    earnedCount: number;
    totalCount: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/badges/available`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch available badges');
    }
    return response.json();
  }

  // Get only user's earned badges
  async getEarnedBadges(): Promise<{
    badges: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl: string | null;
      category: string | null;
      reputationThreshold: number;
      awardedAt: Date;
      isDisplayed: boolean;
    }>;
    count: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/badges/earned`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch earned badges');
    }
    return response.json();
  }

  // Toggle badge display on profile
  async toggleBadgeDisplay(badgeId: number): Promise<{
    success: boolean;
    isDisplayed: boolean;
  }> {
    const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/toggle-display`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to toggle badge display');
    }
    return response.json();
  }

  // Check and award eligible badges to user
  async checkAndAwardBadges(): Promise<{
    newBadgesAwarded: number;
    badges: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl: string | null;
      reputationThreshold: number;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/badges/check-and-award`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to check and award badges');
    }
    return response.json();
  }

  // ==================== Mentee Request Methods (For Mentors) ====================
  
  // Get all mentorship requests for the current mentor
  async getAllMentorshipRequests(): Promise<{
    success: boolean;
    requests: Array<{
      id: string;
      menteeId: number;
      name: string;
      email: string;
      avatar?: string;
      jobTitle?: string;
      department?: string;
      bio?: string;
      skills: string[];
      status: 'Pending' | 'Accepted' | 'Rejected';
      fullMessage: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/mentee-request/requests`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch mentorship requests');
    }

    return response.json();
  }

  // Accept a mentorship request (creates connection and conversation)
  async acceptMentorshipRequest(requestId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      requestId: number;
      status: string;
      connectionId: number;
      conversationId: number;
      mentee: {
        id: number;
        name: string;
        email: string;
        avatarUrl?: string;
      };
      reputation?: ReputationAwardResult;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/mentee-request/accept/${requestId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to accept request');
    }

    return response.json();
  }

  // Reject a mentorship request
  async rejectMentorshipRequest(requestId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      requestId: number;
      status: string;
      mentee: {
        id: number;
        name: string;
        email: string;
        avatarUrl?: string;
      };
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/mentee-request/reject/${requestId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject request');
    }

    return response.json();
  }

  // Questions methods
  async getQuestions(): Promise<Question[]> {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get questions');
    }

    return response.json();
  }

  async getQuestion(questionId: number): Promise<Question> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get question');
    }

    return response.json();
  }

  async submitQuestion(title: string, body: string, tags: string[]): Promise<{ message: string; question: Question }> {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ title, body, tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit question');
    }

    return response.json();
  }

  // Note: Questions don't have voting system in current schema
  // async voteOnQuestion(questionId: number, voteType: 'upvote' | 'downvote'): Promise<{ message: string }> {
  //   // Not implemented - questions don't have voting in schema
  // }

  // Note: Answer voting has been disabled in the UI
  async voteOnAnswer(questionId: number, answerId: number, voteType: 'upvote' | 'downvote'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers/${answerId}/vote`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to vote on answer');
    }

    return response.json();
  }

  async submitAnswer(questionId: number, content: string): Promise<{ message: string; answer: Answer }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit answer');
    }

    return response.json();
  }

  async updateQuestion(questionId: number, data: { title: string; body: string; tags: string[] }): Promise<{ message: string; question: Question }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update question');
    }

    return response.json();
  }

  async deleteQuestion(questionId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete question');
    }

    return response.json();
  }

  async updateAnswer(questionId: number, answerId: number, content: string): Promise<{ message: string; answer: Answer }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers/${answerId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update answer');
    }

    return response.json();
  }

  async deleteAnswer(questionId: number, answerId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers/${answerId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete answer');
    }

    return response.json();
  }

  // Community methods
  async getCommunities(): Promise<Community[]> {
    const response = await fetch(`${API_BASE_URL}/communities?includeSkills=true`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get communities');
    }

    return response.json();
  }

  async getCommunityCategories(): Promise<CommunityCategory[]> {
    const response = await fetch(`${API_BASE_URL}/communities/categories`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get community categories');
    }

    return response.json();
  }

  async getCommunity(id: number): Promise<Community> {
    const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get community');
    }

    return response.json();
  }

  async createCommunity(data: { name: string; description: string; skills: string[] }): Promise<Community> {
    const response = await fetch(`${API_BASE_URL}/communities`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create community');
    }

    return response.json();
  }

  async updateCommunity(id: number, data: { name: string; description: string; skills: string[] }): Promise<Community> {
    const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update community');
    }

    return response.json();
  }

  async deleteCommunity(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete community');
    }

    return response.json();
  }

  async joinCommunity(communityId: number): Promise<{ message: string; member: CommunityMember }> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/join`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join community');
    }

    return response.json();
  }

  async leaveCommunity(communityId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/leave`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to leave community');
    }

    return response.json();
  }

  async checkCommunityMembership(communityId: number): Promise<{ isMember: boolean }> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/membership`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check membership');
    }

    return response.json();
  }

  async getCommunityPosts(communityId: number, page = 1, limit = 10): Promise<CommunityPost[]> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/posts?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get community posts');
    }

    return response.json();
  }

  async createCommunityPost(communityId: number, data: { title: string; content: string; imageUrls?: string[]; tags?: string[] } | FormData): Promise<CommunityPost> {
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/posts`, {
      method: 'POST',
      headers: this.getHeaders(true, !isFormData), // Don't include Content-Type for FormData
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    return response.json();
  }

  async updateCommunityPost(communityId: number, postId: number, data: { title: string; content: string; tags?: string[]; existingImageUrls?: string[] } | FormData): Promise<CommunityPost> {
    const isFormData = data instanceof FormData;
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/communities/${communityId}/posts/${postId}`, {
        method: 'PUT',
        headers: this.getHeaders(true, !isFormData), // Don't include Content-Type for FormData
        body: isFormData ? data : JSON.stringify(data),
      });
    } catch {
      throw new Error(`Unable to reach the server at ${API_BASE_URL}. Please try again in a moment.`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Failed to update post');
    }

    return response.json();
  }

  async deleteCommunityPost(communityId: number, postId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete post');
    }

    return response.json();
  }

  async voteOnCommunityPost(communityId: number, postId: number, voteType: 'upvote' | 'downvote'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/vote`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to vote on post');
    }

    return response.json();
  }

  async searchCommunities(query: string): Promise<Community[]> {
    const response = await fetch(`${API_BASE_URL}/communities/search/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search communities');
    }

    return response.json();
  }

  // Articles methods
  async getArticles(page = 1, limit = 10, category?: string): Promise<ArticlesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${API_BASE_URL}/articles?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get articles');
    }

    return response.json();
  }

  async getArticle(id: number): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get article');
    }

    return response.json();
  }

  async voteOnArticle(articleId: number, voteType: 'upvote' | 'downvote'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/vote`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to vote on article');
    }

    return response.json();
  }

  async getPopularTags(): Promise<Tag[]> {
    const response = await fetch(`${API_BASE_URL}/articles/tags/popular`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get popular tags');
    }

    return response.json();
  }

  async createArticle(formData: FormData): Promise<{ message: string; article: Article }> {
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create article');
    }

    return response.json();
  }

  async updateArticle(articleId: number, data: FormData | { title: string; content: string; tags?: string[]; existingImageUrls?: string[] }): Promise<{ message: string; article: Article }> {
    const isFormData = data instanceof FormData;
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
        method: 'PUT',
        headers: isFormData
          ? {
              'Authorization': `Bearer ${this.getToken()}`,
            }
          : this.getHeaders(true),
        body: isFormData ? data : JSON.stringify(data),
      });
    } catch {
      throw new Error(`Unable to reach the server at ${API_BASE_URL}. Please try again in a moment.`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update article');
    }

    return response.json();
  }

  async deleteArticle(articleId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete article');
    }

    return response.json();
  }

  // Tags methods
  async getTagContent(tagName: string): Promise<{
    tagName: string;
    stats: {
      totalArticles: number;
      totalQuestions: number;
      totalCommunities: number;
      totalContent: number;
    };
    articles: Article[];
    questions: Question[];
    communities: Array<{
      id: number;
      name: string;
      description: string;
      skills: string[];
      creatorName: string;
      memberCount: number;
      postCount: number;
      createdAt: string;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/tags/${encodeURIComponent(tagName)}/content`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tag content');
    }

    return response.json();
  }

  async getAllTags(): Promise<Array<{
    name: string;
    articleCount: number;
    questionCount: number;
    communityPostCount: number;
    totalCount: number;
    color: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/tags/all`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tags');
    }

    return response.json();
  }
}

export const authAPI = new AuthAPI();
