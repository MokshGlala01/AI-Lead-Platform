# EFOS AI Lead Management Platform (Serverless Edition)

An enterprise-grade, visually stunning student lead qualification and enrollment automation SaaS platform built using **Next.js 15 (React 19)** and **Supabase (PostgreSQL, RLS, Storage, Auth, Realtime)**.

---

## 🎯 Platform Features
1. **Glassmorphic UI**: Beautiful dark luxury theme background with Aurora accents, glowing interactive components, and floating layouts.
2. **WebGL Particle Canvas**: Interactive floating 3D particle network rendering to background.
3. **Dynamic Lead Scoring**: Auto-scores leads (0–100) based on interest, credentials, age, and visits.
4. **Round-Robin Assignment**: Hot leads (score ≥ 80) automatically assigned to available counselors with the lowest workload.
5. **AI Copywriter**: OpenRouter integration (offline safe) to compose custom WhatsApp, email, or SMS drafts.
6. **Command Palette**: Search students or navigate anywhere instantly via `Ctrl+K`.
7. **Drag-and-Drop Kanban**: Modern routing columns to transition student stages.
8. **Real-time Analytics**: Recharts dashboards analyzing conversion rates, demographics, and registration velocity.

---

## 📁 Directory Structure
```
efos-lead-system/
├── client/                         # Next.js 15 (React 19 + TypeScript + Tailwind) Serverless App
├── supabase_schema.sql             # Supabase DB Schema migrations & seed script
└── README.md                       # Setup Documentation
```

---

## 🚀 Getting Started

### Step 1: Database Setup
1. Create a free database project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `supabase_schema.sql` file located at the root of this project and execute the query. This creates all tables (`leads`, `counselors`, `messages`, `enrollments`, etc.), indexes, auto-updating triggers, seed data, and Row Level Security (RLS) policies.

### Step 2: Next.js Setup (`client/`)
1. Open a terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Create a `.env` file inside the `client/` directory and configure your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" # Keep private on server side
   OPENROUTER_API_KEY="sk-or-your-key"
   AI_MODEL="openai/gpt-4o-mini"
   N8N_WEBHOOK_URL=""
   ```
3. Install dependencies (React 19 peer dependencies require `--legacy-peer-deps`):
   ```bash
   npm install --legacy-peer-deps
   ```
4. Start the application:
   - Development Mode: `npm run dev` (Runs on `http://localhost:3000`)
   - Production Build: `npm run build` followed by `npm run start`

---

## ⚙️ n8n Automation Sequence
To trigger the automated welcome follow-ups:
1. Create a new workflow in your **n8n** editor.
2. Setup a **Webhook node** listening on `POST` to receive lead objects.
3. Trigger this webhook by adding its URL to `N8N_WEBHOOK_URL` in the `client/.env` file.
4. Set up wait nodes (Day 1, Day 3, Day 5, etc.) and call the Next.js API `POST /api/messages/generate` to compose and log follow-up message drafts.
"# AI-Lead-Platform" 
