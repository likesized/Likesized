import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page=fs.readFileSync("app/settings/page.tsx","utf8");
const form=fs.readFileSync("app/settings/ProfileSettingsForm.tsx","utf8");
const actions=fs.readFileSync("app/settings/actions.ts","utf8");
const css=fs.readFileSync("app/settings/settings.module.css","utf8");
const location=fs.readFileSync("lib/profile-location.ts","utf8");

test("Settings uses one consolidated profile editor with independent username changes",()=>{
  assert.match(page,/ProfileSettingsForm/);
  assert.doesNotMatch(page,/ProfileIdentityForm|ProfileLocationForm|ProfilePhotoForm|UsernameSettingsForm/);
  assert.match(form,/Edit My Profile/);
  assert.match(form,/Edit Profile/);
  assert.match(form,/Save Changes/);
  assert.match(form,/Change username/);
  assert.match(form,/can be changed once every 30 days/);
  assert.doesNotMatch(form,/>Locked</);
});

test("City and state are required private profile fields",()=>{
  assert.match(form,/name="city"[\s\S]*required/);
  assert.match(form,/name="state_region"[\s\S]*required/);
  assert.match(form,/City and state stay private\./);
  assert.doesNotMatch(form,/regional trends|demand insights|optional/i);
  assert.match(location,/if \(!city \|\| !stateInput/);
});

test("Profile fields save together while username keeps its canonical cooldown action",()=>{
  assert.match(actions,/saveUnifiedProfileSettings/);
  assert.match(actions,/saveUsernameSettings/);
  assert.match(actions,/get_username_change_status/);
  assert.doesNotMatch(actions,/saveProfileLocationSettings|saveFitCommunitySettings|saveProfilePhoto|removeProfilePhoto/);
});

test("Settings presentation stays restrained",()=>{
  assert.match(css,/\.profileCard\{display:grid;padding:20px;border:1px solid var\(--line\);border-radius:var\(--radius-md\)/);
  assert.match(css,/\.settingsHeader h1\{[^}]*font-size:clamp\(28px,4vw,36px\)/);
  assert.doesNotMatch(css,/border-radius:24px/);
  assert.doesNotMatch(css,/\.profileCard\{[^}]*padding:30px/);
});
