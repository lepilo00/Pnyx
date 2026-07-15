# PNYX Athens: implementation decisions and remaining work

This document records the decisions behind the current uncommitted refactor,
summarizes every changed area, and lists work that must still be completed before
the application can be treated as production-ready.

## Current scope

The application was repositioned from the generic “Democracy Walk” presentation
to the PNYX Athens product. The public experience now has a free introduction,
free and paid chapters, a donation interstitial, a premium screen, additional
content pages, a redesigned navigation menu, and a more capable admin panel.

Automated tests were deliberately deferred. Lint, TypeScript and the production
build are currently clean.

## Decisions and rationale

### Free-to-paid support interstitial

The `Support if it mattered` page appears every time a visitor moves from a free
chapter to a paid chapter. Skipping does not suppress it on the next transition.
It stops appearing only after the visitor confirms a donation or purchase in the
current browser session.

The unlock uses `sessionStorage`, not `localStorage`, because the current product
decision is to grant the honor-system unlock only for the active browser session.
This is intentionally not a verified commercial entitlement.

The support page first shows the amount choices from the approved design. QR and
bank-transfer details appear only after an amount is selected, keeping the first
screen focused and visually aligned with the reference.

### Honor-system payment

Donation and premium confirmation currently trust the visitor. This allows the
experience and SEPA QR flow to be validated before payment-provider integration,
but it does not secure paid content. The browser can inspect public stop data and
can manually alter client-side state.

This must not be presented as verified payment until server-side payment and
entitlement verification are implemented.

### Admin authorization

An authenticated Supabase user is no longer automatically an administrator.
Admin access requires `app_metadata.role = "admin"` in both the client route guard
and database RLS policies. RLS remains the authoritative protection; the client
check exists for navigation and user feedback.

### Database schema and admin operations

The schema was aligned with the current UI by adding paid/bonus stop flags and
the `app_settings` table. Public writes now have field constraints. Stop
reordering uses a PostgreSQL function so the swap is atomic instead of two
independent requests.

The admin editor targets the known `democracy-walk-pnyx` slug rather than an
arbitrary first walk. This is appropriate while the product contains one walk;
a walk selector is still needed before multi-walk support.

### Navigation and footer

The burger menu is the single navigation source. About, Privacy, Terms and
Cookies are all reachable there, so the repeated global footer was removed from
every page using `Layout`. This reduces visual noise and avoids maintaining two
sets of links.

### Loading and bundle size

Pages use route-level lazy loading and non-English locale files load on demand.
This keeps admin code and unused translations out of the initial public bundle.
The initial JavaScript bundle dropped from roughly 855 kB / 246 kB gzip to about
492 kB / 145 kB gzip.

### Demo mode

Supabase requires a valid-looking URL during client creation. When environment
variables are absent, the app uses an unreachable placeholder client and falls
back to bundled stop data. This keeps local/demo rendering available without
pretending that database-backed submissions succeeded.

## Complete summary of uncommitted changes

### Product identity and global UI

- Renamed product-facing Democracy Walk references to PNYX Athens.
- Updated document title, description and theme color in `index.html`.
- Added parchment and navy Tailwind color palettes.
- Redesigned the landing, start, stop and about experiences.
- Added a mobile burger drawer with primary navigation, language selection,
  theme switching and all legal links.
- Removed the repeated global footer after moving Cookies into the burger menu.
- Split theme context utilities to satisfy React Fast Refresh rules.
- Updated shared styles, layout spacing, stop cards and modal behavior.
- Removed the obsolete `DonationModal` implementation.

### New public pages and components

- Added `SupportPage` with the reference-inspired illustration and amount grid.
- Added `PremiumPage` for paid chapters and bonus stories.
- Added How It Works, Story and Contact pages.
- Added `DonationQrPanel` with SEPA QR generation, preset/custom amounts, manual
  transfer details and honor-system confirmation.
- Added `HowToGetThereIllustration` and `MenuDrawer`.
- Added new application routes for all of these pages.

### Walk, audio and entitlement flow

- Added `is_paid` and `is_bonus` stop semantics and fallback values.
- Added session-scoped donation/purchase entitlement state.
- Added the free-to-paid support gate and direct paid-chapter gate.
- Added premium/bonus chapter presentation.
- Added per-language intro and chapter audio handling.
- Reworked audio ownership so the full and mini players share one audio element.
- Added/expanded analytics events for support, donation and paywall interactions.

### Localization

- Expanded English, French, Spanish, German, Chinese, Greek, Slovenian, Italian,
  Croatian and Serbian content for the redesigned pages and flows.
- Added on-demand locale loading instead of bundling every translation initially.
- Fixed the missing Chinese singular star-rating key.
- Expanded the language switcher and inline drawer presentation.

### Supabase and database security

- Added `is_paid` and `is_bonus` columns to `stops`.
- Added `app_settings` and the default unlock price.
- Added useful uniqueness/index constraints for stop ordering and signup lookup.
- Made triggers, policies and seed operations safer to rerun.
- Added stricter public insert policies for signup consent/email, feedback fields
  and allowed analytics events/metadata size.
- Added public read access only for the supported unlock-price setting.
- Replaced broad authenticated-user admin policies with the `is_admin()` role
  check based on trusted JWT app metadata.
- Added atomic `swap_stop_order` RPC.
- Updated Supabase demo-mode initialization for newer client versions.

### Admin panel

- Added admin-role validation during login and protected-route navigation.
- Added auth-state subscription so expiry/sign-out is reflected immediately.
- Added paid/bonus controls, multilingual audio fields, intro audio editing and
  unlock-price editing to stop management.
- Scoped stop management to the known walk slug.
- Added visible error handling for loading, saving, publishing, deleting and
  reordering operations.
- Kept the edit form open when saving fails.
- Replaced non-atomic ordering requests with the database RPC.
- Added paywall, paid unlock and donation metrics to the dashboard.
- Made the feedback price use `app_settings` rather than a hardcoded value.
- Made signup CSV export retrieve all pages, quote fields correctly and defend
  against spreadsheet formula injection.

### Quality and performance

- Fixed all current ESLint errors in effects, theme handling and React exports.
- Improved unsupported-device initialization in compass and geolocation hooks.
- Added route-level code splitting for public and admin pages.
- Added dynamic translation chunks.
- Updated README stack versions, Node requirement, schema instructions, admin
  role setup and the current honor-system limitation.

## Required deployment steps

1. Run the updated `SUPABASE_SCHEMA.sql` in the target Supabase project.
2. Assign `app_metadata.role = "admin"` to each real administrator as described
   in `README.md`, then sign out and back in to refresh the JWT.
3. Verify that existing stop rows have the intended `is_paid`, `is_bonus` and
   `order_index` values.
4. Configure `app_settings.unlock_price_eur` with the intended launch price.
5. Set the production Supabase URL and anon key in the deployment environment.

## Must be completed before production

### Payments and paid-content security

- Choose and integrate a payment provider.
- Verify payments through a server-side webhook.
- Persist entitlements server-side and associate them with a user or secure
  purchase token.
- Stop returning paid descriptions and audio URLs to anonymous visitors.
- Move paid audio to a private Supabase Storage bucket.
- Serve paid audio through short-lived signed URLs after entitlement checks.
- Decide whether donations should unlock paid content or remain separate.

### Real production configuration

- Replace the placeholder IBAN in `src/lib/constants.ts`.
- Replace `hello@pnyx-athens.example` with the real contact inbox.
- Confirm the legal recipient name and SEPA remittance values.
- Review the final unlock price, currencies, refund policy and purchase wording.
- Confirm production domain, canonical metadata, social sharing metadata and
  favicon/brand assets.

### Abuse protection and privacy

- Add server-side rate limiting for email signup, feedback and analytics.
- Add bot protection where appropriate.
- Add unsubscribe handling and define the mailing provider/data-retention flow.
- Review GDPR/privacy/cookie copy against the actual deployed services.
- Decide whether first-party analytics needs consent in the target jurisdictions.
- Add database retention/deletion procedures for emails, feedback and analytics.

### Data and administration

- Replace the single hardcoded walk slug with an admin walk selector before
  supporting multiple walks.
- Add safer media upload/selection instead of requiring raw URLs.
- Add confirmation and operation feedback consistently across all admin actions.
- Add audit logging for content and settings changes.
- Add pagination or aggregation RPCs for large feedback/dashboard datasets.
- Introduce versioned Supabase migrations rather than relying only on one setup
  SQL file.

### Testing and delivery

- Add unit tests for entitlement, localization, QR payload and data helpers.
- Add component tests for forms, audio controls and paid/free navigation.
- Add Playwright end-to-end coverage for the public walk and admin CRUD flows.
- Add CI checks for lint, TypeScript, build, translation-key parity and tests.
- Add an error-reporting/observability service suitable for the privacy policy.
- Perform mobile Safari/Chrome testing for audio, compass, geolocation, QR and
  session behavior.
- Perform an accessibility review including keyboard focus, dialogs, contrast,
  reduced motion and screen-reader output.

### Content review

- Professionally review every translation; structural key parity does not prove
  linguistic accuracy.
- Verify historical claims, legal wording, safety text and image attribution.
- Upload final localized audio files and validate fallback behavior.
- Remove unused starter/demo assets after confirming they are not referenced.

## Current verification status

- `npm run lint`: passes.
- `npm run build`: passes.
- `npm audit --omit=dev`: no known production dependency vulnerabilities at the
  time of the review.
- Automated tests: not present yet; intentionally deferred.
