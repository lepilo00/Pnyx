# PNYX Athens — The Hidden Site of Athenian Democracy

A free, mobile-first self-guided educational audio walk to the Pnyx in Athens — the birthplace of Athenian democracy.

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS v3 · React Router v7 · Supabase

---

## Local Development

### Prerequisites

- Node.js 22+
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
4. Create or invite the admin user in **Authentication → Users**.
5. Assign the admin role from the SQL editor (replace the email first):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

Sign out and back in after changing the role so the access token contains the
new claim. An authenticated account without this role cannot access admin data.

For existing installations, run `SUPABASE_SCHEMA.sql` again to add the current
premium fields, settings table, RLS policies and atomic reorder function.

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
    MapNavigation.tsx  Leaflet/OpenStreetMap interactive map
    Compass.tsx        Device orientation compass UI
  hooks/
    useGeolocation.ts  watchPosition wrapper
    useCompass.ts      DeviceOrientationEvent wrapper (iOS permission aware)
  pages/              Route-level page components
    LandingPage.tsx
    StartPage.tsx
    StopPage.tsx      Core walk experience
    FinishPage.tsx
    PrivacyPage.tsx
    TermsPage.tsx
    CookiesPage.tsx
    NavigatePage.tsx  Interactive map + compass navigation to Pnyx
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

### Current unlock model

The premium unlock currently uses an explicit honor system: the visitor confirms
the bank transfer and the unlock is stored for that browser session. It is not a verified
payment flow. Before treating premium access as a commercial purchase, replace
this with a payment provider, server-side webhook verification and a signed
entitlement.

---

## Navigation feature (`/navigate`)

The `/navigate` page provides:
- Interactive OpenStreetMap via React Leaflet with a Pnyx destination marker
- Live user location via the browser Geolocation API (`watchPosition`)
- Distance to the Pnyx in meters/kilometres
- Optional compass pointing towards the Pnyx (uses `DeviceOrientationEvent`)
- "Open in Google Maps" button with walking directions
- Safety disclaimer

**HTTPS requirement:** Geolocation and compass features require a secure context (HTTPS) in production. Both Vercel and Netlify serve over HTTPS by default. The features will not work on plain `http://` in production browsers.

The compass is an optional enhancement. If the device does not support `DeviceOrientationEvent`, or the user denies permission on iOS, the compass is hidden and a descriptive message is shown. Navigation remains fully functional via the map and Google Maps link.

---

## Legal

This is a self-guided educational audio walk for independent visitors. It is not an official guided tour, not a licensed tourist guide service, and it is not affiliated with the Hellenic Ministry of Culture, the City of Athens, or any official archaeological authority.
