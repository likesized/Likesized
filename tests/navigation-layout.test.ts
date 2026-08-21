import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");
const mobile = readFileSync(new URL("../components/MobileMenu.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../components/HeaderResponsive.module.css", import.meta.url), "utf8");

test("signed-in desktop navigation is grouped behind menus", () => {
  assert.match(header, /<summary>Discover<\/summary>/);
  assert.match(header, /<summary>My Closet<\/summary>/);
  assert.match(header, /<summary>Account<\/summary>/);
  assert.match(header, /notificationBell/);
  assert.match(header, /href="\/browse">Explore/);
  assert.match(header, /href="\/circle">My Circle/);
  assert.doesNotMatch(header, /outfits\?feed=twins/);
});

test("mobile menu keeps grouped sections and closes safely", () => {
  assert.match(mobile, />Discover<\/div>/);
  assert.match(mobile, />My Closet<\/div>/);
  assert.match(mobile, />Account<\/div>/);
  assert.match(mobile, /notificationBell/);
  assert.match(mobile, /href="\/circle"[^>]*>My Circle/);
  assert.doesNotMatch(mobile, />Notifications/);
  assert.match(mobile, /usePathname/);
  assert.match(mobile, /pointerdown/);
  assert.doesNotMatch(mobile, /outfits\?feed=twins/);
});

test("grouped navigation styles exist at desktop and mobile breakpoints", () => {
  assert.match(css, /\.desktopMenu \{[^}]*margin:0;[^}]*padding:0;[^}]*border:0;/);
  assert.match(css, /\.desktopMenuPanel/);
  assert.match(css, /\.mobileSectionLabel/);
  assert.match(css, /@media \(max-width: 900px\)/);
});
