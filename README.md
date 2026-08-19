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
- Closet UI
- Product fit evidence page
- V1 product spec

Fit Profile data is persisted in Supabase and exact body measurements are owner-only through RLS. People My Size now calculates live garment-specific match percentages from the database. Closet and product evidence pages still use mock presentation data until their live-data milestones are completed.

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
The canonical current-state schema is `supabase/schema.sql`. The connected LikeSized Supabase project has the V1 tables, RLS policies, signup profile trigger, separated fit reports, follows, safe match-score storage, and private match calculation functions applied.

Raw measurements live only in `fit_profiles`. Product fit evidence lives in `fit_reports`, and safe calculated similarity percentages live in `fit_matches` so People My Size and future Fit Twins do not require exposing another member's measurements.

## Key routes
- `/` — public home
- `/signup` — create account
- `/login` — sign in
- `/onboarding` — protected Fit Profile save/edit
- `/people` — protected live Overall/Tops/Bottoms matches
- `/closet` — protected closet database
- `/item/levi-541` — protected example product page

## Next build milestone
1. Implement Add Garment / product search-or-create flow and persist Closet data.
2. Persist separate fit reports for each logged garment.
3. Replace the example product page with live fit-report evidence and size recommendations.
4. Add Fit Twins and follows on top of safe stored match scores.
5. Add photo uploads and moderation path.

## Important product decision
Raw measurements must not be sent broadly to clients just to calculate matches. Similarity is calculated behind a controlled database function that returns scores and safe display fields only.
