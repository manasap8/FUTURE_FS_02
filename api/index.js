// server/app.ts
import express from "express";

// server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var DATA_DIR = isServerless ? "/tmp" : path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "crm_store.json");
var BUNDLED_DB_FILE = path.join(process.cwd(), "data", "crm_store.json");
var JWT_SECRET = process.env.JWT_SECRET || "northlight-crm-secure-key-2026";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, combined) {
  try {
    const [salt, hash] = combined.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}
function signJWT(payload, expiresInSeconds = 86400 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1e3) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsignedToken = `${encode(header)}.${encode(fullPayload)}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}
function verifyJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
var Database = class {
  constructor() {
    this.data = {
      users: [],
      leads: [],
      lead_notes: []
    };
    this.init();
  }
  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
    }
    let loaded = false;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        loaded = true;
      } catch (err) {
        console.error("Failed to parse crm_store.json from DB_FILE...", err);
      }
    }
    if (!loaded && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        loaded = true;
      } catch (err) {
        console.error("Failed to parse crm_store.json from BUNDLED_DB_FILE...", err);
      }
    }
    if (loaded) {
      if (!this.data.email_notifications) {
        this.data.email_notifications = [];
      }
      let admin = this.data.users.find((u) => u.role === "admin");
      if (admin) {
        admin.email = "manu@gmail.com";
        admin.password_hash = hashPassword("manu@123");
        admin.name = "Manasa";
      } else {
        admin = {
          id: "usr_admin_01",
          name: "Manasa",
          email: "manu@gmail.com",
          password_hash: hashPassword("manu@123"),
          role: "admin",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.data.users.push(admin);
      }
      this.persist();
    } else {
      this.seedInitialData();
    }
  }
  persist() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.warn("Database persistence to disk skipped (in-memory preserved):", err);
    }
  }
  seedInitialData() {
    const now = Date.now();
    const oneDay = 864e5;
    const adminUser = {
      id: "usr_admin_01",
      name: "Manasa",
      email: "manu@gmail.com",
      password_hash: hashPassword("manu@123"),
      role: "admin",
      created_at: new Date(now - 45 * oneDay).toISOString()
    };
    const initialLeads = [
      {
        id: "lead_01",
        name: "Alexander Wright",
        email: "awright@vertexdesign.co",
        phone: "+1 (415) 890-2134",
        company: "Vertex Studio",
        message: "We are redesigning our enterprise analytics suite and looking for an experienced product design and engineering partner for Q4.",
        source: "website",
        status: "converted",
        created_at: new Date(now - 19 * oneDay).toISOString(),
        updated_at: new Date(now - 4 * oneDay).toISOString(),
        converted_at: new Date(now - 4 * oneDay).toISOString()
      },
      {
        id: "lead_02",
        name: "Elena Rostova",
        email: "elena@luminahealth.io",
        phone: "+1 (650) 412-9901",
        company: "Lumina Health",
        message: "Looking for a clean brand identity system and a responsive marketing web experience ahead of our Series A announcement.",
        source: "website",
        status: "contacted",
        created_at: new Date(now - 8 * oneDay).toISOString(),
        updated_at: new Date(now - 2 * oneDay).toISOString(),
        converted_at: null
      },
      {
        id: "lead_03",
        name: "Marcus Brody",
        email: "marcus@brodymoore.com",
        phone: null,
        company: "Brody & Moore",
        message: "Interested in a bespoke corporate web presence and secure client communication portal for our legal practice.",
        source: "website",
        status: "new",
        created_at: new Date(now - 1 * oneDay + 36e5 * 2).toISOString(),
        updated_at: new Date(now - 1 * oneDay + 36e5 * 2).toISOString(),
        converted_at: null
      },
      {
        id: "lead_04",
        name: "Clara Nguyen",
        email: "c.nguyen@arcadia-sys.com",
        phone: "+1 (212) 555-0188",
        company: "Arcadia Systems",
        message: "Inquiring about front-end design systems architecture and React component audits for our internal teams.",
        source: "website",
        status: "contacted",
        created_at: new Date(now - 13 * oneDay).toISOString(),
        updated_at: new Date(now - 7 * oneDay).toISOString(),
        converted_at: null
      },
      {
        id: "lead_05",
        name: "Daniel Vance",
        email: "daniel@vancecapital.org",
        phone: "+1 (312) 770-4321",
        company: "Vance Capital",
        message: "We require an understated, high-contrast investor deck and microsite for our third flagship venture fund.",
        source: "website",
        status: "converted",
        created_at: new Date(now - 26 * oneDay).toISOString(),
        updated_at: new Date(now - 12 * oneDay).toISOString(),
        converted_at: new Date(now - 12 * oneDay).toISOString()
      },
      {
        id: "lead_06",
        name: "Sophia Keller",
        email: "sophia.keller@ateliernord.de",
        phone: null,
        company: "Atelier Nord",
        message: "We are seeking an ongoing engineering partner to collaborate with our Munich studio on complex web apps.",
        source: "website",
        status: "new",
        created_at: new Date(now - 36e5 * 4).toISOString(),
        updated_at: new Date(now - 36e5 * 4).toISOString(),
        converted_at: null
      }
    ];
    const initialNotes = [
      {
        id: "note_01",
        lead_id: "lead_01",
        content: "Reviewed inquiry and verified Vertex Studio portfolio. Matches our target client profile.",
        created_at: new Date(now - 18 * oneDay).toISOString()
      },
      {
        id: "note_02",
        lead_id: "lead_01",
        content: "Completed 45-minute discovery call. Scope defined as design system + 14 dashboard screens. Budget agreed at $38,000.",
        created_at: new Date(now - 12 * oneDay).toISOString()
      },
      {
        id: "note_03",
        lead_id: "lead_01",
        content: "Statement of work signed and initial deposit received. Project kick-off scheduled.",
        created_at: new Date(now - 4 * oneDay).toISOString()
      },
      {
        id: "note_04",
        lead_id: "lead_02",
        content: "Sent capabilities deck and case studies on healthcare product work.",
        created_at: new Date(now - 7 * oneDay).toISOString()
      },
      {
        id: "note_05",
        lead_id: "lead_02",
        content: "Follow-up call booked for Thursday 10:00 AM PST with founders.",
        created_at: new Date(now - 2 * oneDay).toISOString()
      },
      {
        id: "note_06",
        lead_id: "lead_04",
        content: "Sent pricing guidelines for design system consultation sprints.",
        created_at: new Date(now - 7 * oneDay).toISOString()
      },
      {
        id: "note_07",
        lead_id: "lead_05",
        content: "Discovery session held with managing partner. Outlined microsite architecture.",
        created_at: new Date(now - 20 * oneDay).toISOString()
      },
      {
        id: "note_08",
        lead_id: "lead_05",
        content: "Contract executed. Delivery date targeted for end of month.",
        created_at: new Date(now - 12 * oneDay).toISOString()
      }
    ];
    this.data = {
      users: [adminUser],
      leads: initialLeads,
      lead_notes: initialNotes
    };
    this.persist();
  }
  // Users
  findUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }
  findUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  getAdminUser() {
    return this.data.users.find((u) => u.role === "admin");
  }
  getAdminEmail() {
    if (process.env.ADMIN_NOTIFICATION_EMAIL && process.env.ADMIN_NOTIFICATION_EMAIL.trim()) {
      return process.env.ADMIN_NOTIFICATION_EMAIL.trim();
    }
    const admin = this.getAdminUser();
    return admin?.email || "manu@gmail.com";
  }
  // Leads
  getAllLeads(optionsOrSearch, legacyStatusFilter) {
    let search = "";
    let statusFilterList = [];
    let sortBy = "date";
    let sortOrder = "desc";
    if (typeof optionsOrSearch === "string" || legacyStatusFilter !== void 0) {
      search = typeof optionsOrSearch === "string" ? optionsOrSearch : "";
      if (legacyStatusFilter && legacyStatusFilter !== "all") {
        statusFilterList = [legacyStatusFilter];
      }
    } else if (optionsOrSearch && typeof optionsOrSearch === "object") {
      search = optionsOrSearch.search || "";
      if (optionsOrSearch.statuses) {
        if (Array.isArray(optionsOrSearch.statuses)) {
          statusFilterList = optionsOrSearch.statuses;
        } else if (typeof optionsOrSearch.statuses === "string") {
          statusFilterList = optionsOrSearch.statuses.split(",").map((s) => s.trim()).filter(Boolean);
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
    const activeStatuses = statusFilterList.filter((s) => s.toLowerCase() !== "all");
    if (activeStatuses.length > 0) {
      filtered = filtered.filter((l) => activeStatuses.includes(l.status));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        const nameMatch = l.name.toLowerCase().includes(q);
        const emailMatch = l.email.toLowerCase().includes(q);
        const companyMatch = (l.company || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || companyMatch;
      });
    }
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        const comp = a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
        return sortOrder === "desc" ? -comp : comp;
      }
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
    return filtered.map((lead) => {
      const notesCount = this.data.lead_notes.filter((n) => n.lead_id === lead.id).length;
      return {
        ...lead,
        notes_count: notesCount
      };
    });
  }
  // Email Notifications
  logEmailNotification(data) {
    if (!this.data.email_notifications) {
      this.data.email_notifications = [];
    }
    const notification = {
      id: `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.email_notifications.unshift(notification);
    this.persist();
    return notification;
  }
  getEmailNotifications() {
    return this.data.email_notifications || [];
  }
  getLeadById(id) {
    const lead = this.data.leads.find((l) => l.id === id);
    if (!lead) return null;
    const notes = this.data.lead_notes.filter((n) => n.lead_id === id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { lead, notes };
  }
  createLead(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newLead = {
      id: `lead_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      message: data.message.trim(),
      source: data.source || "website",
      status: "new",
      created_at: now,
      updated_at: now,
      converted_at: null
    };
    this.data.leads.unshift(newLead);
    this.persist();
    return newLead;
  }
  updateLeadStatus(id, newStatus) {
    const lead = this.data.leads.find((l) => l.id === id);
    if (!lead) return null;
    lead.status = newStatus;
    lead.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    if (newStatus === "converted") {
      lead.converted_at = lead.updated_at;
    } else {
      lead.converted_at = null;
    }
    this.persist();
    return lead;
  }
  addLeadNote(leadId, content) {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (!lead) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const note = {
      id: `note_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      lead_id: leadId,
      content: content.trim(),
      created_at: now
    };
    this.data.lead_notes.push(note);
    lead.updated_at = now;
    this.persist();
    return note;
  }
  getAnalytics() {
    const totalLeads = this.data.leads.length;
    const convertedLeads = this.data.leads.filter((l) => l.status === "converted").length;
    const conversionRate = totalLeads > 0 ? Math.round(convertedLeads / totalLeads * 1e3) / 10 : 0;
    const oneWeekAgo = Date.now() - 7 * 864e5;
    const leadsThisWeek = this.data.leads.filter(
      (l) => new Date(l.created_at).getTime() >= oneWeekAgo
    ).length;
    const newCount = this.data.leads.filter((l) => l.status === "new").length;
    const contactedCount = this.data.leads.filter((l) => l.status === "contacted").length;
    const statusBreakdown = [
      {
        status: "new",
        label: "New",
        count: newCount,
        percentage: totalLeads > 0 ? Math.round(newCount / totalLeads * 100) : 0,
        color: "#5B7897"
      },
      {
        status: "contacted",
        label: "Contacted",
        count: contactedCount,
        percentage: totalLeads > 0 ? Math.round(contactedCount / totalLeads * 100) : 0,
        color: "#C98A2C"
      },
      {
        status: "converted",
        label: "Converted",
        count: convertedLeads,
        percentage: totalLeads > 0 ? Math.round(convertedLeads / totalLeads * 100) : 0,
        color: "#1F5D4C"
      }
    ];
    const trendMap = /* @__PURE__ */ new Map();
    const dayLabels = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      count: trendMap.get(date) || 0
    }));
    return {
      totalLeads,
      conversionRate,
      leadsThisWeek,
      statusBreakdown,
      trendData
    };
  }
};
var db = new Database();

// server/email.ts
import nodemailer from "nodemailer";
function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      }),
      mode: "smtp",
      host
    };
  }
  return {
    transporter: nodemailer.createTransport({
      jsonTransport: true
    }),
    mode: "dev_mock",
    host: "internal_agent_dispatcher"
  };
}
async function sendNewLeadAdminNotification(lead, baseUrl) {
  const recipient = db.getAdminEmail();
  const fromAddress = process.env.EMAIL_FROM || "Northlight Studio <notifications@northlight.studio>";
  const cleanBaseUrl = (baseUrl || "http://localhost:3000").replace(/\/$/, "");
  const leadUrl = `${cleanBaseUrl}/admin/leads/${lead.id}`;
  const subject = `New Lead Inquiry: ${lead.name}${lead.company ? ` \xB7 ${lead.company}` : ""}`;
  const formattedDate = new Date(lead.created_at).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #F7F8FA;
      color: #171A21;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 32px auto;
      background-color: #ffffff;
      border: 1px solid #E3E5E9;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #171A21;
      padding: 24px 32px;
      color: #ffffff;
    }
    .header-logo {
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 700;
      color: #94A3B8;
      margin: 0 0 4px 0;
    }
    .header-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }
    .content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background-color: #E2E8F0;
      color: #334155;
      margin-bottom: 20px;
    }
    .field-group {
      margin-bottom: 24px;
      border-bottom: 1px solid #F0F2F5;
      padding-bottom: 16px;
    }
    .field-group:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }
    .field-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748B;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .field-value {
      font-size: 15px;
      font-weight: 600;
      color: #171A21;
    }
    .field-value a {
      color: #1F5D4C;
      text-decoration: none;
    }
    .field-value a:hover {
      text-decoration: underline;
    }
    .message-box {
      background-color: #F8FAFC;
      border-left: 3px solid #1F5D4C;
      padding: 16px;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      border-radius: 0 4px 4px 0;
      white-space: pre-wrap;
      margin-top: 6px;
    }
    .action-container {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E3E5E9;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #1F5D4C;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .direct-link {
      margin-top: 14px;
      font-size: 12px;
      color: #64748B;
      word-break: break-all;
    }
    .direct-link a {
      color: #1F5D4C;
      text-decoration: underline;
    }
    .footer {
      background-color: #FAFAFC;
      border-top: 1px solid #E3E5E9;
      padding: 20px 32px;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Northlight Studio CRM</div>
      <h1 class="header-title">New Lead Inquiry Received</h1>
    </div>
    
    <div class="content">
      <div class="badge">Inbound Website Lead \xB7 Status: New</div>
      
      <div class="field-group">
        <div class="field-label">Contact Name</div>
        <div class="field-value">${escapeHtml(lead.name)}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Email Address</div>
        <div class="field-value"><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></div>
      </div>

      <div class="field-group">
        <div class="field-label">Company / Organization</div>
        <div class="field-value">${lead.company ? escapeHtml(lead.company) : '<span style="color: #94A3B8; font-weight: normal; font-style: italic;">Not provided</span>'}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Phone Number</div>
        <div class="field-value">${lead.phone ? escapeHtml(lead.phone) : '<span style="color: #94A3B8; font-weight: normal; font-style: italic;">Not provided</span>'}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Project Brief / Message</div>
        <div class="message-box">${escapeHtml(lead.message)}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Received At</div>
        <div class="field-value" style="font-size: 13px; font-weight: normal; color: #64748B;">${formattedDate}</div>
      </div>

      <div class="action-container">
        <a href="${leadUrl}" class="button" target="_blank" rel="noopener noreferrer">Open Lead in Admin Dashboard &rarr;</a>
        <div class="direct-link">
          Direct dashboard link: <br />
          <a href="${leadUrl}">${leadUrl}</a>
        </div>
      </div>
    </div>

    <div class="footer">
      This notification was automatically generated by Northlight Studio CRM for registered administrator <strong>${escapeHtml(recipient)}</strong>.<br />
      Manage notifications in studio settings.
    </div>
  </div>
</body>
</html>
  `.trim();
  const text = `
NORTHLIGHT STUDIO CRM - NEW LEAD INQUIRY

A new prospective client inquiry has been submitted through the public contact form.

Lead Details:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || "Not provided"}
- Phone: ${lead.phone || "Not provided"}
- Received: ${formattedDate}

Project Overview / Message:
${lead.message}

Review and manage this lead in your dashboard:
${leadUrl}
  `.trim();
  try {
    const { transporter, mode, host } = createEmailTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject,
      text,
      html
    });
    const sentVia = mode === "smtp" ? `SMTP (${host})` : "Dev Email Dispatcher";
    db.logEmailNotification({
      lead_id: lead.id,
      recipient,
      subject,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || null,
      lead_message: lead.message,
      lead_url: leadUrl,
      status: "delivered",
      sent_via: sentVia
    });
    console.log(`[EMAIL NOTIFICATION DISPATCHED]`);
    console.log(`  To: ${recipient}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Lead URL: ${leadUrl}`);
    console.log(`  Transport: ${sentVia}`);
    return {
      success: true,
      recipient,
      subject,
      leadUrl,
      messageId: info?.messageId || `msg_${Date.now()}`,
      sentVia
    };
  } catch (err) {
    console.error("[EMAIL NOTIFICATION ERROR] Failed to send email alert:", err);
    db.logEmailNotification({
      lead_id: lead.id,
      recipient,
      subject,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || null,
      lead_message: lead.message,
      lead_url: leadUrl,
      status: "sent",
      sent_via: `Failed (${err.message || "Unknown error"})`
    });
    return {
      success: false,
      recipient,
      subject,
      leadUrl,
      sentVia: "Error",
      error: err.message || "Failed to dispatch email"
    };
  }
}
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// server/app.ts
var ipRateLimits = /* @__PURE__ */ new Map();
function cleanRateLimits() {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}
function rateLimitLeadSubmission(req, res, next) {
  if (ipRateLimits.size > 200) {
    cleanRateLimits();
  }
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1e3;
  const maxSubmissions = 6;
  const current = ipRateLimits.get(ip);
  if (!current || now > current.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  if (current.count >= maxSubmissions) {
    res.status(429).json({
      error: "Too many submissions received from this network. Please wait a few minutes before submitting again."
    });
    return;
  }
  current.count += 1;
  next();
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Missing Bearer token." });
    return;
  }
  const token = authHeader.substring(7).trim();
  const payload = verifyJWT(token);
  if (!payload || !payload.sub) {
    res.status(401).json({ error: "Invalid or expired authentication session." });
    return;
  }
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };
  next();
}
var app = express();
app.use(express.json());
app.use((req, _res, next) => {
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.replace("/.netlify/functions/api", "/api");
    if (req.url === "" || req.url === "/") {
      req.url = "/api";
    }
  }
  const queryPath = req.query?.path || "";
  const matchedPath = req.headers["x-matched-path"] || "";
  if (queryPath) {
    const cleanPath = queryPath.startsWith("/") ? queryPath : `/${queryPath}`;
    req.url = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  } else if (matchedPath && matchedPath.startsWith("/api/")) {
    req.url = matchedPath;
  }
  if (req.url.startsWith("/admin") || req.url.startsWith("/auth") || req.url.startsWith("/health") || req.url.startsWith("/leads")) {
    req.url = `/api${req.url}`;
  }
  next();
});
var router = express.Router();
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Northlight CRM" });
});
router.post("/leads", rateLimitLeadSubmission, async (req, res) => {
  try {
    const { name, email, phone, company, message, _gotcha } = req.body || {};
    if (_gotcha && String(_gotcha).trim() !== "") {
      console.warn("Spam honeypot triggered on lead form submission.");
      res.status(200).json({ success: true, message: "Inquiry received." });
      return;
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Please enter your full name (at least 2 characters)." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      res.status(400).json({ error: "Please enter a message describing your project (at least 5 characters)." });
      return;
    }
    const newLead = db.createLead({
      name,
      email,
      phone: phone ? String(phone) : null,
      company: company ? String(company) : null,
      message,
      source: "website"
    });
    const origin = (req.get("origin") || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const baseUrl = process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" ? process.env.APP_URL : origin;
    let emailResult = {
      success: true,
      recipient: db.getAdminEmail(),
      sentVia: "Dev Email Dispatcher"
    };
    try {
      emailResult = await sendNewLeadAdminNotification(newLead, baseUrl);
    } catch (emailErr) {
      console.warn("Email dispatch warning (non-fatal, lead was saved):", emailErr);
    }
    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully.",
      lead: {
        id: newLead.id,
        name: newLead.name,
        email: newLead.email
      },
      notification: {
        sentTo: emailResult.recipient,
        status: emailResult.success ? "delivered" : "logged",
        sentVia: emailResult.sentVia
      }
    });
  } catch (err) {
    console.error("Unhandled lead submission error:", err);
    res.status(500).json({
      error: "An internal error occurred while processing your inquiry. Please try again.",
      details: err?.message || String(err)
    });
  }
});
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const token = signJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
router.get("/auth/me", requireAuth, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: "User account not found." });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
router.get("/admin/leads", requireAuth, (req, res) => {
  const search = req.query.search;
  const statusParam = req.query.status;
  const statusesParam = req.query.statuses;
  let statuses = [];
  if (Array.isArray(statusParam)) {
    statuses = statusParam;
  } else if (typeof statusParam === "string") {
    statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (typeof statusesParam === "string") {
    statuses = statusesParam.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const sortBy = req.query.sortBy || "date";
  const sortOrder = req.query.sortOrder || "desc";
  const leads = db.getAllLeads({
    search,
    statuses,
    sortBy,
    sortOrder
  });
  const allLeads = db.getAllLeads({});
  const counts = {
    total: allLeads.length,
    new: allLeads.filter((l) => l.status === "new").length,
    contacted: allLeads.filter((l) => l.status === "contacted").length,
    converted: allLeads.filter((l) => l.status === "converted").length
  };
  res.json({ leads, counts });
});
router.get("/admin/leads/:id", requireAuth, (req, res) => {
  const leadDetail = db.getLeadById(req.params.id);
  if (!leadDetail) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }
  res.json(leadDetail);
});
router.patch("/admin/leads/:id/status", requireAuth, (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["new", "contacted", "converted"];
  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be "new", "contacted", or "converted".' });
    return;
  }
  const currentLeadData = db.getLeadById(req.params.id);
  if (!currentLeadData) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }
  const previousStatus = currentLeadData.lead.status;
  const updatedLead = db.updateLeadStatus(req.params.id, status);
  if (previousStatus !== status) {
    const formatLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    db.addLeadNote(
      req.params.id,
      `Status updated from ${formatLabel(previousStatus)} to ${formatLabel(status)}.`
    );
  }
  res.json({ lead: updatedLead });
});
router.post("/admin/leads/:id/notes", requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Note content cannot be empty." });
    return;
  }
  const note = db.addLeadNote(req.params.id, content.trim());
  if (!note) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }
  res.status(201).json({ note });
});
router.get("/admin/analytics", requireAuth, (_req, res) => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});
router.get("/admin/notifications", requireAuth, (_req, res) => {
  const notifications = db.getEmailNotifications();
  const adminEmail = db.getAdminEmail();
  const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  res.json({
    adminEmail,
    isSmtpConfigured,
    smtpHost: process.env.SMTP_HOST || "Internal Agent Transporter",
    notifications
  });
});
router.post("/admin/notifications/test", requireAuth, async (req, res) => {
  const origin = (req.get("origin") || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  const baseUrl = process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" ? process.env.APP_URL : origin;
  const testLead = {
    id: "lead_test_sample",
    name: "Eleanor Vance (Test Lead)",
    email: "eleanor.vance@sample-venture.com",
    phone: "+1 (415) 555-0199",
    company: "Sample Venture Partners",
    message: "This is a test notification to verify that new inquiry alerts are properly dispatched to your registered admin email address.",
    source: "test_trigger",
    status: "new",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    converted_at: null
  };
  const result = await sendNewLeadAdminNotification(testLead, baseUrl);
  res.json({
    success: result.success,
    recipient: result.recipient,
    sentVia: result.sentVia,
    messageId: result.messageId,
    error: result.error
  });
});
router.all("*", (req, res) => {
  const debugInfo = {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    headers: {
      host: req.headers.host,
      "x-matched-path": req.headers["x-matched-path"],
      "x-forwarded-url": req.headers["x-forwarded-url"],
      "x-forwarded-for": req.headers["x-forwarded-for"]
    }
  };
  console.warn("[CRM ROUTE DEBUG 404] Unmatched API request path:", JSON.stringify(debugInfo, null, 2));
  res.status(404).json({
    error: "Not Found",
    message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    debug: debugInfo
  });
});
app.use("/api", router);
app.use((err, req, res, _next) => {
  console.error(`[CRM SERVER ERROR 500] Error on ${req.method} ${req.originalUrl || req.url}:`, err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || "An unexpected error occurred.",
    path: req.originalUrl || req.url,
    method: req.method
  });
});
var app_default = app;

// api/index.ts
var index_default = app_default;
export {
  index_default as default
};
