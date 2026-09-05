import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type LeadStatus = 'new' | 'contacted' | 'converted';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  converted_at: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

export interface EmailNotification {
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

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin';
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  leads: Lead[];
  lead_notes: LeadNote[];
  email_notifications?: EmailNotification[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'crm_store.json');
const JWT_SECRET = process.env.JWT_SECRET || 'northlight-crm-secure-key-2026';

// Password hashing helpers
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, hash] = combined.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

// Token helper (HMAC SHA-256 JWT)
export function signJWT(payload: object, expiresInSeconds = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${encode(header)}.${encode(fullPayload)}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(unsignedToken).digest('base64url');
  return `${unsignedToken}.${signature}`;
}

export function verifyJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Database Engine
class Database {
  private data: DatabaseSchema = {
    users: [],
    leads: [],
    lead_notes: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // Ignore if directory creation fails in restricted environment
    }

    let loaded = false;

    // Check primary writable location (e.g. /tmp/crm_store.json on Vercel or data/crm_store.json locally)
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        loaded = true;
      } catch (err) {
        console.error('Failed to parse crm_store.json from DB_FILE...', err);
      }
    }

    // Check bundled seed file if DB_FILE was not present (e.g. first cold start in Vercel)
    if (!loaded && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        loaded = true;
      } catch (err) {
        console.error('Failed to parse crm_store.json from BUNDLED_DB_FILE...', err);
      }
    }

    if (loaded) {
      if (!this.data.email_notifications) {
        this.data.email_notifications = [];
      }
      // Ensure admin user credentials match configured admin (manu@gmail.com / manu@123)
      let admin = this.data.users.find((u) => u.role === 'admin');
      if (admin) {
        admin.email = 'manu@gmail.com';
        admin.password_hash = hashPassword('manu@123');
        admin.name = 'Manasa';
      } else {
        admin = {
          id: 'usr_admin_01',
          name: 'Manasa',
          email: 'manu@gmail.com',
          password_hash: hashPassword('manu@123'),
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        this.data.users.push(admin);
      }
      this.persist();
    } else {
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.warn('Database persistence to disk skipped (in-memory preserved):', err);
    }
  }

  private seedInitialData() {
    const now = Date.now();
    const oneDay = 86400000;

    const adminUser: User = {
      id: 'usr_admin_01',
      name: 'Manasa',
      email: 'manu@gmail.com',
      password_hash: hashPassword('manu@123'),
      role: 'admin',
      created_at: new Date(now - 45 * oneDay).toISOString(),
    };

    const initialLeads: Lead[] = [
      {
        id: 'lead_01',
        name: 'Alexander Wright',
        email: 'awright@vertexdesign.co',
        phone: '+1 (415) 890-2134',
        company: 'Vertex Studio',
        message: 'We are redesigning our enterprise analytics suite and looking for an experienced product design and engineering partner for Q4.',
        source: 'website',
        status: 'converted',
        created_at: new Date(now - 19 * oneDay).toISOString(),
        updated_at: new Date(now - 4 * oneDay).toISOString(),
        converted_at: new Date(now - 4 * oneDay).toISOString(),
      },
      {
        id: 'lead_02',
        name: 'Elena Rostova',
        email: 'elena@luminahealth.io',
        phone: '+1 (650) 412-9901',
        company: 'Lumina Health',
        message: 'Looking for a clean brand identity system and a responsive marketing web experience ahead of our Series A announcement.',
        source: 'website',
        status: 'contacted',
        created_at: new Date(now - 8 * oneDay).toISOString(),
        updated_at: new Date(now - 2 * oneDay).toISOString(),
        converted_at: null,
      },
      {
        id: 'lead_03',
        name: 'Marcus Brody',
        email: 'marcus@brodymoore.com',
        phone: null,
        company: 'Brody & Moore',
        message: 'Interested in a bespoke corporate web presence and secure client communication portal for our legal practice.',
        source: 'website',
        status: 'new',
        created_at: new Date(now - 1 * oneDay + 3600000 * 2).toISOString(),
        updated_at: new Date(now - 1 * oneDay + 3600000 * 2).toISOString(),
        converted_at: null,
      },
      {
        id: 'lead_04',
        name: 'Clara Nguyen',
        email: 'c.nguyen@arcadia-sys.com',
        phone: '+1 (212) 555-0188',
        company: 'Arcadia Systems',
        message: 'Inquiring about front-end design systems architecture and React component audits for our internal teams.',
        source: 'website',
        status: 'contacted',
        created_at: new Date(now - 13 * oneDay).toISOString(),
        updated_at: new Date(now - 7 * oneDay).toISOString(),
        converted_at: null,
      },
      {
        id: 'lead_05',
        name: 'Daniel Vance',
        email: 'daniel@vancecapital.org',
        phone: '+1 (312) 770-4321',
        company: 'Vance Capital',
        message: 'We require an understated, high-contrast investor deck and microsite for our third flagship venture fund.',
        source: 'website',
        status: 'converted',
        created_at: new Date(now - 26 * oneDay).toISOString(),
        updated_at: new Date(now - 12 * oneDay).toISOString(),
        converted_at: new Date(now - 12 * oneDay).toISOString(),
      },
      {
        id: 'lead_06',
        name: 'Sophia Keller',
        email: 'sophia.keller@ateliernord.de',
        phone: null,
        company: 'Atelier Nord',
        message: 'We are seeking an ongoing engineering partner to collaborate with our Munich studio on complex web apps.',
        source: 'website',
        status: 'new',
        created_at: new Date(now - 3600000 * 4).toISOString(),
        updated_at: new Date(now - 3600000 * 4).toISOString(),
        converted_at: null,
      },
    ];

    const initialNotes: LeadNote[] = [
      {
        id: 'note_01',
        lead_id: 'lead_01',
        content: 'Reviewed inquiry and verified Vertex Studio portfolio. Matches our target client profile.',
        created_at: new Date(now - 18 * oneDay).toISOString(),
      },
      {
        id: 'note_02',
        lead_id: 'lead_01',
        content: 'Completed 45-minute discovery call. Scope defined as design system + 14 dashboard screens. Budget agreed at $38,000.',
        created_at: new Date(now - 12 * oneDay).toISOString(),
      },
      {
        id: 'note_03',
        lead_id: 'lead_01',
        content: 'Statement of work signed and initial deposit received. Project kick-off scheduled.',
        created_at: new Date(now - 4 * oneDay).toISOString(),
      },
      {
        id: 'note_04',
        lead_id: 'lead_02',
        content: 'Sent capabilities deck and case studies on healthcare product work.',
        created_at: new Date(now - 7 * oneDay).toISOString(),
      },
      {
        id: 'note_05',
        lead_id: 'lead_02',
        content: 'Follow-up call booked for Thursday 10:00 AM PST with founders.',
        created_at: new Date(now - 2 * oneDay).toISOString(),
      },
      {
        id: 'note_06',
        lead_id: 'lead_04',
        content: 'Sent pricing guidelines for design system consultation sprints.',
        created_at: new Date(now - 7 * oneDay).toISOString(),
      },
      {
        id: 'note_07',
        lead_id: 'lead_05',
        content: 'Discovery session held with managing partner. Outlined microsite architecture.',
        created_at: new Date(now - 20 * oneDay).toISOString(),
      },
      {
        id: 'note_08',
        lead_id: 'lead_05',
        content: 'Contract executed. Delivery date targeted for end of month.',
        created_at: new Date(now - 12 * oneDay).toISOString(),
      },
    ];

    this.data = {
      users: [adminUser],
      leads: initialLeads,
      lead_notes: initialNotes,
    };
    this.persist();
  }

  // Users
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getAdminUser(): User | undefined {
    return this.data.users.find((u) => u.role === 'admin');
  }

  getAdminEmail(): string {
    if (process.env.ADMIN_NOTIFICATION_EMAIL && process.env.ADMIN_NOTIFICATION_EMAIL.trim()) {
      return process.env.ADMIN_NOTIFICATION_EMAIL.trim();
    }
    const admin = this.getAdminUser();
    return admin?.email || 'manu@gmail.com';
  }

  // Leads
  getAllLeads(
    optionsOrSearch?:
      | string
      | {
          search?: string;
          statuses?: string[] | string;
          sortBy?: 'date' | 'name';
          sortOrder?: 'asc' | 'desc';
        },
    legacyStatusFilter?: string
  ): (Lead & { notes_count: number })[] {
    let search = '';
    let statusFilterList: string[] = [];
    let sortBy: 'date' | 'name' = 'date';
    let sortOrder: 'asc' | 'desc' = 'desc';

    if (typeof optionsOrSearch === 'string' || legacyStatusFilter !== undefined) {
      search = typeof optionsOrSearch === 'string' ? optionsOrSearch : '';
      if (legacyStatusFilter && legacyStatusFilter !== 'all') {
        statusFilterList = [legacyStatusFilter];
      }
    } else if (optionsOrSearch && typeof optionsOrSearch === 'object') {
      search = optionsOrSearch.search || '';
      if (optionsOrSearch.statuses) {
        if (Array.isArray(optionsOrSearch.statuses)) {
          statusFilterList = optionsOrSearch.statuses;
        } else if (typeof optionsOrSearch.statuses === 'string') {
          statusFilterList = optionsOrSearch.statuses
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      if (optionsOrSearch.sortBy) {
        sortBy = optionsOrSearch.sortBy;
      }
      if (optionsOrSearch.sortOrder) {
        sortOrder = optionsOrSearch.sortOrder;
      }
    }

    let filtered = [...this.data.leads];

    // Status filter: filter if list is non-empty and does not simply specify 'all'
    const activeStatuses = statusFilterList.filter((s) => s.toLowerCase() !== 'all');
    if (activeStatuses.length > 0) {
      filtered = filtered.filter((l) => activeStatuses.includes(l.status));
    }

    // Text search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        const nameMatch = l.name.toLowerCase().includes(q);
        const emailMatch = l.email.toLowerCase().includes(q);
        const companyMatch = (l.company || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || companyMatch;
      });
    }

    // Sorting: 'date received' (newest/oldest) or 'name' (A-Z / Z-A)
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const comp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        return sortOrder === 'desc' ? -comp : comp;
      }

      // Default: date received
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return filtered.map((lead) => {
      const notesCount = this.data.lead_notes.filter((n) => n.lead_id === lead.id).length;
      return {
        ...lead,
        notes_count: notesCount,
      };
    });
  }

  // Email Notifications
  logEmailNotification(data: Omit<EmailNotification, 'id' | 'created_at'>): EmailNotification {
    if (!this.data.email_notifications) {
      this.data.email_notifications = [];
    }
    const notification: EmailNotification = {
      id: `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.data.email_notifications.unshift(notification);
    this.persist();
    return notification;
  }

  getEmailNotifications(): EmailNotification[] {
    return this.data.email_notifications || [];
  }

  getLeadById(id: string): { lead: Lead; notes: LeadNote[] } | null {
    const lead = this.data.leads.find((l) => l.id === id);
    if (!lead) return null;
    const notes = this.data.lead_notes
      .filter((n) => n.lead_id === id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { lead, notes };
  }

  createLead(data: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    message: string;
    source?: string;
  }): Lead {
    const now = new Date().toISOString();
    const newLead: Lead = {
      id: `lead_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      message: data.message.trim(),
      source: data.source || 'website',
      status: 'new',
      created_at: now,
      updated_at: now,
      converted_at: null,
    };
    this.data.leads.unshift(newLead);
    this.persist();
    return newLead;
  }

  updateLeadStatus(id: string, newStatus: LeadStatus): Lead | null {
    const lead = this.data.leads.find((l) => l.id === id);
    if (!lead) return null;
    
    lead.status = newStatus;
    lead.updated_at = new Date().toISOString();
    if (newStatus === 'converted') {
      lead.converted_at = lead.updated_at;
    } else {
      lead.converted_at = null;
    }
    this.persist();
    return lead;
  }

  addLeadNote(leadId: string, content: string): LeadNote | null {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const now = new Date().toISOString();
    const note: LeadNote = {
      id: `note_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      lead_id: leadId,
      content: content.trim(),
      created_at: now,
    };

    this.data.lead_notes.push(note);
    lead.updated_at = now;
    this.persist();
    return note;
  }

  getAnalytics() {
    const totalLeads = this.data.leads.length;
    const convertedLeads = this.data.leads.filter((l) => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

    const oneWeekAgo = Date.now() - 7 * 86400000;
    const leadsThisWeek = this.data.leads.filter(
      (l) => new Date(l.created_at).getTime() >= oneWeekAgo
    ).length;

    const newCount = this.data.leads.filter((l) => l.status === 'new').length;
    const contactedCount = this.data.leads.filter((l) => l.status === 'contacted').length;

    const statusBreakdown = [
      {
        status: 'new' as LeadStatus,
        label: 'New',
        count: newCount,
        percentage: totalLeads > 0 ? Math.round((newCount / totalLeads) * 100) : 0,
        color: '#5B7897',
      },
      {
        status: 'contacted' as LeadStatus,
        label: 'Contacted',
        count: contactedCount,
        percentage: totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0,
        color: '#C98A2C',
      },
      {
        status: 'converted' as LeadStatus,
        label: 'Converted',
        count: convertedLeads,
        percentage: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        color: '#1F5D4C',
      },
    ];

    // Build trend for the last 14 days
    const trendMap = new Map<string, number>();
    const dayLabels: { date: string; label: string }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap.set(dateKey, 0);
      dayLabels.push({ date: dateKey, label });
    }

    for (const lead of this.data.leads) {
      const dateKey = lead.created_at.slice(0, 10);
      if (trendMap.has(dateKey)) {
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
      }
    }

    const trendData = dayLabels.map(({ date, label }) => ({
      date,
      label,
      count: trendMap.get(date) || 0,
    }));

    return {
      totalLeads,
      conversionRate,
      leadsThisWeek,
      statusBreakdown,
      trendData,
    };
  }
}

export const db = new Database();
