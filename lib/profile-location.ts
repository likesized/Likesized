export type ProfileLocation = { city: string | null; state_region: string | null };

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
] as const;

function alias(value: string) {
  return value.trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ");
}

const STATE_CODE_BY_ALIAS = new Map<string, string>();
for (const [code, name] of US_STATES) {
  STATE_CODE_BY_ALIAS.set(alias(code), code);
  STATE_CODE_BY_ALIAS.set(alias(name), code);
}
STATE_CODE_BY_ALIAS.set("washington dc", "DC");
STATE_CODE_BY_ALIAS.set("district columbia", "DC");

export function normalizeProfileLocation(cityRaw: string, stateRaw: string): ProfileLocation | null {
  const city = cityRaw.trim().replace(/\s+/g, " ");
  const stateInput = alias(stateRaw);
  if (!city && !stateInput) return { city: null, state_region: null };
  if (!city || !stateInput || city.length > 80) return null;
  const stateCode = STATE_CODE_BY_ALIAS.get(stateInput);
  if (!stateCode) return null;
  return { city, state_region: stateCode };
}
