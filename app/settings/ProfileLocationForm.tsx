"use client";

import { useState } from "react";
import { saveProfileLocationSettings } from "@/app/settings/actions";
import styles from "@/app/settings/settings.module.css";

type Props = {
  city: string;
  stateRegion: string;
};

export function ProfileLocationForm({ city, stateRegion }: Props) {
  const [cityValue, setCityValue] = useState(city);
  const [stateValue, setStateValue] = useState(stateRegion);
  const pairRequired = Boolean(cityValue || stateValue);

  return <form className={`fitForm ${styles.profileForm}`} action={saveProfileLocationSettings}>
    <div className="fieldPair">
      <label>
        City <span className="muted inlineMuted">optional</span>
        <input name="city" value={cityValue} onChange={(event)=>setCityValue(event.target.value)} maxLength={80} autoComplete="address-level2" required={pairRequired}/>
      </label>
      <label>
        State <span className="muted inlineMuted">optional</span>
        <input name="state_region" value={stateValue} onChange={(event)=>setStateValue(event.target.value)} maxLength={80} autoComplete="address-level1" required={pairRequired}/>
      </label>
    </div>
    <span className="fieldHelp">Your city and state stay private. LikeSized may use them later for anonymous regional trends and demand insights.</span>
    <button type="submit" className="primaryButton">Save location</button>
  </form>;
}
