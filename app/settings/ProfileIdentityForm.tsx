"use client";

import { useState } from "react";
import { saveProfileSettings } from "@/app/settings/actions";
import styles from "@/app/settings/settings.module.css";

type ProfileIdentityFormProps = {
  displayName: string;
  bio: string;
};

export function ProfileIdentityForm({ displayName, bio }: ProfileIdentityFormProps) {
  const [bioValue, setBioValue] = useState(bio);

  return (
    <form className={`fitForm ${styles.profileForm}`} action={saveProfileSettings}>
      <label>
        Display name <span className="muted inlineMuted">optional</span>
        <div>
          <input
            name="display_name"
            defaultValue={displayName}
            maxLength={80}
            placeholder="Name shown on your profile"
          />
        </div>
      </label>

      <label>
        <span className={styles.bioLabelRow}>
          <span>Bio <span className="muted inlineMuted">optional</span></span>
          <span className={styles.characterCount}>{bioValue.length} / 300</span>
        </span>
        <textarea
          name="bio"
          value={bioValue}
          onChange={(event) => setBioValue(event.target.value)}
          maxLength={300}
          rows={4}
          placeholder="A short profile bio"
        />
      </label>

      <button type="submit" className="primaryButton">Save profile settings</button>
    </form>
  );
}
