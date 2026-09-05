import { Lead, LeadNote, User, AnalyticsData, LeadStatus, SortField, SortOrder, EmailNotificationLog } from '../types.ts';

const TOKEN_KEY = 'northlight_crm_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Public
  submitLead: (payload: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
    _gotcha?: string;
  }) => {
    return request<{ success: boolean; message: string; lead?: { id: string; name: string; email: string } }>(
      '/api/leads',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Auth
  login: (email: string, password: string) => {
    return request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: () => {
    return request<{ user: User }>('/api/auth/me');
  },

  // Admin
  getLeads: (params?: {
    search?: string;
    status?: string;
    statuses?: string[];
    sortBy?: SortField;
    sortOrder?: SortOrder;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.statuses && params.statuses.length > 0) {
      searchParams.set('statuses', params.statuses.join(','));
    } else if (params?.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    const query = searchParams.toString();
    return request<{
      leads: Lead[];
      counts?: {
        total: number;
        new: number;
        contacted: number;
        converted: number;
      };
    }>(`/api/admin/leads${query ? `?${query}` : ''}`);
  },

  getLeadById: (id: string) => {
    return request<{ lead: Lead; notes: LeadNote[] }>(`/api/admin/leads/${id}`);
  },

  updateLeadStatus: (id: string, status: LeadStatus) => {
    return request<{ lead: Lead }>(`/api/admin/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  addLeadNote: (id: string, content: string) => {
    return request<{ note: LeadNote }>(`/api/admin/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  getAnalytics: () => {
    return request<AnalyticsData>('/api/admin/analytics');
  },

  getNotifications: () => {
    return request<{
      adminEmail: string;
      isSmtpConfigured: boolean;
      smtpHost: string;
      notifications: EmailNotificationLog[];
    }>('/api/admin/notifications');
  },

  sendTestNotification: () => {
    return request<{
      success: boolean;
      recipient: string;
      sentVia: string;
      messageId?: string;
      error?: string;
    }>('/api/admin/notifications/test', {
      method: 'POST',
    });
  },
};
