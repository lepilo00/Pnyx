# Bundle analysis

## Before

- Main and largest chunk: `index-BVNrzUcJ.js` — 501,519 bytes (148.36 kB gzip)
- JavaScript chunks: 50
- Chunks over 200 kB: `index-BVNrzUcJ.js`
- Vite warning: chunk larger than 500 kB
- `/start` JavaScript: approximately 543,429 uncompressed bytes
- `/start` did not request named admin or premium page chunks, but admin auth imported Supabase into the monolithic entry.

## After

- Main chunk: `index-*.js` — 308.90 kB (100.27 kB gzip)
- Largest chunk: `index-*.js` — 308.90 kB
- Shared Supabase chunk: `supabaseClient-*.js` — 200.30 kB (51.25 kB gzip)
- JavaScript chunks: 51
- Chunks over 200 kB: `index-BkFUzo6P.js`, `supabaseClient-Dzhk9jw6.js`
- `/start` JavaScript: 542,726 uncompressed bytes
- Public entry reduction: 192,610 bytes (38.4%)
- Full `/start` route reduction: approximately 703 bytes; Supabase remains required by its public story and pricing queries.
- Admin auth boundary: `ProtectedAdminRoute-*.js` — 0.94 kB
- Premium page: `PremiumPage-*.js` — 14.24 kB
- Paid listening page: `StopPage-*.js` — 37.82 kB
- Checkout/QR: `DonationQrPanel-*.js` — 27.62 kB
- Vite warning above 500 kB: removed

## Network verification

- `/start`: no admin, premium, paid listening, map, or checkout chunks.
- `/premium`: premium chunk loads; checkout/QR chunk does not load before payment intent.
- `/stop/stop-2`: paid listening chunk loads on route entry.
- `/admin` and `/admin/stops` when unauthorized: only guard, Supabase, and login chunks load; admin page chunks do not.
- `/`: no admin, premium, paid listening, or checkout chunks.
