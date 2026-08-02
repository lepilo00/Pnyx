# PNYX Athens — The Hidden Site of Athenian Democracy

A free, mobile-first, self-guided audio experience at the Pnyx in Athens. All
14 published stories — 3 introductions, 4 main stories and 7 bonus stories —
are available without payment, login or unlocking.

Stack: React 19, Vite 8, TypeScript, Tailwind CSS, React Router and Supabase.

## Local development

Requirements: Node.js 22+ and, for database-backed features, a Supabase project.

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. Without them,
the public listening experience uses bundled fallback stories; database writes
fail silently by design.

Useful checks:

```bash
npm run check:translations
npm run lint
npm run build
npm run preview
```

## Routes

- `/` — landing page
- `/listen` — all 14 free audio stories and the compact shared player
- `/stop/:id` — individual story/playlist presentation
- `/finish` — completion, bonus discovery and survey invitation
- `/support` — optional contribution; it never changes access
- `/feedback/:guideId` — versioned feedback survey
- `/privacy`, `/cookies`, `/terms` — legal information
- `/admin` — protected content, feedback and analytics administration
- `/start` and `/premium` — legacy redirects to `/listen`

The primary entry CTA is “Start Free Audio Discovery”, localized in all ten
supported languages. “Start listening” is retained only as the `/listen` page
heading.

## Supabase and rollout

`SUPABASE_SCHEMA.sql` provides the base schema for a new project. Apply the
versioned scripts in `supabase/migrations` after it; existing projects apply only
the migrations they have not run yet.

The August 2026 free-model change deliberately has staged post-deploy scripts:

1. Apply migrations. This makes all stories free, prepares survey V2 as a draft,
   updates submission validation and installs 12-month retention.
2. Deploy the application and legal copy.
3. Run `supabase/post_deploy/202608010001_publish_feedback_v2.sql` to close V1
   without deleting its results and publish anonymous V2.
4. After a backup and at least 24 hours of verification, run
   `supabase/post_deploy/202608010002_remove_legacy_monetization_after_rollback_window.sql`.

The weekly retention job runs Saturday at 03:30 UTC. It deletes analytics
events and feedback submissions older than 12 months; feedback answers follow
through `ON DELETE CASCADE`. Email signups remain until unsubscribe or deletion
request.

To grant admin access, set trusted app metadata and refresh the user session:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

## Feedback V2

V2 is an anonymous two-minute test survey. Its payload contains answers only:
no email, session identifier, listening progress or technical context. The
conditional blocker question applies only when `start_ease` is 1–3. Admin
summaries show averages for ratings, distributions for choices and individual
text answers. CSV columns use stable question keys and support both V1 and V2.

## Analytics

Public analytics is a small allowlist of event names. Current contribution
metrics are prompt views, contribution-panel opens and self-reported
contributions. No visitor identifier is attached to public analytics events.

## Production note

The repository intentionally retains the approved test contact address,
placeholder biographies, controller identity and test IBAN. Replace and review
them before a public launch or accepting real bank contributions.
