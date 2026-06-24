# Chaingang Cycling Club Abuja — Web Platform

**Chains, Pedals & Lungs** — Nigeria's foremost mountain biking club based in Abuja.

Built with Next.js 14 App Router + Tailwind CSS 3 + Supabase + Vercel.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + SSO) |
| Edge Functions | Supabase (Deno) |
| Email | Resend |
| WhatsApp | Twilio |
| Monitoring | Vercel Analytics |
| CI/CD | GitHub Actions |

## Project Structure

```
src/
├── app/
│   ├── actions/           # Server Actions (news, announcements, gallery, contact)
│   ├── admin/             # Admin panel (server-side role check)
│   │   ├── announcements/ # CRUD for announcements
│   │   ├── gallery/       # Photo upload with compression
│   │   ├── members/       # Member invites + list
│   │   └── news/          # News CRUD (Tiptap rich text)
│   ├── api/               # API routes
│   │   ├── announcements/ # Single announcement fetch
│   │   ├── health/        # Health check endpoint
│   │   ├── invites/       # Invite generation
│   │   ├── strava/sync/   # Strava sync proxy
│   │   └── webhooks/      # Twilio WhatsApp webhook
│   ├── announcements/     # Public announcements (member-only)
│   ├── auth/              # Auth callback + signout
│   ├── dashboard/         # Member dashboard
│   ├── gallery/           # Photo gallery (member-only)
│   ├── leaderboard/       # Strava leaderboard (member-only)
│   ├── login/             # Login page
│   ├── news/              # Public news (ISR)
│   └── register/          # Invite-only registration
├── components/
│   ├── ContactForm.tsx    # NDPR-compliant contact form
│   ├── RichTextEditor.tsx # Tiptap editor wrapper
│   └── Ticker.tsx         # Announcement ticker bar
├── lib/
│   └── supabase/          # Supabase client factories (SSR)
└── middleware.ts           # Auth session middleware
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Supabase project (free tier works)
- Resend API key (for emails)
- Strava API credentials (for leaderboard)

### 1. Clone & Install
```bash
git clone https://github.com/nous-hermes/chaingang-web.git
cd chaingang-web
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRAVA_CLIENT_ID` | Strava API client ID |
| `STRAVA_CLIENT_SECRET` | Strava API client secret |
| `STRAVA_REFRESH_TOKEN` | Strava refresh token (with `activity:read` scope) |
| `STRAVA_CLUB_ID` | Strava club ID |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram Basic Display token |
| `RESEND_API_KEY` | Resend API key for emails |
| `CRON_SECRET` | Random string for cron job auth |
| `TWILIO_ACCOUNT_SID` | Twilio SID (optional, for WhatsApp) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (optional) |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number |
| `CHAINGANG_WHATSAPP_GROUP` | Club WhatsApp group number |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional, for alerts) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID (optional) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g., `https://chaingang.ng`) |

### 3. Database Setup

Run the migrations in your Supabase SQL editor:

1. `supabase/migrations/00001_initial_schema.sql` — Core tables, RLS, functions
2. `supabase/migrations/00002_storage_buckets.sql` — Storage buckets + policies

Then set up your first admin via Supabase dashboard:
```sql
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES ('your-auth-user-uuid', 'admin', 'your-auth-user-uuid');
```

### 4. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI if not already
npx supabase login
npx supabase link --project-ref your-project-ref

# Deploy edge functions
npx supabase functions deploy strava-sync
npx supabase functions deploy instagram-token-refresh

# Set secrets for edge functions
npx supabase secrets set \
  SUPABASE_URL=your-url \
  SUPABASE_SERVICE_ROLE_KEY=your-key \
  STRAVA_CLIENT_ID=... \
  STRAVA_CLIENT_SECRET=... \
  STRAVA_REFRESH_TOKEN=... \
  STRAVA_CLUB_ID=... \
  CRON_SECRET=...
```

### 5. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

## Features

### Public
- Landing page with club info, values, activities
- News feed with ISR (Incremental Static Regeneration)
- Contact form with NDPR consent + rate limiting
- SEO: sitemap, robots.txt, OG images, JSON-LD

### Member (authenticated)
- Dashboard with navigation cards
- Announcements (active, non-expired)
- Strava Leaderboard (4 tabs: KM, Elevation, Rides, KOMs)
- Photo Gallery with Instagram embed

### Admin (user_roles = 'admin')
- News CRUD with Tiptap rich text editor
- Announcements CRUD with type tagging (Event/Urgent/Info)
- Gallery photo upload with client-side compression (1200px)
- Member invite generation + list
- Dashboard with summary cards

### Automated
- **Strava Sync**: Weekly cron (Mon 02:00 WAT) via Vercel cron → Edge Function
- **Instagram Token Refresh**: Every 50 days via Edge Function
- **WhatsApp Alerts**: Twilio webhook on Urgent announcements (via Supabase DB webhooks)
- **CI/CD**: GitHub Actions — TruffleHog, npm audit, Lighthouse CI

## Security

- **Auth roles**: `user_roles` table (NOT `user_metadata`)
- **RLS**: Row-Level Security on all tables — members see what they should
- **XSS Protection**: `sanitize-html` on all Tiptap rich text output
- **Rate Limiting**: Contact form: 3/IP/hour
- **Secret Scanning**: TruffleHog in CI pipeline
- **Admin routes**: Server-side `isAdmin()` check on all `/admin/*` routes

## OAuth / API Setup Guides

### Strava
1. Go to https://www.strava.com/settings/api
2. Create an application
3. Get `client_id`, `client_secret`
4. Complete OAuth flow to get `refresh_token` with `activity:read` scope
5. Find your club ID from the club URL

### Instagram Basic Display
1. Create a Facebook App at https://developers.facebook.com
2. Add Instagram Basic Display product
3. Add `instagram_basic` permissions
4. Complete OAuth flow to get `access_token`
5. Token lasts ~60 days; auto-refresh Edge Function runs every 50 days

### Resend
1. Sign up at https://resend.com
2. Create API key
3. Verify your sending domain (`chaingang.ng`)

### Twilio (Optional)
1. Sign up at https://twilio.com
2. Get Account SID, Auth Token
3. Set up WhatsApp sender number

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... (all env vars from .env.local.example)
```

## Monitoring

- **Health endpoint**: `GET /api/health` — returns DB status, last Strava sync, storage estimate, IG token expiry
- **Vercel Analytics**: Enabled in root layout
- **Sync logs**: `sync_log` table tracks all automated job runs

## License

Private — Chaingang Cycling Club Abuja. All rights reserved.
CAC Reg: 163297.
