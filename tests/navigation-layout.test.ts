import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");
const menu = readFileSync(new URL("../components/MemberMenu.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../components/HeaderResponsive.module.css", import.meta.url), "utf8");
const fitProfilePage = readFileSync(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
const fitProfileHeroCss = readFileSync(new URL("../app/onboarding/FitProfileHero.module.css", import.meta.url), "utf8");

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
  assert.match(menu, /href="\/circle"[^>]*>My Circle/);
  assert.match(menu, /href="\/likelocker"[^>]*>LikeLocker/);
  assert.match(menu, />My Closet<\/div>/);
  assert.match(menu, />Account<\/div>/);
  assert.doesNotMatch(menu, /outfits\?feed=twins/);
  assert.doesNotMatch(menu, />Notifications/);
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
