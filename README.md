# LikeSized V1

Working prototype for **LikeSized — See what fits people built like you.**

## What is implemented
- Responsive landing page
- Supabase email/password auth integration with SSR cookie sessions
- Protected app routes backed by verified Supabase JWT claims
- Fit Profile onboarding UI
- People My Size / match cards
- Closet UI
- Product fit evidence page
- Garment-specific matching utility (`lib/fit.ts`)
- Supabase PostgreSQL starter schema with privacy-first RLS defaults
- V1 product spec

The product UI still uses mock fit/closet data. The authentication code is wired to the LikeSized Supabase project through environment variables; production Auth URL/email-template configuration and product-data persistence remain to be completed.

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

## Key routes
- `/` — public home
- `/signup` — create account
- `/login` — sign in
- `/onboarding` — protected Fit Profile
- `/people` — protected matches
- `/closet` — protected closet database
- `/item/levi-541` — protected example product page

## Next build milestone
1. Finalize and apply the canonical Supabase schema to the connected LikeSized project.
2. Persist Fit Profile onboarding.
3. Implement Add Garment / product search-or-create flow.
4. Calculate match score server-side without exposing other users' raw measurements.
5. Add photo uploads and moderation path.

## Important product decision
Raw measurements should not be sent broadly to clients just to calculate matches. For production, calculate similarity server-side or in a database function/view that returns scores and safe display fields only.
