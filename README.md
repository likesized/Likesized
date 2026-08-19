# LikeSized V1

Working prototype for **LikeSized — See what fits people built like you.**

## What is implemented
- Responsive landing page
- Fit Profile onboarding UI
- People My Size / match cards
- Closet UI
- Product fit evidence page
- Garment-specific matching utility (`lib/fit.ts`)
- Supabase PostgreSQL starter schema with privacy-first RLS defaults
- V1 product spec

The current UI uses mock data so the product flow can be reviewed before wiring live auth/data.

## Run locally
```bash
npm install
npm run dev
```
Then open `http://localhost:3000`.

## Key routes
- `/` — home
- `/onboarding` — Fit Profile
- `/people` — matches
- `/closet` — closet database
- `/item/levi-541` — example product page

## Next build milestone
1. Create/connect Supabase project.
2. Wire authentication.
3. Run `supabase/schema.sql`.
4. Persist Fit Profile onboarding.
5. Implement Add Garment / product search-or-create flow.
6. Calculate match score server-side without exposing other users' raw measurements.
7. Add photo uploads and moderation path.

## Important product decision
Raw measurements should not be sent broadly to clients just to calculate matches. For production, calculate similarity server-side or in a database function/view that returns scores and safe display fields only.
