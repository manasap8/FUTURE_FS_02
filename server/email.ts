import nodemailer from 'nodemailer';
import { Lead, db } from './db.ts';

// Get configured transporter or fallback stream/test transporter
function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      mode: 'smtp' as const,
      host,
    };
  }

  // Development / Sandboxed fallback transporter (JSON output + log)
  return {
    transporter: nodemailer.createTransport({
      jsonTransport: true,
    }),
    mode: 'dev_mock' as const,
    host: 'internal_agent_dispatcher',
  };
}

export interface SendEmailResult {
  success: boolean;
  recipient: string;
  subject: string;
  leadUrl: string;
  messageId?: string;
  sentVia: string;
  error?: string;
}

export async function sendNewLeadAdminNotification(
  lead: Lead,
  baseUrl: string
): Promise<SendEmailResult> {
  const recipient = db.getAdminEmail();
  const fromAddress = process.env.EMAIL_FROM || 'Northlight Studio <notifications@northlight.studio>';
  const cleanBaseUrl = (baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const leadUrl = `${cleanBaseUrl}/admin/leads/${lead.id}`;

  const subject = `New Lead Inquiry: ${lead.name}${lead.company ? ` · ${lead.company}` : ''}`;

  const formattedDate = new Date(lead.created_at).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
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
      <div class="badge">Inbound Website Lead · Status: New</div>
      
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
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
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
      html,
    });

    const sentVia = mode === 'smtp' ? `SMTP (${host})` : 'Dev Email Dispatcher';

    // Log to persistent CRM store
    db.logEmailNotification({
      lead_id: lead.id,
      recipient,
      subject,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || null,
      lead_message: lead.message,
      lead_url: leadUrl,
      status: 'delivered',
      sent_via: sentVia,
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
      sentVia,
    };
  } catch (err: any) {
    console.error('[EMAIL NOTIFICATION ERROR] Failed to send email alert:', err);

    db.logEmailNotification({
      lead_id: lead.id,
      recipient,
      subject,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || null,
      lead_message: lead.message,
      lead_url: leadUrl,
      status: 'sent',
      sent_via: `Failed (${err.message || 'Unknown error'})`,
    });

    return {
      success: false,
      recipient,
      subject,
      leadUrl,
      sentVia: 'Error',
      error: err.message || 'Failed to dispatch email',
    };
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
