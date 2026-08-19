# LikeSized V1

Working prototype for **LikeSized — See what fits people built like you.**

## What is implemented
- Responsive landing page
- Supabase email/password auth integration with SSR cookie sessions
- Protected app routes backed by verified Supabase JWT claims
- Hosted LikeSized PostgreSQL schema with privacy-first RLS
- Private Fit Profile save/edit flow with server validation
- Live People My Size matching for Overall, Tops, and Bottoms
- Safe server/database match scoring without exposing raw measurements
- Live Closet logging with brand, product, category, size, fit, wear count, notes, and buy-again evidence
- Private optional Closet-photo storage with per-user RLS
- Product fit evidence prototype page
- V1 product spec

Fit Profile and Closet data are persisted in Supabase. Exact body measurements and owned Closet rows are owner-only through RLS. People My Size calculates live garment-specific match percentages from the database. Fit reports are stored separately from private ownership data so product evidence can be built without exposing measurements.

## Run locally
```bash
cp .env.example .env.local
npm install
npm run dev
```
Then open `http://localhost:3000`.

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Authentication
Public routes:
- `/`
- `/login`
- `/signup`
- `/check-email`
- `/auth/*`

Everything else is protected by `proxy.ts`. Unauthenticated visitors are redirected to `/login` and returned to their requested path after successful sign-in.

Supabase SSR clients live in `lib/supabase/`. Server authorization uses `auth.getClaims()` instead of trusting an unverified cookie session.

### Required Supabase dashboard configuration
For production email confirmation, configure the Auth Site URL and allowed redirect URLs for the deployed LikeSized domain and update the **Confirm signup** email template link to:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
```

Keep `http://localhost:3000` available as a development redirect while working locally.

## Database
The canonical current-state database bootstrap is `supabase/schema.sql`. The connected LikeSized Supabase project has the V1 tables, RLS policies, signup profile trigger, separated fit reports, follows, safe match-score storage, and private match calculation functions applied.

Raw measurements live only in `fit_profiles`. Product fit evidence lives in `fit_reports`, and safe calculated similarity percentages live in `fit_matches` so People My Size and future Fit Twins do not require exposing another member's measurements.

## Storage
The canonical Closet-photo bootstrap is `supabase/storage.sql`. `closet-photos` is a private bucket with an 8 MB limit and JPEG/PNG/WebP allowlist. Storage policies restrict upload, read, update, and delete access to the authenticated user's own top-level folder.

Closet photo uploads go through a Server Action. `next.config.ts` raises the Server Action request-body cap to 9 MB so an allowed 8 MB image plus form fields can reach the storage layer.

## Key routes
- `/` — public home
- `/signup` — create account
- `/login` — sign in
- `/onboarding` — protected Fit Profile save/edit
- `/people` — protected live Overall/Tops/Bottoms matches
- `/closet` — protected live Closet
- `/closet/add` — protected Add Garment flow
- `/item/levi-541` — protected example product page

## Next build milestone
1. Replace the example product page with live product routes and fit-report evidence.
2. Calculate a recommended size and confidence from similar members' fit reports.
3. Add Fit Twins and follows on top of safe stored match scores.
4. Add Closet garment edit/remove controls.
5. Add outfit/social photo flows and moderation.

## Important product decision
Raw measurements must not be sent broadly to clients just to calculate matches. Similarity is calculated behind a controlled database function that returns scores and safe display fields only.
