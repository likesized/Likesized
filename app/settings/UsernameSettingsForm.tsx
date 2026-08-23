"use client";

import { useState } from "react";
import { saveUsernameSettings } from "@/app/settings/actions";
import styles from "@/app/settings/settings.module.css";

export function UsernameSettingsForm({ username }: { username: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(username);
  const changed = value !== username;

  function cancel() {
    setValue(username);
    setEditing(false);
  }

  return (
    <form className={`fitForm ${styles.usernameForm}`} action={saveUsernameSettings}>
      {editing ? <input type="hidden" name="confirm_username_change" value="1" /> : null}
      <label>
        Username
        <div>
          <input
            name="username"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_]{3,32}"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            readOnly={!editing}
            aria-readonly={!editing}
            required
          />
        </div>
        <span className="fieldHelp">3–32 letters, numbers, or underscores. Usernames must be unique. If you change yours, your previous username stays reserved to your account for 30 days.</span>
      </label>

      {!editing ? (
        <button type="button" className="secondaryButton" onClick={() => setEditing(true)}>Change username</button>
      ) : (
        <div className={styles.usernameActions}>
          <button type="submit" className="primaryButton" disabled={!changed}>Save username</button>
          <button type="button" className="secondaryButton" onClick={cancel}>Cancel</button>
        </div>
      )}
    </form>
  );
}
