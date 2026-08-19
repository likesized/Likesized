export type GarmentMarketSegment = "mens" | "womens" | "unisex" | "kids_youth" | "unknown";
export type GarmentSizeKind = "alpha" | "numeric" | "waist_inseam" | "dress_shirt" | "jacket" | "bra" | "shoe" | "length_designation" | "freeform";
export type ClosetVisibility = "private" | "shared";
export type EvidenceLevel = "exact_variant" | "exact_product" | "product_family" | "similar_garments" | "brand_garment_type" | "category_fit";
export type MeasurementUnit = "in" | "cm" | "lb" | "kg";
export type UnitSystem = "imperial" | "metric";
export type HistoricalFitMatch = { fit_report_id: string; historical_match_score: number; historical_coverage_percent: number };

export const GARMENT_MARKET_SEGMENTS: ReadonlyArray<{ value: GarmentMarketSegment; label: string }> = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
  { value: "kids_youth", label: "Kids / youth" },
  { value: "unknown", label: "Unknown / not specified" },
];

export const SIZE_KINDS: ReadonlyArray<{ value: GarmentSizeKind; label: string }> = [
  { value: "alpha", label: "Letter size (S / M / L)" },
  { value: "numeric", label: "Numeric size" },
  { value: "waist_inseam", label: "Waist × inseam" },
  { value: "dress_shirt", label: "Dress / work shirt" },
  { value: "jacket", label: "Suit / jacket" },
  { value: "bra", label: "Bra" },
  { value: "shoe", label: "Shoe" },
  { value: "length_designation", label: "Petite / regular / tall / length" },
  { value: "freeform", label: "Other manufacturer size" },
];

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  exact_variant: "Exact Variant",
  exact_product: "Exact Product",
  product_family: "Product Family",
  similar_garments: "Similar Garments",
  brand_garment_type: "Brand + Garment Type",
  category_fit: "Category Fit",
};

export const CORE_MEASUREMENT_KEYS = [
  "height",
  "weight",
  "chest_circumference",
  "full_bust",
  "natural_waist",
  "full_hip_seat",
  "inseam",
  "shoulder_width",
  "torso_body_length",
] as const;
