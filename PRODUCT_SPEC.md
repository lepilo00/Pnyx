# PRODUCT_SPEC.md — Democracy Walk: Pnyx Athens

---

## 1. Project Overview

**Democracy Walk** is a free, mobile-first self-guided educational audio walk to the Pnyx hill in Athens, Greece. The Pnyx is the historical site where the citizens' assembly (ekklesia) of ancient Athens met for over 200 years — making it arguably the birthplace of democratic practice in the Western world.

The app allows tourists already in Athens to discover the Pnyx independently, guided by short audio narrations and educational text at 4 stops along the route. The walk takes approximately 20 minutes on foot.

---

## 2. MVP Goal

**Validate demand.** Test whether tourists in Athens are interested in a free, short self-guided walk to the Pnyx that positions it as the "overlooked" birthplace of democracy — and whether a meaningful portion would pay for a more complete version.

**Success metrics:**
- Email signups from the landing page and finish page
- Walk completion rate (stop_1 opens vs. walk_completed events)
- "Would you pay €6.99?" response distribution (yes / maybe / no)
- Qualitative feedback comments

---

## 3. Target User

**Primary:** Independent tourists visiting Athens who have already visited or are planning to visit the Acropolis.

**Profile:**
- Travelling solo or in small groups
- Moderately curious about history, not necessarily enthusiasts
- Using a smartphone to navigate and discover activities
- Budget-conscious but willing to spend on good experiences
- Speaking English (primary) or other major European languages

**Secondary:** Digital nomads and expats in Athens interested in local history.

---

## 4. Core Value Proposition

> "You saw the Acropolis. Now stand where democracy actually spoke."

The Pnyx is a 10-minute walk from the Acropolis and sees a fraction of the visitors. Democracy Walk reframes it as the most historically significant political site in the world — the place where citizens actually governed — and delivers that story in a premium but accessible audio format.

**Differentiators from existing options:**
- Completely free (removes all friction for trial)
- Self-guided (no group, no fixed time, no waiting)
- Short (20 minutes — fits naturally into an Acropolis day)
- Educational framing without dry academic tone
- Mobile-optimised with no app download required

---

## 5. Legal Positioning

This product is positioned carefully to avoid any legal conflicts with Greek tourism licensing laws (which require licensed guides for official tours).

**This product is:**
- A self-guided educational audio walk
- An independent educational project
- Content for independent visitors

**This product is NOT:**
- An official guided tour
- A licensed tourist guide service
- Affiliated with the Hellenic Ministry of Culture
- Affiliated with the City of Athens
- Affiliated with any official archaeological authority

**All legal copy in the app must reflect this positioning.** The disclaimer must appear on the landing page, start page, and in the Terms of Use.

---

## 6. What This Product Is Not

- Not an official archaeological site guide
- Not a replacement for licensed tour guides
- Not a native mobile app (web-only)
- Not a payment product in the MVP (the walk is free)
- Not a user account system for visitors (no login required for the walk)
- Not a tour aggregator or marketplace

---

## 7. User Flow

```
Landing page (/)
  ↓ "Start the free walk" CTA
Start page (/start)
  → Overview of 4 stops, safety disclaimer
  ↓ "Begin the walk" button
Stop 1 (/stop/stop-1)
  → Audio player, description, optional image
  ↓ "Next stop" button
Stop 2 (/stop/stop-2)
  ↓
Stop 3 (/stop/stop-3)
  ↓
Stop 4 (/stop/stop-4)
  ↓ "Complete the walk" button
Finish page (/finish)
  → Feedback form (rating + would you pay)
  → Email signup for extended version
  → Link back to home
```

**Secondary flow (landing → email signup):**
Visitors who are not yet in Athens or who want to register interest can submit their email from the landing page without starting the walk.

---

## 8. Pages

| Route | Name | Description |
|---|---|---|
| `/` | Landing Page | Hero headline, CTA, disclaimers, email signup |
| `/start` | Start Page | Walk overview, stop list, safety disclaimer, start button |
| `/stop/:id` | Stop Page | Audio player, description, image, progress bar, navigation |
| `/finish` | Finish Page | Completion message, feedback form, email signup |
| `/privacy` | Privacy Policy | GDPR-compliant data usage policy |
| `/terms` | Terms of Use | Legal scope, liability disclaimer |
| `/cookies` | Cookie Notice | Minimal cookie usage explanation |
| `/admin/login` | Admin Login | Supabase Auth email/password login |
| `/admin` | Admin Dashboard | Metrics overview, nav to sub-pages |
| `/admin/stops` | Manage Stops | CRUD for audio stops |
| `/admin/signups` | Email Signups | View and export signup list |
| `/admin/feedback` | Feedback | View ratings and comments |

---

## 9. Features

### Visitor features
- Self-guided walk with 4 audio stops
- HTML5 audio player with play/pause, scrubber, time display
- Progress indicator showing current stop out of total
- Stop-to-stop navigation (next button + mini dot nav)
- Optional stop illustration/image
- Email signup with GDPR consent
- Star rating (1–5) + text comment feedback
- "Would you pay €6.99?" poll (yes / maybe / no)
- Legal and safety disclaimers on relevant pages
- Works in demo mode without Supabase (uses fallback data)

### Admin features
- Protected login (Supabase Auth)
- Dashboard with key metrics (signups, feedback, completions, avg rating)
- Create / edit / delete stops
- Toggle stop published/draft status
- Reorder stops (up/down)
- Set audio URL and image URL per stop
- View email signups with pagination and CSV export
- View feedback with summary stats (avg rating, would-pay breakdown)

---

## 10. Database Schema

### `walks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | e.g. "Democracy Walk" |
| slug | text | Unique, e.g. "democracy-walk-pnyx" |
| description | text | |
| location_name | text | e.g. "Pnyx Hill, Athens" |
| duration_minutes | integer | |
| is_published | boolean | |
| created_at / updated_at | timestamptz | |

### `stops`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| walk_id | uuid | FK → walks.id |
| order_index | integer | Controls display order |
| title | text | |
| description | text | |
| audio_url | text | Nullable |
| image_url | text | Nullable |
| latitude / longitude | decimal | Nullable, for future map feature |
| is_published | boolean | |
| created_at / updated_at | timestamptz | |

### `email_signups`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | |
| source | text | "landing" or "finish" |
| consent | boolean | GDPR consent flag |
| created_at | timestamptz | |

### `feedback`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| rating | integer | 1–5, nullable |
| message | text | Nullable |
| would_pay | text | 'yes' / 'maybe' / 'no', nullable |
| created_at | timestamptz | |

### `analytics_events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| event_name | text | See event list below |
| page_path | text | e.g. "/stop/stop-2" |
| stop_id | uuid | FK → stops.id, nullable |
| metadata | jsonb | Nullable, additional context |
| created_at | timestamptz | |

---

## 11. Analytics Events

| Event name | When |
|---|---|
| `landing_page_view` | Landing page mounts |
| `start_walk_clicked` | Start button on /start clicked |
| `stop_opened` | Stop page mounts |
| `stop_audio_started` | Play button pressed |
| `stop_completed` | Audio ends (onEnded) |
| `walk_completed` | "Complete the walk" button clicked |
| `email_signup_submitted` | Email signup form successfully submitted |
| `feedback_submitted` | Feedback form successfully submitted |
| `would_pay_answered` | Feedback submitted with a would_pay value |

---

## 12. Admin Functionality

The admin section is accessible at `/admin` and protected by Supabase Auth (email/password).

**Dashboard:** Displays total signups, total feedback responses, walk completions, and average rating.

**Stop management:**
- List all stops ordered by `order_index`
- Toggle published/draft per stop
- Edit title, description, audio URL, image URL
- Move stops up or down in order
- Add new stops
- Delete stops (with confirmation)

**Email signups:**
- Paginated table (25 per page)
- Columns: email, source, consent, date
- Client-side CSV export of current page

**Feedback:**
- Full list ordered newest first
- Star rating display
- Would-pay badge per response
- Summary: average rating + would-pay counts

---

## 13. Safety Disclaimers

The following safety notice must appear on the start page and wherever visitors are being directed to a physical location:

> "Visitors are responsible for their own safety. Check weather conditions, wear suitable footwear, carry water, avoid extreme heat, and follow all local rules and signs."

**Note:** The Pnyx is a public hill with unpaved paths. It is not staffed. Visitors access it entirely at their own risk.

---

## 14. Privacy and Cookie Requirements

### Privacy
- Collect only: email (if signed up), feedback rating/comment/would_pay, anonymous analytics events
- No advertising tracking
- No third-party data sharing
- Supabase is the data processor (EU-region storage)
- GDPR rights stated (access, correction, deletion)
- Consent required before email signup

### Cookies
- Only the Supabase authentication session cookie (admin only)
- No advertising cookies
- No social media pixels
- Visitors (non-admin) trigger no cookies
- Cookie notice page explains this clearly

---

## 15. Future Paid Version Idea

**Product:** A 45-minute extended walk covering more of the Pnyx and connecting sites.

**Pricing hypothesis:** €6.99 one-time purchase per device (the "Would you pay?" poll tests this).

**Additional content ideas:**
- More stops (6–8 total)
- Deeper historical narration
- Maps and optional GPS waypoints
- Illustrated historical reconstructions
- Audio in multiple languages

**Revenue model options:**
- One-time purchase (most frictionless, tested in MVP poll)
- Annual subscription for a "Athens Walks" bundle
- B2B licensing to hotels and tour aggregators

---

## 16. Future AI Guide Idea

A conversational AI guide could be integrated into each stop:

- Visitors press a "Ask a question" button after hearing the audio
- They type or speak a question (e.g. "What happened to Socrates here?")
- An LLM responds with historically grounded context, scoped to the walk
- Responses are kept short and conversational (museum audio-guide tone)

**Technical approach:**
- Claude or GPT-4 API with a system prompt that grounds the assistant in Pnyx/Athenian democracy content
- Optional voice input via Web Speech API (Chrome/Safari)
- Optional text-to-speech output

**Positioning:** The AI guide would be presented as an "educational companion" — not as a licensed guide — consistent with the legal positioning of the base product.

---

## 17. Deployment Instructions

### First deployment (Vercel)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import the repo
3. Vercel auto-detects Vite; no build config changes needed
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click Deploy

### First deployment (Netlify)

1. Push the repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Build command: `npm run build` · Publish directory: `dist`
4. Add the same two environment variables
5. The `public/_redirects` file ensures all routes serve `index.html`

### Supabase setup checklist

- [ ] Run `SUPABASE_SCHEMA.sql` in the SQL Editor
- [ ] Confirm RLS is enabled on all 5 tables
- [ ] Create an admin user via Authentication → Users
- [ ] Test admin login at `/admin/login`
- [ ] Test that unauthenticated users cannot read `email_signups`

---

## 18. Open Questions

1. **Licensing:** Should we consult a Greek lawyer about the legality of audio content describing an archaeological site, even as a self-guided walk?

2. **Audio production:** Who produces the voice narration? Professional voice actor vs. AI voice (e.g. ElevenLabs)?

3. **Languages:** Should the MVP launch in English only, or add Greek? What about other high-traffic tourist languages (German, French, Italian)?

4. **Offline support:** Should stops be cached for offline use (Service Worker / PWA)? Important if visitors have poor mobile data at the site.

5. **GPS/maps:** Should a future version show a live map with the visitor's position and the next stop's location?

6. **Pricing:** Is €6.99 the right price point for the full version? The poll will give early data but not a definitive answer.

7. **Distribution:** How do tourists discover the app? In-app QR codes on hotel lobby posters? Google/TripAdvisor SEO? Instagram? Partnerships with Acropolis ticket sellers?

8. **Content accuracy:** Should the historical content be reviewed by an academic historian before launch?

9. **Attribution of images/illustrations:** All illustrations are currently placeholders. What is the source and licensing plan for final illustrations?

10. **Multiple walks:** Is the Pnyx a one-off, or is this the beginning of an "Athens Walks" or "European Democracy Walks" series?
