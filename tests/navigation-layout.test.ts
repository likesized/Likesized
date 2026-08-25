import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");
const menu = readFileSync(new URL("../components/MemberMenu.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../components/HeaderResponsive.module.css", import.meta.url), "utf8");
const fitProfilePage = readFileSync(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
const fitProfileForm = readFileSync(new URL("../app/onboarding/FitProfileForm.tsx", import.meta.url), "utf8");
const fitProfileActions = readFileSync(new URL("../app/onboarding/actions.ts", import.meta.url), "utf8");
const fitProfileHeroCss = readFileSync(new URL("../app/onboarding/FitProfileHero.module.css", import.meta.url), "utf8");
const settingsPage = readFileSync(new URL("../app/settings/page.tsx", import.meta.url), "utf8");
const settingsActions = readFileSync(new URL("../app/settings/actions.ts", import.meta.url), "utf8");
const locationForm = readFileSync(new URL("../app/settings/ProfileLocationForm.tsx", import.meta.url), "utf8");
const locationNormalizer = readFileSync(new URL("../lib/profile-location.ts", import.meta.url), "utf8");
const locationMigration = readFileSync(new URL("../supabase/migrations/20260825183000_private_profile_location_metadata.sql", import.meta.url), "utf8");
const peoplePage = readFileSync(new URL("../app/people/page.tsx", import.meta.url), "utf8");
const circlePage = readFileSync(new URL("../app/circle/page.tsx", import.meta.url), "utf8");
const searchPage = readFileSync(new URL("../app/search/page.tsx", import.meta.url), "utf8");

test("desktop and mobile share one bell and one member menu", () => {
  assert.match(header, /<MemberMenu unreadCount=/);
  assert.doesNotMatch(header, /<summary>/);
  assert.match(menu, /notificationBell/);
  assert.match(menu, />Menu<\/button>/);
  assert.equal((menu.match(/notificationBell/g) ?? []).length, 1);
});

test("single menu contains the owner-approved sections and links", () => {
  assert.match(menu, />Discover<\/div>/);
  assert.match(menu, /href="\/explore"[^>]*>Explore/);
  assert.match(menu, /href="\/people"[^>]*>People My Size/);
  assert.match(menu, /href="\/circle"[^>]*>Style Feed/);
  assert.match(menu, /href="\/likelocker"[^>]*>LikeLocker/);
  assert.match(menu, />My Closet<\/div>/);
  assert.match(menu, /href="\/closet\/add"[^>]*>Add a Garment/);
  assert.match(menu, /href="\/outfits\/new"[^>]*>Style an Outfit/);
  assert.match(menu, />Account<\/div>/);
  assert.doesNotMatch(menu, /outfits\?feed=twins/);
  assert.doesNotMatch(menu, />Notifications/);
});

test("authenticated member navigation does not eagerly prefetch every expensive destination", () => {
  const links = menu.match(/<Link[^>]+>/g) ?? [];
  assert.ok(links.length >= 10);
  for (const link of links) assert.match(link, /prefetch=\{false\}/);
});

test("shared member menu keeps close and compact layout safeguards", () => {
  assert.match(menu, /usePathname/);
  assert.match(menu, /pointerdown/);
  assert.match(css, /\.memberNav \{[^}]*display:flex/);
  assert.match(css, /\.menuPanel/);
  assert.match(css, /\.sectionLabel/);
});

test("Fit Profile gives username rules up front and keeps the mobile update hero compact", () => {
  assert.match(fitProfileHeroCss, /3–32 characters\. Letters, numbers, and underscores only — no spaces\./);
  assert.match(fitProfilePage, /heroStyles\.revisitShell/);
  assert.match(fitProfileHeroCss, /\.revisitShell \{[\s\S]*?min-height: 0;[\s\S]*?grid-template-rows: auto auto;[\s\S]*?align-content: start;/);
});

test("initial Fit Profile collects private city/state once and Settings owns later edits", () => {
  assert.match(fitProfilePage, /profile_locations/);
  assert.match(fitProfileForm, /isInitialSetup\?<><div className="fieldPair"><label>City/);
  assert.match(fitProfileForm, /name="city"/);
  assert.match(fitProfileForm, /name="state_region"/);
  assert.match(fitProfileForm, /City and state stay private and can be changed later in Settings/);
  assert.match(fitProfileActions, /if\(isInitialSetup\)[\s\S]*profile_locations/);
  assert.match(fitProfileActions, /normalizeProfileLocation/);
  assert.match(settingsPage, /ProfileLocationForm/);
  assert.match(locationForm, /Save location/);
  assert.match(locationForm, /anonymous regional trends and demand insights/);
  assert.match(settingsActions, /saveProfileLocationSettings/);
  assert.match(settingsActions, /normalizeProfileLocation/);
  assert.match(settingsActions, /profile_locations/);
  assert.match(locationNormalizer, /\["NY", "New York"\]/);
  assert.match(locationNormalizer, /STATE_CODE_BY_ALIAS/);
  assert.match(locationNormalizer, /state_region: stateCode/);
  assert.match(locationMigration, /create table public\.profile_locations/);
  assert.match(locationMigration, /profile_locations_state_region_code/);
  assert.match(locationMigration, /state_region in \(/);
  assert.match(locationMigration, /enable row level security/);
  assert.match(locationMigration, /owner reads own profile location/);
  assert.doesNotMatch(locationMigration, /grant select[^;]*to anon/);
});

test("Fit Community is a saved default with reversible social-view filters", () => {
  assert.match(fitProfileForm, />Fit Community<select/);
  assert.match(fitProfileForm, /value="men">Men<\/option>/);
  assert.match(fitProfileForm, /value="women">Women<\/option>/);
  assert.match(fitProfileForm, /value="both">Both<\/option>/);
  assert.match(fitProfileForm, /does not change your body Match %/);
  assert.match(fitProfileActions, /p_fit_community:community/);
  assert.match(settingsPage, /Save Fit Community/);
  assert.match(peoplePage, /p_fit_community:community/);
  assert.match(peoplePage, /Switching this view does not change your saved preference/);
  assert.match(circlePage, /p_fit_community:override/);
  assert.match(circlePage, /not by the garment’s Men’s or Women’s Department/);
});

test("direct Product search is global and does not require a Men or Women filter switch", () => {
  assert.match(searchPage, /supabase\.rpc\("search_catalog_products",[\s\S]*?p_query: q,[\s\S]*?p_result_limit: 24,[\s\S]*?\}\)/);
  assert.doesNotMatch(searchPage, /search_catalog_products[\s\S]{0,180}p_fit_community/);
  assert.doesNotMatch(searchPage, /search_catalog_products[\s\S]{0,180}department/);
});
