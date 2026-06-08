# Democracy Walk — Pnyx Athens

A free, mobile-first self-guided educational audio walk to the Pnyx in Athens — the birthplace of Athenian democracy.

**Stack:** React 18 · Vite 5 · TypeScript · Tailwind CSS v3 · React Router v6 · Supabase

---

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works fine)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

**Demo mode:** If `.env` is not configured, the app still runs using fallback static data for the 4 stops. Supabase features (email signup, feedback, analytics) will silently fail gracefully.

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
3. Go to **SQL Editor**, paste the full contents of `SUPABASE_SCHEMA.sql`, then click **Run**
4. To create an admin user: go to **Authentication → Users → Invite user**

---

## Build & Deploy

```bash
npm run build      # Produces dist/
npm run preview    # Preview the production build locally
```

### Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Deploy — Vite is auto-detected, no extra config needed

### Netlify

1. Connect your GitHub repo to Netlify
2. Build command: `npm run build` · Publish directory: `dist`
3. Set the same two environment variables in Netlify dashboard
4. The `public/_redirects` file handles SPA routing automatically

---

## Project Structure

```
src/
  components/         Reusable UI components
    Layout.tsx        Page shell with header + footer
    AudioPlayer.tsx   HTML5 audio player (iOS-compatible)
    ProgressBar.tsx   Stop progress indicator
    StopCard.tsx      Walk stop preview card
    EmailSignupForm.tsx
    FeedbackForm.tsx
    DisclaimerBox.tsx
  pages/              Route-level page components
    LandingPage.tsx
    StartPage.tsx
    StopPage.tsx      Core walk experience
    FinishPage.tsx
    PrivacyPage.tsx
    TermsPage.tsx
    CookiesPage.tsx
    admin/            Protected admin pages
      AdminLoginPage.tsx
      AdminDashboardPage.tsx
      AdminStopsPage.tsx
      AdminSignupsPage.tsx
      AdminFeedbackPage.tsx
  lib/
    types.ts          TypeScript interfaces
    supabaseClient.ts
    analytics.ts      Fire-and-forget event tracking
  data/
    fallbackStops.ts  Static fallback for demo mode
```

---

## Analytics Events

| Event | Triggered when |
|---|---|
| `landing_page_view` | Landing page loads |
| `start_walk_clicked` | "Start the walk" button clicked |
| `stop_opened` | User navigates to a stop |
| `stop_audio_started` | Audio play button pressed |
| `stop_completed` | Audio finishes playing |
| `walk_completed` | "Complete the walk" button on last stop |
| `email_signup_submitted` | Email signup form submitted |
| `feedback_submitted` | Feedback form submitted |
| `would_pay_answered` | Would-pay selection made in feedback |

---

## Admin

Access the admin dashboard at `/admin/login`. Login with Supabase Auth credentials.

- Dashboard with key metrics (signups, feedback count, completions, avg rating)
- Full CRUD for stops (create, edit, reorder, publish/unpublish, delete)
- Email signup viewer with CSV export
- Feedback viewer with rating averages and would-pay breakdown

---

## Legal

This is a self-guided educational audio walk for independent visitors. It is not an official guided tour, not a licensed tourist guide service, and it is not affiliated with the Hellenic Ministry of Culture, the City of Athens, or any official archaeological authority.
