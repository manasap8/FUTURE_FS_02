# 🌌 Northlight CRM — Full-Stack Lead Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-northlightcrm.netlify.app-10B981?style=for-the-badge&logo=netlify&logoColor=white)](https://northlightcrm.netlify.app/)

> **Task Reference**: Future Intern — Full Stack Web Development Internship (`FUTURE_FS_02`)  
> **Author**: Manasa P ([@manasap8](https://github.com/manasap8))  
> **Live Website**: [https://northlightcrm.netlify.app/](https://northlightcrm.netlify.app/)  

---

## 📌 Overview

**Northlight CRM** is an end-to-end, full-stack client lead management system and sales pipeline dashboard designed specifically for creative studios, digital agencies, and independent consultants.

The application bridges a **high-converting, interactive public landing page** with a **secure, feature-rich executive admin dashboard**, allowing agencies to capture potential clients, track incoming inquiries, manage communication status, record internal notes, and analyze conversion velocity.

---

## ✨ Key Features

### 🌐 1. Public Agency Landing & Lead Intake
* **Interactive Service Selector**: Prospective clients select focus areas (*Design System*, *Full-Stack Web App*, *Brand Architecture*, *Codebase Audit*).
* **Smart Lead Form**: Captures name, email, phone, company, and project scope with real-time validation.
* **Anti-Bot Honeypot Protection**: Hidden honeypot field (`_gotcha`) automatically traps and silences automated spam bots without interrupting real users.
* **IP-Based Sliding-Window Rate Limiting**: Safeguards the public API against brute-force or spam submissions (up to 6 submissions per 10-minute window per IP).

### 🔒 2. Executive Authentication & Access Control
* **JWT-Based Bearer Sessions**: Cryptographically signed HMAC-SHA256 authorization tokens.
* **Salted Password Hashing**: Passwords are securely hashed and verified with Node.js native `crypto.scryptSync` with random 16-byte salts and timing-safe comparison.
* **Protected Routes & APIs**: Complete authorization guard across all `/api/admin/*` routes.

### 📊 3. Leads Pipeline & Management
* **Multi-Status Pipeline Filtering**: Filter leads across pipeline stages (`New`, `Contacted`, `Converted`).
* **Real-Time Search & Sorting**: Instant filtering across name, company, email, and message; sortable by newest first, oldest first, or alphabetically.
* **Interactive Status Stepper**: Transition leads sequentially through stages (`New` ➔ `Contacted` ➔ `Converted`) with automatic audit log note generation.
* **Notes & Timeline History**: Maintain timestamped internal notes, meeting recaps, and stakeholder communications per lead.

### 📈 4. Visual Pipeline Analytics
* **Conversion Rate Tracking**: Real-time calculation of overall lead conversion percentages.
* **Intake Velocity**: Monitor lead volume acquired during the current rolling week.
* **Status Distribution**: Visual proportional progress bars and breakdown metrics across all statuses.
* **Intake Trends**: Multi-day intake trend charts visualizing prospective client inquiry volume.

### 📧 5. Automated Email Notification Engine
* **Instant Admin Alerts**: Dispatches a responsive HTML notification with deep-link lead review buttons to the studio admin upon every new inquiry submission.
* **SMTP Integration via Nodemailer**: Configurable with custom SMTP credentials or operates in simulated transporter mode for development.
* **Notification Modal & Audit Log**: View all dispatched email alerts, delivery status, recipient timestamps, and trigger on-demand test alerts.

---

## 🏗️ Architecture & Project Structure

```
FUTURE_FS_02/
├── data/
│   └── crm_store.json        # Atomic file-backed JSON database store
├── server/
│   ├── db.ts                 # Database engine, password scrypt hashing, JWT & seed logic
│   └── email.ts              # Nodemailer email notification service with HTML templates
├── src/
│   ├── components/
│   │   ├── AdminLogin.tsx    # Secure admin portal authentication screen
│   │   ├── AnalyticsView.tsx # Visual pipeline analytics and trend charts
│   │   ├── LeadDetailView.tsx# Lead inspection, status stepper & note history
│   │   ├── LeadsView.tsx     # Pipeline table/cards, search, filter & sorting
│   │   ├── NotificationsModal.tsx # Dispatched email alerts modal & test trigger
│   │   ├── PublicPage.tsx    # Agency landing page & lead capture form
│   │   ├── Sidebar.tsx       # Persistent navigation bar with status counters
│   │   └── Toast.tsx         # Floating alert notification toasts
│   ├── lib/
│   │   └── api.ts            # Typed client API wrapper for REST endpoints
│   ├── App.tsx               # Main application controller & client-side router
│   ├── index.css             # Tailwind CSS tokens and layout styles
│   ├── main.tsx              # React DOM root bootstrapping
│   └── types.ts              # Global TypeScript interfaces & domain types
├── .env.example              # Template environment variables
├── index.html                # Main HTML entry point
├── package.json              # Project dependencies and lifecycle scripts
├── server.ts                 # Express HTTP server with Vite middleware
├── tsconfig.json             # TypeScript compiler configuration
└── vite.config.ts            # Vite build configuration
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [React 19](https://react.dev/) | Component-based UI library |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS design system |
| **Icons & Motion** | [Lucide React](https://lucide.dev/) / [Motion](https://motion.dev/) | Vector iconography and smooth UI micro-animations |
| **Backend API** | [Express 4](https://expressjs.com/) | Node.js REST API web server |
| **Development** | [Vite 6](https://vitejs.dev/) + [TSX](https://github.com/privatenumber/tsx) | Fast hot module replacement & TypeScript runtime |
| **Email Service** | [Nodemailer](https://nodemailer.com/) | SMTP email dispatcher for lead alerts |
| **Security** | `crypto` (scrypt, HMAC-SHA256) | Salted password hashing, timing-safe auth & JWT |
| **Storage** | File-backed JSON Database | Zero-dependency atomic persistent store |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have one of the following runtimes installed:
* **Node.js**: `v18.0.0` or higher
* **npm** (bundled with Node) or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/manasap8/FUTURE_FS_02.git
cd FUTURE_FS_02
```

### 2. Install Dependencies
Using **npm**:
```bash
npm install
```
*Or using **bun**:*
```bash
bun install
```

### 3. Configure Environment Variables
Create a local `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` to match your preferences:
```env
# Gemini API Key (optional for AI capabilities)
GEMINI_API_KEY="YOUR_API_KEY"

# Base Application URL
APP_URL="http://localhost:3000"

# Email Notifications (SMTP configuration for admin lead alerts)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM="Northlight Studio <notifications@northlight.studio>"
ADMIN_NOTIFICATION_EMAIL="manu@gmail.com"
```
> 💡 *Note: If SMTP credentials are left blank, the notification engine will safely simulate deliveries in-memory and record logs without crashing.*

### 4. Run the Development Server
```bash
npm run dev
```
The server will start at: **`http://localhost:3000`**

---

## 🚀 Deploying to Netlify & Vercel

### Deploying to Netlify (Live Deployment)
This repository includes ready-to-deploy Netlify configuration (`netlify.toml` and `netlify/functions/api.ts`).

1. Push your repository to GitHub.
2. In [Netlify](https://app.netlify.com/), click **"Add new site" ➔ "Import an existing project"**.
3. Select your repository. Netlify auto-detects:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. In **Site configuration ➔ Environment variables**, configure:
   - `APP_URL`: `https://northlightcrm.netlify.app`
   - `ADMIN_NOTIFICATION_EMAIL`: `manu@gmail.com`
5. Click **"Deploy site"**. The live site is served at: **[https://northlightcrm.netlify.app/](https://northlightcrm.netlify.app/)** (Admin Dashboard: **[/admin](https://northlightcrm.netlify.app/admin)**)

### Deploying to Vercel
This repository also includes first-class support for **Vercel** serverless deployments (`vercel.json` and `/api/index.ts`).

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **"Add New..." ➔ "Project"** and select your repository.
3. Keep the default settings (**Framework**: Vite, **Output Directory**: `dist`).
4. (Optional) In the **Environment Variables** panel, add `APP_URL` and `ADMIN_NOTIFICATION_EMAIL`.
5. Click **"Deploy"**. Both the Vite frontend and the `/api` Express backend will deploy seamlessly!

---

## 🔑 Default Admin Credentials

To access the administrative pipeline dashboard, click **"Pipeline Login"** in the top navigation or navigate directly to `http://localhost:3000/admin/login`:

| Field | Value |
| :--- | :--- |
| **Admin Email** | `manu@gmail.com` |
| **Password** | `manu@123` |

---

## 📡 REST API Reference

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/leads` | Submit a new lead inquiry (rate-limited, honeypot protected) |
| `POST` | `/api/auth/login` | Authenticate admin user & receive Bearer JWT |

### Protected Admin Endpoints *(Requires `Authorization: Bearer <token>`)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/admin/leads` | Retrieve leads with multi-status filter, search & sort |
| `GET` | `/api/admin/leads/:id` | Retrieve full detail, timeline & notes for a specific lead |
| `PATCH` | `/api/admin/leads/:id/status` | Update lead status (`new` ➔ `contacted` ➔ `converted`) |
| `POST` | `/api/admin/leads/:id/notes` | Append internal note to lead history |
| `GET` | `/api/admin/analytics` | Get pipeline metrics, conversion rate & trend dataset |
| `GET` | `/api/admin/notifications` | Get email alert logs and SMTP transporter configuration |
| `POST` | `/api/admin/notifications/test` | Trigger a test email dispatch to admin address |

---

## 🧪 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts server and client concurrently in development mode |
| `npm run build` | Compiles client with Vite and bundles server with esbuild to `dist/` |
| `npm start` | Runs the compiled production build from `dist/server.cjs` |
| `npm run lint` | Performs TypeScript type-checking without emitting files (`tsc --noEmit`) |

---

## 🛡️ Security Best Practices Implemented
* **Honeypot Anti-Spam Strategy**: Traps bots without invasive CAPTCHA obstacles for clients.
* **Rate Limiting Guard**: Sliding window IP memory limit to prevent endpoint flooding.
* **Scrypt Salted Password Hashing**: Protects against rainbow table and hash attacks.
* **Timing-Safe Digest Verification**: Prevents side-channel timing attacks during password authentication and signature validation.
* **Zero-Vulnerability Pure Dependency Tree**: Strict typing, sanitized inputs, and hardened HTTP headers.

---

## 👩‍💻 Author & Acknowledgements

Developed as part of the **Future Intern Full-Stack Web Development Internship (`FUTURE_FS_02`)**.

* **Developer**: Manasa P
* **Live Website**: [https://northlightcrm.netlify.app/](https://northlightcrm.netlify.app/)
* **Admin Dashboard**: [https://northlightcrm.netlify.app/admin](https://northlightcrm.netlify.app/admin)
* **Repository**: [https://github.com/manasap8/FUTURE_FS_02](https://github.com/manasap8/FUTURE_FS_02)
