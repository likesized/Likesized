# LikeSized V1

Working prototype for **LikeSized — See what fits people built like you.**

## What is implemented
- Responsive landing page
- Supabase email/password auth integration with SSR cookie sessions
- Protected app routes backed by verified Supabase JWT claims
- Hosted LikeSized PostgreSQL schema with privacy-first RLS and least-privilege Data API grants
- Private Fit Profile save/edit flow with server validation
- Live People My Size matching for Overall, Tops, and Bottoms
- Safe server/database match scoring without exposing raw measurements
- Live Closet logging with brand, product, category, size, fit, wear count, notes, and buy-again evidence
- Private optional Closet-photo storage with per-user RLS
- Live product fit pages backed by real `fit_reports`
- Similar-wearer size recommendations with evidence-sensitive confidence
- Fit Twin save/remove flow, saved Fit Twin list, and member-facing Fit Twin profiles
- V1 product spec

Fit Profile and Closet data are persisted in Supabase. Exact body measurements and owned Closet rows are owner-only through RLS. People My Size, Fit Twins, and product evidence use safe garment-specific match percentages instead of exposing another member's raw measurements.

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

The schema revokes Supabase's broad default grants from `anon` and `authenticated` before granting only the operations each table needs. RLS then controls which permitted rows are reachable.

Raw measurements live only in `fit_profiles`. Product fit evidence lives in `fit_reports`, and safe calculated similarity percentages live in `fit_matches` so People My Size, product recommendations, and Fit Twins do not require exposing another member's measurements.

## Storage
The canonical Closet-photo bootstrap is `supabase/storage.sql`. `closet-photos` is a private bucket with an 8 MB limit and JPEG/PNG/WebP allowlist. Storage policies restrict upload, read, update, and delete access to the authenticated user's own top-level folder.

Closet photo uploads go through a Server Action. `next.config.ts` raises the Server Action request-body cap to 9 MB so an allowed 8 MB image plus form fields can reach the storage layer.

## Product recommendations
Product routes use `/item/[slug]`. For the signed-in viewer, LikeSized maps the product category to the relevant match model (`tops`, `bottoms`, or `overall`), ranks product fit reports by that safe match score, and deduplicates recommendation evidence to one current report per wearer.

`lib/recommendation.ts` requires at least a 50% body match before a report influences a size recommendation. “Just right” is strongest positive evidence, “relaxed” and “snug” are weaker positive evidence, and “too small” / “too big” count against that exact size. Confidence also falls when evidence is sparse, matched wearers disagree across sizes, match quality is lower, or the winning reports are not strong fits.

## Fit Twins
In V1, a **Fit Twin is a Fit Match the user chooses to save/follow**. There is no invented fixed percentage cutoff. The current Overall/Tops/Bottoms scores remain live and can change as either member updates their Fit Profile.

`/twins` lists saved Fit Twins. `/people/[username]` is the signed-in member-facing Fit Twin profile: it can show safe match percentages plus product, size, fit, and buy-again evidence. It does not expose exact body measurements or another member's private Closet ownership data.

## Key routes
- `/` — public home
- `/signup` — create account
- `/login` — sign in
- `/onboarding` — protected Fit Profile save/edit
- `/people` — protected live Overall/Tops/Bottoms matches
- `/people/[username]` — protected member-facing Fit Twin profile
- `/twins` — protected saved Fit Twins
- `/closet` — protected live Closet
- `/closet/add` — protected Add Garment flow
- `/item/[slug]` — protected live product fit evidence and recommendation

## Next build milestone
1. Add Closet garment edit/remove controls.
2. Add outfit/social photo flows and moderation.
3. Add product/search discovery beyond direct Closet links.
4. Add profile/privacy controls before public beta.
5. Add richer garment-specific match models such as Dresses and Shoes.

## Important product decision
Raw measurements must not be sent broadly to clients just to calculate matches. Similarity is calculated behind a controlled database function that returns scores and safe display fields only.
