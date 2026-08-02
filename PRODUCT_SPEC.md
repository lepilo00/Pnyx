# PNYX Athens product specification

## Product

PNYX is a free, mobile-first, self-guided educational audio experience at the
Pnyx in Athens. It helps independent visitors understand the site where the
Athenian Assembly met. It is not an official guided tour and is not affiliated
with an archaeological or government authority.

## Experience and content

- About 30 minutes across 14 audio stories.
- 3 introduction stories, 4 main stories and 7 optional bonus stories.
- Every published story is playable without login, payment or unlocking.
- Primary entry CTA: “Start Free Audio Discovery”, localized in ten languages.
- Legacy `/start` and `/premium` links redirect to `/listen`.
- A voluntary contribution invitation appears between main and bonus stories
  after all four main stories are complete. A contribution never changes access.

## Player

Listening pages share one fixed compact player. Its base mobile height is 68 px
plus safe-area inset. Controls are at least 44 × 44 px. Time is displayed as
elapsed/total: elapsed seconds round down and total seconds round up. At a media
duration of 95.9 seconds the initial display is `0:00 / 1:36`. On very narrow
screens artwork is hidden before controls or title.

## Test survey V2

The survey appears after the visitor completes all three introduction and four
main stories. It is anonymous, estimated at two minutes, and stores no email,
session identifier, listening progress or technical context.

Stable question keys:

1. `pnyx_familiarity` — required single choice
2. `offering_summary` — required short text
3. `start_ease` — required 1–5 rating
4. `start_ease_blocker` — required text only when `start_ease` is 1–3
5. `pnyx_liveliness` — required 1–5 rating
6. `bonus_likelihood` — required 1–5 rating
7. `contribution_prompt_reaction` — required single choice
8. `top_improvement` — required long text

Slovenian is the source copy and all survey content is available in the other
nine application languages. Survey V1 remains closed and separately reportable.
Admin reports rating averages, choice distributions, text-response counts and
individual responses. CSV uses stable keys across versions.

## Data and privacy

- Supabase processes application data for PNYX.
- Anonymous survey submissions contain only visible answers and submission time.
- Minimal public analytics events have no visitor identifier.
- Language, theme, audio progress and survey drafts stay in browser storage.
- Analytics events and feedback submissions are deleted after 12 months.
- Answers are deleted with their submission through `ON DELETE CASCADE`.
- Voluntary email signups remain until unsubscribe or deletion request.

## Administration

Trusted Supabase `app_metadata.role = "admin"` protects admin pages and RLS.
Admins can manage guides and stories, inspect current contribution metrics,
review separate survey versions, view generic aggregates and export CSV. Story
forms contain no paid flag or price setting.

## Release acceptance

- All 14 published stories play on `/listen` and `/stop/:id` without a gate.
- Exactly one contribution block appears after the four main stories.
- No active public/admin UI contains monetization or unlock configuration.
- CTA, free-model copy and duration agree in all ten languages.
- The player remains usable at 320, 390 and 430 px and does not cover final UI.
- V2 condition and minimized payload behave as specified; V1 stays accessible.
- Retention deletes records older than 12 months and preserves newer records.
- Translation parity, lint, TypeScript and production build pass.
