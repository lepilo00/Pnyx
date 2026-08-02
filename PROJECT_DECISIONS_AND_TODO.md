# PNYX implementation decisions and release checklist

Updated 1 August 2026. This document supersedes the former paid-content and
honor-system unlock decisions.

## Current decisions

- All 14 published audio stories are free. Contributions never affect access.
- The primary entry CTA is “Start Free Audio Discovery”, naturally localized.
- The optional contribution block appears once between the four main stories
  and the seven bonus stories after every published `main` story is complete.
- Main-story artwork follows main-story order, not a monetization flag.
- `/start` and `/premium` remain redirects so old links keep working.
- One shared player is used on listening surfaces. It is compact at every
  viewport, keeps 44 × 44 px minimum controls, shows elapsed/total time, and
  hides artwork first on very narrow screens.
- Survey V1 is closed, not deleted. V2 uses a fixed anonymous template and does
  not collect email, a session identifier, listening progress, technical
  context or pricing answers.
- Survey V2 is offered after the three introduction and four main stories.
- Analytics and survey submissions are retained for 12 months. Email signups
  remain until unsubscribe or a deletion request.
- Test email, biographies, controller identity and IBAN remain unchanged by
  explicit product decision, so the build is not ready for public banking use.

## Release sequence

1. Apply `supabase/migrations/202608010001_prepare_free_experience_and_feedback_v2.sql`.
2. Deploy the application and the synchronized legal text.
3. Run `supabase/post_deploy/202608010001_publish_feedback_v2.sql`.
4. Verify playback of all 14 stories, the contribution transition, V2 payload,
   admin aggregates/CSV and the retention function.
5. Take a database backup and observe the release for at least 24 hours.
6. Run the legacy-column cleanup script in `supabase/post_deploy`.

## Before public launch

- Replace all explicitly retained test identity, contact and banking details.
- Review Privacy Policy, Terms and bank-transfer wording with the final operator.
- Add suitable rate limiting/bot protection for anonymous submissions.
- Test iOS Safari and Android Chrome with real audio at 320, 390 and 430 px.
- Add automated browser coverage for free playback, contribution placement,
  conditional survey validation and admin V1/V2 reporting.
