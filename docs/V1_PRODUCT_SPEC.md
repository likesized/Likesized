# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized is not a generic size predictor. It is a structured real-world fit database built from actual people, actual garments, actual purchased sizes, and reported fit.

## Core V1 loop
1. Create a Fit Profile.
2. Receive body/garment match scores against other users.
3. Browse what close matches actually wear.
4. Log garments in your closet with exact size + fit result.
5. Open a product page and see the most relevant fit evidence first.
6. Follow high-confidence Fit Matches / “Fit Twins.”

## V1 screens
1. Landing / logged-in home
2. Fit Profile onboarding
3. People My Size
4. My Closet
5. Product fit page
6. Add garment flow (next implementation milestone)
7. Public profile / Fit Twin page (next implementation milestone)
8. Auth + privacy settings (before public beta)

## Matching principle
Do not rely on weight alone and do not use one universal score for every recommendation.

- Overall score: discovery / profile browsing.
- Tops score: prioritize chest/bust, shoulder width, torso length.
- Bottoms score: prioritize waist, hips, inseam.
- Dresses score: prioritize chest/bust, waist, hips, height/torso.
- Shoes: future dedicated foot/brand sizing model.

Only measurements both users have entered contribute to the score. Missing optional measurements do not automatically punish a user; instead the UI should also show confidence/coverage when needed.

## Fit labels
- Too small
- Snug
- Just right
- Relaxed
- Too big

Future: allow per-area fit reporting (waist right / thigh tight / length long) once the simple V1 has enough usage.

## Privacy
Precise body measurements are private by default. Users can choose visibility later, but match scores can be shown without exposing the raw values.

Weight is supporting data, not the main matching axis.

## Database moat
The valuable record is:
**person measurements → exact product → exact purchased size → fit result → optional photo → long-term wear / repurchase signal**

Each closet submission improves both individual recommendations and item-level aggregate data.

## V1 success metrics
- % onboarding completion
- garments logged per activated user
- % users with >= 3 garments logged
- product pages viewed per session
- match-profile follows
- “recommendation helpful” rate
- repeat visits after a Fit Match posts/logs an item

## Brand direction
Working name: **LikeSized**
Tagline: **See what fits people built like you.**
Tone: direct, useful, fashion-aware, non-judgmental, not weight-loss oriented.
Visual direction: bold editorial type, warm off-white base, black ink, purple accent, acid-lime data/high-confidence indicator.
