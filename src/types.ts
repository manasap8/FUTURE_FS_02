export type LeadStatus = 'new' | 'contacted' | 'converted';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  source: string; // default "website"
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  converted_at: string | null;
  notes_count?: number;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  created_at: string;
}

export type SortField = 'date' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface EmailNotificationLog {
  id: string;
  lead_id: string;
  recipient: string;
  subject: string;
  lead_name: string;
  lead_email: string;
  lead_company: string | null;
  lead_message: string;
  lead_url: string;
  status: 'delivered' | 'sent';
  sent_via: string;
  created_at: string;
}

export interface AnalyticsData {
  totalLeads: number;
  conversionRate: number;
  leadsThisWeek: number;
  statusBreakdown: {
    status: LeadStatus;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  trendData: {
    date: string;
    label: string;
    count: number;
  }[];
}
