import express, { Request, Response, NextFunction } from 'express';
import { db, verifyPassword, signJWT, verifyJWT, LeadStatus } from './db.ts';
import { sendNewLeadAdminNotification } from './email.ts';

// In-memory rate limiting for lead submission
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function cleanRateLimits() {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}

function rateLimitLeadSubmission(req: Request, res: Response, next: NextFunction): void {
  // Clean up expired entries if map gets large (no persistent setInterval needed in serverless)
  if (ipRateLimits.size > 200) {
    cleanRateLimits();
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxSubmissions = 6;

  const current = ipRateLimits.get(ip);
  if (!current || now > current.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (current.count >= maxSubmissions) {
    res.status(429).json({
      error: 'Too many submissions received from this network. Please wait a few minutes before submitting again.',
    });
    return;
  }

  current.count += 1;
  next();
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyJWT(token);
  if (!payload || !payload.sub) {
    res.status(401).json({ error: 'Invalid or expired authentication session.' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  next();
}

const app = express();
app.use(express.json());

// Normalize URL in case Vercel rewrote /api/(.*) or forwarded with query params
app.use((req: Request, _res: Response, next: NextFunction) => {
  const queryPath = (req.query?.path as string) || '';
  const matchedPath = (req.headers['x-matched-path'] as string) || '';

  // If request is directed to /api with a subpath query or matched-path
  if (req.url === '/api' || req.url.startsWith('/api?') || req.url === '/api/') {
    if (queryPath) {
      req.url = queryPath.startsWith('/') ? `/api${queryPath}` : `/api/${queryPath}`;
    } else if (matchedPath && matchedPath.startsWith('/api/')) {
      req.url = matchedPath;
    }
  }
  next();
});

// API Router
const router = express.Router();

// Health endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Northlight CRM' });
});

// 1. PUBLIC LEAD CAPTURE
router.post('/leads', rateLimitLeadSubmission, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, company, message, _gotcha } = req.body || {};

    // Honeypot spam check
    if (_gotcha && String(_gotcha).trim() !== '') {
      console.warn('Spam honeypot triggered on lead form submission.');
      // Return 200 to not alert spam bot, but discard entry
      res.status(200).json({ success: true, message: 'Inquiry received.' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ error: 'Please enter a message describing your project (at least 5 characters).' });
      return;
    }

    const newLead = db.createLead({
      name,
      email,
      phone: phone ? String(phone) : null,
      company: company ? String(company) : null,
      message,
      source: 'website',
    });

    // Compute base URL for the admin detail link in the notification email
    const origin = (req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const baseUrl = (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') ? process.env.APP_URL : origin;

    // Send email notification to admin's registered email address safely
    let emailResult = {
      success: true,
      recipient: db.getAdminEmail(),
      sentVia: 'Dev Email Dispatcher',
    };
    try {
      emailResult = await sendNewLeadAdminNotification(newLead, baseUrl);
    } catch (emailErr) {
      console.warn('Email dispatch warning (non-fatal, lead was saved):', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully.',
      lead: {
        id: newLead.id,
        name: newLead.name,
        email: newLead.email,
      },
      notification: {
        sentTo: emailResult.recipient,
        status: emailResult.success ? 'delivered' : 'logged',
        sentVia: emailResult.sentVia,
      },
    });
  } catch (err: any) {
    console.error('Unhandled lead submission error:', err);
    res.status(500).json({
      error: 'An internal error occurred while processing your inquiry. Please try again.',
      details: err?.message || String(err),
    });
  }
});

// 2. ADMIN AUTH
router.post('/auth/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// 3. ADMIN LEADS LIST (supports search, multi-status filters, and sorting by date or name)
router.get('/admin/leads', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const search = req.query.search as string | undefined;
  const statusParam = req.query.status;
  const statusesParam = req.query.statuses;
  let statuses: string[] = [];

  if (Array.isArray(statusParam)) {
    statuses = statusParam as string[];
  } else if (typeof statusParam === 'string') {
    statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (typeof statusesParam === 'string') {
    statuses = statusesParam.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const sortBy = (req.query.sortBy as 'date' | 'name') || 'date';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  const leads = db.getAllLeads({
    search,
    statuses,
    sortBy,
    sortOrder,
  });

  // Compute overall pipeline totals across all leads (independent of filters)
  const allLeads = db.getAllLeads({});
  const counts = {
    total: allLeads.length,
    new: allLeads.filter((l) => l.status === 'new').length,
    contacted: allLeads.filter((l) => l.status === 'contacted').length,
    converted: allLeads.filter((l) => l.status === 'converted').length,
  };

  res.json({ leads, counts });
});

// 4. ADMIN LEAD DETAIL
router.get('/admin/leads/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const leadDetail = db.getLeadById(req.params.id);
  if (!leadDetail) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }
  res.json(leadDetail);
});

// 5. UPDATE STATUS (stepper: new -> contacted -> converted)
router.patch('/admin/leads/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { status } = req.body;
  const allowedStatuses: LeadStatus[] = ['new', 'contacted', 'converted'];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be "new", "contacted", or "converted".' });
    return;
  }

  const currentLeadData = db.getLeadById(req.params.id);
  if (!currentLeadData) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }

  const previousStatus = currentLeadData.lead.status;
  const updatedLead = db.updateLeadStatus(req.params.id, status);

  if (previousStatus !== status) {
    const formatLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    db.addLeadNote(
      req.params.id,
      `Status updated from ${formatLabel(previousStatus)} to ${formatLabel(status)}.`
    );
  }

  res.json({ lead: updatedLead });
});

// 6. ADD NOTE TO LEAD
router.post('/admin/leads/:id/notes', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'Note content cannot be empty.' });
    return;
  }

  const note = db.addLeadNote(req.params.id, content.trim());
  if (!note) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }

  res.status(201).json({ note });
});

// 7. ANALYTICS
router.get('/admin/analytics', requireAuth, (_req: AuthenticatedRequest, res: Response): void => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});

// 8. ADMIN EMAIL NOTIFICATIONS LOG & SETTINGS
router.get('/admin/notifications', requireAuth, (_req: AuthenticatedRequest, res: Response): void => {
  const notifications = db.getEmailNotifications();
  const adminEmail = db.getAdminEmail();
  const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  res.json({
    adminEmail,
    isSmtpConfigured,
    smtpHost: process.env.SMTP_HOST || 'Internal Agent Transporter',
    notifications,
  });
});

// Test email notification trigger
router.post('/admin/notifications/test', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const origin = (req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const baseUrl = (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') ? process.env.APP_URL : origin;

  const testLead = {
    id: 'lead_test_sample',
    name: 'Eleanor Vance (Test Lead)',
    email: 'eleanor.vance@sample-venture.com',
    phone: '+1 (415) 555-0199',
    company: 'Sample Venture Partners',
    message: 'This is a test notification to verify that new inquiry alerts are properly dispatched to your registered admin email address.',
    source: 'test_trigger',
    status: 'new' as LeadStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    converted_at: null,
  };

  const result = await sendNewLeadAdminNotification(testLead, baseUrl);
  res.json({
    success: result.success,
    recipient: result.recipient,
    sentVia: result.sentVia,
    messageId: result.messageId,
    error: result.error,
  });
});

// Catch-all route for unhandled API endpoints
router.all('*', (req: Request, res: Response) => {
  const debugInfo = {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    headers: {
      host: req.headers.host,
      'x-matched-path': req.headers['x-matched-path'],
      'x-forwarded-url': req.headers['x-forwarded-url'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    },
  };
  console.warn('[CRM ROUTE DEBUG 404] Unmatched API request path:', JSON.stringify(debugInfo, null, 2));

  res.status(404).json({
    error: 'Not Found',
    message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    debug: debugInfo,
  });
});

// Mount the API router exclusively on '/api'
app.use('/api', router);

// Global error handling middleware for Express
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[CRM SERVER ERROR 500] Error on ${req.method} ${req.originalUrl || req.url}:`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred.',
    path: req.originalUrl || req.url,
    method: req.method,
  });
});

export default app;
