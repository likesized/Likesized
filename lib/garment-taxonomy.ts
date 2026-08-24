export type GarmentCategoryKey = "tops" | "bottoms" | "dresses" | "outerwear" | "swimwear" | "intimates" | "sleepwear_lingerie" | "shoes";

export type ControlledOption = { value: string; label: string };
export type GarmentQuestionClassification = "variation-defining" | "descriptive-only" | "cosmetic/ignored";
export type GarmentQuestion = {
  key: string;
  label: string;
  options: readonly ControlledOption[];
  classification: GarmentQuestionClassification;
};
export type GarmentTypeDefinition = {
  key: string;
  label: string;
  category: GarmentCategoryKey;
  questions: readonly GarmentQuestion[];
};

const options = (...pairs: readonly (readonly [string, string])[]): readonly ControlledOption[] =>
  pairs.map(([value, label]) => ({ value, label }));
const variationQuestion = (key: string, label: string, values: readonly ControlledOption[]): GarmentQuestion => ({
  key,
  label,
  options: values,
  classification: "variation-defining",
});

export const GARMENT_CATEGORIES: ReadonlyArray<{ value: GarmentCategoryKey; label: string }> = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses & One-Pieces" },
  { value: "outerwear", label: "Outerwear" },
  { value: "swimwear", label: "Swimwear" },
  { value: "intimates", label: "Intimates" },
  { value: "sleepwear_lingerie", label: "Sleepwear & Lingerie" },
  { value: "shoes", label: "Shoes" },
];

export const COLOR_FAMILIES = options(
  ["black", "Black"], ["white", "White"], ["gray", "Gray"], ["silver", "Silver"],
  ["brown", "Brown"], ["tan_beige", "Tan / Beige"], ["cream_ivory", "Cream / Ivory"],
  ["red", "Red"], ["orange", "Orange"], ["yellow", "Yellow"], ["green", "Green"],
  ["blue", "Blue"], ["purple", "Purple"], ["pink", "Pink"], ["gold", "Gold"],
  ["multicolor", "Multicolor"],
);

const YES_NO = options(["yes", "Yes"], ["no", "No"]);
const SLEEVE_STANDARD = options(["short", "Short"], ["three_quarter", "3/4"], ["long", "Long"]);
const SLEEVE_WITH_NONE = options(["sleeveless", "Sleeveless"], ["short", "Short"], ["three_quarter", "3/4"], ["long", "Long"]);
const NECKLINE_FULL = options(["crew", "Crew"], ["v_neck", "V-neck"], ["scoop", "Scoop"], ["square", "Square"], ["turtleneck", "Turtleneck"]);
const CROPPED_REGULAR_LONG = options(["cropped", "Cropped"], ["regular", "Regular"], ["long", "Long"]);
const RISE = options(["low", "Low"], ["mid", "Mid"], ["high", "High"]);
const BOTTOM_LENGTH = options(["cropped", "Cropped"], ["ankle", "Ankle"], ["regular", "Regular"], ["long", "Long"]);
const HIGH_LOW = options(["high", "High"], ["low", "Low"]);
const TOP_SLEEVE = options(["strapless", "Strapless"], ["halter", "Halter"], ["sleeveless", "Sleeveless"], ["short", "Short"], ["three_quarter", "3/4"], ["long", "Long"]);
const COVERAGE = options(["minimal", "Minimal"], ["moderate", "Moderate"], ["full", "Full"]);

export const GARMENT_TYPES: readonly GarmentTypeDefinition[] = [
  { key: "t_shirt", label: "T-shirt", category: "tops", questions: [
    variationQuestion("cropped", "Cropped", YES_NO),
    variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD), variationQuestion("neckline", "Neckline", NECKLINE_FULL),
  ]},
  { key: "polo", label: "Polo", category: "tops", questions: [
    variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    variationQuestion("opening", "Opening", options(["button_placket", "Button placket"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"])),
  ]},
  { key: "dress_shirt", label: "Dress shirt", category: "tops", questions: [variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "work_shirt", label: "Work shirt", category: "tops", questions: [variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "casual_button_down", label: "Casual button-down", category: "tops", questions: [variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "flannel_shirt", label: "Flannel shirt", category: "tops", questions: [variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "blouse", label: "Blouse", category: "tops", questions: [
    variationQuestion("cropped", "Cropped", YES_NO),
    variationQuestion("sleeve_length", "Sleeve", SLEEVE_WITH_NONE),
    variationQuestion("neckline", "Neckline", options(...NECKLINE_FULL.map(({value,label}) => [value,label] as const), ["cowl", "Cowl"], ["boat", "Boat neck"])),
  ]},
  { key: "tank", label: "Tank top", category: "tops", questions: [variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("neckline", "Neckline", options(["crew", "Crew"], ["v_neck", "V-neck"], ["scoop", "Scoop"], ["square", "Square"]))]},
  { key: "camisole", label: "Camisole", category: "tops", questions: [variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("neckline", "Neckline", options(["v_neck", "V-neck"], ["scoop", "Scoop"], ["square", "Square"]))]},
  { key: "strapless_top", label: "Strapless top", category: "tops", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("cropped", "Cropped", YES_NO)]},
  { key: "halter_top", label: "Halter top", category: "tops", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "sweater", label: "Sweater", category: "tops", questions: [
    variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    variationQuestion("neck_opening", "Neck / opening", options(["crew", "Crew"], ["v_neck", "V-neck"], ["turtleneck", "Turtleneck"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"])),
  ]},
  { key: "cardigan", label: "Cardigan", category: "tops", questions: [
    variationQuestion("length_profile", "Length", CROPPED_REGULAR_LONG), variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    variationQuestion("closure", "Closure", options(["open_front", "Open-front"], ["button", "Button"], ["zip", "Zip"], ["tie", "Tie"])),
  ]},
  { key: "sweatshirt", label: "Sweatshirt", category: "tops", questions: [variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD), variationQuestion("closure", "Closure", options(["pullover", "Pullover"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"]))]},
  { key: "hoodie", label: "Hoodie", category: "tops", questions: [variationQuestion("cropped", "Cropped", YES_NO), variationQuestion("closure", "Closure", options(["pullover", "Pullover"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"]))]},

  { key: "jeans", label: "Jeans", category: "bottoms", questions: [variationQuestion("cut", "Cut", options(["skinny", "Skinny"], ["slim", "Slim"], ["straight", "Straight"], ["relaxed", "Relaxed"], ["wide", "Wide"], ["bootcut", "Bootcut"], ["flare", "Flare"])), variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "chinos", label: "Chinos", category: "bottoms", questions: [variationQuestion("cut", "Cut", options(["slim", "Slim"], ["tapered", "Tapered"], ["straight", "Straight"], ["relaxed", "Relaxed"])), variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "dress_pants", label: "Dress pants", category: "bottoms", questions: [variationQuestion("cut", "Cut", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", BOTTOM_LENGTH), variationQuestion("pleated", "Pleated", YES_NO)]},
  { key: "trousers", label: "Trousers", category: "bottoms", questions: [variationQuestion("cut", "Cut", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["relaxed", "Relaxed"])), variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", BOTTOM_LENGTH), variationQuestion("pleated", "Pleated", YES_NO)]},
  { key: "cargo_pants", label: "Cargo pants", category: "bottoms", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "shorts", label: "Shorts", category: "bottoms", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", options(["short", "Short"], ["mid", "Mid"], ["long", "Long"]))]},
  { key: "joggers", label: "Joggers", category: "bottoms", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"]))]},
  { key: "sweatpants", label: "Sweatpants", category: "bottoms", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("leg_opening", "Leg opening", options(["cuffed", "Cuffed"], ["open", "Open"]))]},
  { key: "leggings", label: "Leggings", category: "bottoms", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", options(["capri", "Capri"], ["seven_eighths", "7/8"], ["full", "Full"])), variationQuestion("leg_shape", "Leg shape", options(["fitted", "Fitted"], ["bootcut", "Bootcut"], ["flare", "Flare"]))]},
  { key: "skirt", label: "Skirt", category: "bottoms", questions: [variationQuestion("shape", "Shape", options(["straight", "Straight"], ["a_line", "A-line"], ["pencil", "Pencil"], ["full", "Full"], ["pleated", "Pleated"], ["wrap", "Wrap"])), variationQuestion("rise", "Rise", RISE), variationQuestion("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"], ["midi", "Midi"], ["maxi", "Maxi"])), variationQuestion("skort", "Skort", YES_NO)]},

  { key: "dress", label: "Dress", category: "dresses", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"], ["midi", "Midi"], ["maxi", "Maxi"])), variationQuestion("top_sleeve", "Top / sleeve", TOP_SLEEVE), variationQuestion("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "jumpsuit", label: "Jumpsuit", category: "dresses", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("leg_shape", "Leg shape", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), variationQuestion("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"])), variationQuestion("top_sleeve", "Top / sleeve", TOP_SLEEVE)]},
  { key: "romper", label: "Romper", category: "dresses", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("top_sleeve", "Top / sleeve", TOP_SLEEVE), variationQuestion("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "bodysuit", label: "Bodysuit", category: "dresses", questions: [variationQuestion("top_sleeve", "Top / sleeve", TOP_SLEEVE), variationQuestion("neckline_height", "Neckline", HIGH_LOW), variationQuestion("bottom_coverage", "Bottom coverage", options(["thong", "Thong"], ["brief", "Brief"]))]},
  { key: "overalls", label: "Overalls", category: "dresses", questions: [variationQuestion("leg_shape", "Leg shape", options(["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), variationQuestion("length_profile", "Length", options(["shorts", "Shorts"], ["cropped", "Cropped"], ["full", "Full"]))]},
  { key: "coveralls", label: "Coveralls", category: "dresses", questions: [variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD), variationQuestion("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"]))]},

  { key: "suit_jacket", label: "Suit jacket", category: "outerwear", questions: [variationQuestion("length_profile", "Length", CROPPED_REGULAR_LONG), variationQuestion("front", "Front", options(["single_breasted", "Single-breasted"], ["double_breasted", "Double-breasted"]))]},
  { key: "blazer", label: "Blazer", category: "outerwear", questions: [variationQuestion("length_profile", "Length", CROPPED_REGULAR_LONG), variationQuestion("front", "Front", options(["single_breasted", "Single-breasted"], ["double_breasted", "Double-breasted"]))]},
  { key: "jacket_coat", label: "Jacket / coat", category: "outerwear", questions: [variationQuestion("jacket_style", "Style", options(["denim", "Denim"], ["leather", "Leather"], ["bomber", "Bomber"], ["puffer", "Puffer"], ["rain", "Rain"], ["utility", "Utility"], ["trench", "Trench"], ["peacoat", "Peacoat"], ["overcoat", "Overcoat"])), variationQuestion("length_profile", "Length", options(["cropped", "Cropped"], ["waist", "Waist"], ["hip", "Hip"], ["mid_thigh", "Mid-thigh"], ["knee", "Knee"], ["long", "Long"])), variationQuestion("hooded", "Hooded", YES_NO)]},
  { key: "vest", label: "Vest", category: "outerwear", questions: [variationQuestion("vest_style", "Style", options(["puffer", "Puffer"], ["tailored", "Tailored"], ["utility", "Utility"])), variationQuestion("length_profile", "Length", CROPPED_REGULAR_LONG), variationQuestion("hooded", "Hooded", YES_NO)]},
  { key: "wrap_shawl", label: "Wrap / shawl", category: "outerwear", questions: [variationQuestion("length_profile", "Length", options(["short", "Short"], ["regular", "Regular"], ["long", "Long"])), variationQuestion("closure", "Closure", options(["open", "Open"], ["fastened", "Fastened"], ["belted", "Belted"]))]},

  { key: "one_piece_swimsuit", label: "One-piece swimsuit", category: "swimwear", questions: [variationQuestion("swim_top", "Top", options(["strapless", "Strapless"], ["halter", "Halter"], ["straps", "Straps"])), variationQuestion("neckline_height", "Neckline", HIGH_LOW), variationQuestion("leg_cut", "Leg cut", options(["low", "Low"], ["regular", "Regular"], ["high", "High"])), variationQuestion("coverage", "Coverage", COVERAGE)]},
  { key: "bikini_top", label: "Bikini top", category: "swimwear", questions: [variationQuestion("bikini_top_style", "Style", options(["bandeau", "Bandeau"], ["halter", "Halter"], ["triangle", "Triangle"], ["bra_style", "Bra-style"])), variationQuestion("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"])), variationQuestion("coverage", "Coverage", COVERAGE), variationQuestion("underwire", "Underwire", YES_NO)]},
  { key: "bikini_bottom", label: "Bikini bottom", category: "swimwear", questions: [variationQuestion("rise", "Rise", RISE), variationQuestion("coverage", "Coverage", COVERAGE), variationQuestion("leg_cut", "Leg cut", options(["low", "Low"], ["regular", "Regular"], ["high", "High"])), variationQuestion("skirted", "Skirted", YES_NO)]},
  { key: "tankini_top", label: "Tankini top", category: "swimwear", questions: [variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), variationQuestion("length_profile", "Length", CROPPED_REGULAR_LONG), variationQuestion("swim_top", "Top", options(["strapless", "Strapless"], ["halter", "Halter"], ["straps", "Straps"])), variationQuestion("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"]))]},
  { key: "swim_trunks", label: "Swim trunks", category: "swimwear", questions: [variationQuestion("length_profile", "Length", options(["short", "Short"], ["mid", "Mid"], ["long", "Long"])), variationQuestion("liner", "Liner", YES_NO)]},
  { key: "board_shorts", label: "Board shorts", category: "swimwear", questions: [variationQuestion("length_profile", "Length", options(["mid", "Mid"], ["long", "Long"])), variationQuestion("closure", "Closure", options(["pull_on", "Pull-on"], ["drawstring", "Drawstring"], ["fly", "Fly"]))]},

  { key: "bra", label: "Bra", category: "intimates", questions: [variationQuestion("bra_style", "Style", options(["t_shirt", "T-shirt"], ["balconette", "Balconette"], ["plunge", "Plunge"], ["push_up", "Push-up"], ["strapless", "Strapless"], ["minimizer", "Minimizer"])), variationQuestion("underwire", "Underwire", YES_NO), variationQuestion("padding", "Padding", options(["none", "None"], ["light", "Light"], ["padded", "Padded"])), variationQuestion("coverage", "Coverage", COVERAGE)]},
  { key: "bralette", label: "Bralette", category: "intimates", questions: [variationQuestion("bralette_style", "Style", options(["triangle", "Triangle"], ["standard", "Standard"], ["longline", "Longline"])), variationQuestion("padding", "Padding", YES_NO), variationQuestion("closure", "Closure", options(["pull_on", "Pull-on"], ["hook", "Hook"])), variationQuestion("coverage", "Coverage", COVERAGE)]},
  { key: "sports_bra", label: "Sports bra", category: "intimates", questions: [variationQuestion("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"])), variationQuestion("padding", "Padding", YES_NO), variationQuestion("closure", "Closure", options(["pull_on", "Pull-on"], ["hook", "Hook"], ["zip", "Zip"])), variationQuestion("coverage", "Coverage", COVERAGE)]},
  { key: "underwear", label: "Underwear", category: "intimates", questions: [variationQuestion("underwear_cut", "Cut", options(["brief", "Brief"], ["bikini", "Bikini"], ["hipster", "Hipster"], ["boyshort", "Boyshort"], ["thong", "Thong"], ["boxer", "Boxer"], ["boxer_brief", "Boxer brief"], ["trunk", "Trunk"])), variationQuestion("rise", "Rise", RISE), variationQuestion("coverage", "Coverage", COVERAGE)]},
  { key: "shapewear", label: "Shapewear", category: "intimates", questions: [variationQuestion("shapewear_form", "Form", options(["brief", "Brief"], ["shorts", "Shorts"], ["cami", "Cami"], ["bodysuit", "Bodysuit"])), variationQuestion("target_area", "Target area", options(["waist", "Waist"], ["hips", "Hips"], ["thighs", "Thighs"], ["full_body", "Full body"])), variationQuestion("compression", "Compression", options(["light", "Light"], ["medium", "Medium"], ["firm", "Firm"]))]},

  { key: "pajama_pants", label: "Pajama pants", category: "sleepwear_lingerie", questions: [
    variationQuestion("rise", "Rise", RISE),
    variationQuestion("length_profile", "Length", options(["cropped", "Cropped"], ["ankle", "Ankle"], ["full", "Full"], ["long", "Long"])),
    variationQuestion("waistband", "Waistband", options(["elastic", "Elastic"], ["drawstring", "Drawstring"], ["button_fly", "Button / fly"])),
  ]},
  { key: "pajama_shorts", label: "Pajama shorts", category: "sleepwear_lingerie", questions: [
    variationQuestion("rise", "Rise", RISE),
    variationQuestion("length_profile", "Length", options(["short", "Short"], ["mid", "Mid"], ["long", "Long"])),
    variationQuestion("waistband", "Waistband", options(["elastic", "Elastic"], ["drawstring", "Drawstring"], ["button_fly", "Button / fly"])),
  ]},
  { key: "pajama_set", label: "Pajama set", category: "sleepwear_lingerie", questions: [
    variationQuestion("bottom_style", "Bottom style", options(["pants", "Pants"], ["shorts", "Shorts"])),
    variationQuestion("top_sleeve", "Top sleeve", options(["sleeveless", "Sleeveless"], ["short", "Short"], ["long", "Long"])),
    variationQuestion("top_closure", "Top closure", options(["pullover", "Pullover"], ["button", "Button"], ["zip", "Zip"])),
  ]},
  { key: "nightgown", label: "Nightgown", category: "sleepwear_lingerie", questions: [
    variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["regular", "Regular"], ["flowy", "Flowy"])),
    variationQuestion("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"], ["midi", "Midi"], ["maxi", "Maxi"])),
    variationQuestion("top_sleeve", "Top / sleeve", options(["spaghetti_strap", "Spaghetti strap"], ["sleeveless", "Sleeveless"], ["short", "Short"], ["long", "Long"])),
    variationQuestion("bust_support", "Bust support", options(["none", "None"], ["light", "Light"], ["structured", "Structured"])),
  ]},
  { key: "robe", label: "Robe", category: "sleepwear_lingerie", questions: [
    variationQuestion("length_profile", "Length", options(["short", "Short"], ["knee", "Knee"], ["midi", "Midi"], ["long", "Long"])),
    variationQuestion("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    variationQuestion("closure", "Closure", options(["tie", "Tie"], ["button", "Button"], ["zip", "Zip"], ["open_front", "Open Front"])),
  ]},
  { key: "chemise", label: "Chemise", category: "sleepwear_lingerie", questions: [
    variationQuestion("shape", "Shape", options(["fitted", "Fitted"], ["regular", "Regular"], ["flowy", "Flowy"])),
    variationQuestion("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"])),
    variationQuestion("top_strap", "Top / strap", options(["spaghetti_strap", "Spaghetti strap"], ["halter", "Halter"], ["sleeveless", "Sleeveless"], ["short", "Short sleeve"])),
    variationQuestion("bust_support", "Bust support", options(["none", "None"], ["light", "Light"], ["structured", "Structured"])),
  ]},
  { key: "babydoll", label: "Babydoll", category: "sleepwear_lingerie", questions: [
    variationQuestion("bust_support", "Bust support", options(["none", "None"], ["light", "Light"], ["structured", "Structured"])),
    variationQuestion("underbust_fit", "Underbust fit", options(["loose", "Loose"], ["elastic", "Elastic"], ["fitted", "Fitted"])),
    variationQuestion("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"])),
    variationQuestion("top_strap", "Top / strap", options(["spaghetti_strap", "Spaghetti strap"], ["halter", "Halter"], ["sleeveless", "Sleeveless"], ["short", "Short sleeve"])),
  ]},
  { key: "teddy", label: "Teddy", category: "sleepwear_lingerie", questions: [
    variationQuestion("top_sleeve", "Top / sleeve", options(["strapless", "Strapless"], ["halter", "Halter"], ["sleeveless", "Sleeveless"], ["short", "Short"], ["long", "Long"])),
    variationQuestion("neckline_height", "Neckline", HIGH_LOW),
    variationQuestion("bottom_coverage", "Bottom coverage", options(["thong", "Thong"], ["brief", "Brief"], ["full", "Full"])),
    variationQuestion("closure", "Closure", options(["pull_on", "Pull-on"], ["snap", "Snap"], ["hook", "Hook"])),
  ]},
  { key: "corset_bustier", label: "Corset & bustier", category: "sleepwear_lingerie", questions: [
    variationQuestion("corset_style", "Style", options(["corset", "Corset"], ["bustier", "Bustier"], ["longline_bustier", "Longline bustier"])),
    variationQuestion("corset_structure", "Structure", options(["soft", "Soft"], ["boned", "Boned"])),
    variationQuestion("closure", "Closure", options(["lace_up", "Lace-up"], ["hook_eye", "Hook & eye"], ["front_busk", "Front busk"], ["zip", "Zip"])),
    variationQuestion("length_profile", "Length", options(["waist", "Waist"], ["hip", "Hip"], ["longline", "Longline"])),
  ]},
  { key: "costume_lingerie", label: "Costume lingerie", category: "sleepwear_lingerie", questions: [
    variationQuestion("garment_form", "Garment form", options(["one_piece", "One-piece"], ["two_piece_set", "Two-piece set"], ["multi_piece_set", "Multi-piece set"])),
    variationQuestion("lingerie_top_style", "Top style", options(["bra", "Bra"], ["bralette", "Bralette"], ["corset_bustier", "Corset or bustier"], ["cami_top", "Cami or top"], ["halter", "Halter"], ["dress_style", "Dress-style"], ["no_separate_top", "No separate top"])),
    variationQuestion("lingerie_bottom_style", "Bottom style", options(["thong", "Thong"], ["brief", "Brief"], ["shorts", "Shorts"], ["skirt", "Skirt"], ["garter_style", "Garter-style"], ["no_separate_bottom", "No separate bottom"])),
    variationQuestion("structure_support", "Structure / Support", options(["soft_stretchy", "Soft / Stretchy"], ["light_support", "Light Support"], ["structured", "Structured"], ["boned", "Boned"])),
  ]},

  { key: "sneakers", label: "Sneakers", category: "shoes", questions: [variationQuestion("shoe_height", "Height", options(["low", "Low"], ["mid", "Mid"], ["high", "High"])), variationQuestion("shoe_closure", "Closure", options(["lace", "Lace"], ["slip_on", "Slip-on"], ["hook_loop", "Hook-and-loop"]))]},
  { key: "boots", label: "Boots", category: "shoes", questions: [variationQuestion("boot_style", "Style", options(["casual", "Casual"], ["work", "Work"], ["hiking", "Hiking"], ["combat", "Combat"], ["cowboy", "Cowboy"], ["dress", "Dress"], ["rain", "Rain"], ["snow", "Snow"])), variationQuestion("boot_height", "Height", options(["ankle", "Ankle"], ["mid_calf", "Mid-calf"], ["knee", "Knee"], ["over_knee", "Over-the-knee"])), variationQuestion("heel_height", "Heel", options(["flat", "Flat"], ["low", "Low"], ["mid", "Mid"], ["high", "High"])), variationQuestion("shoe_closure", "Closure", options(["pull_on", "Pull-on"], ["zip", "Zip"], ["lace", "Lace"]))]},
  { key: "dress_shoes", label: "Dress shoes", category: "shoes", questions: [variationQuestion("dress_shoe_style", "Style", options(["oxford", "Oxford"], ["derby", "Derby"], ["monk_strap", "Monk-strap"])), variationQuestion("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "loafers", label: "Loafers", category: "shoes", questions: [variationQuestion("loafer_style", "Style", options(["penny", "Penny"], ["tassel", "Tassel"], ["bit", "Bit"])), variationQuestion("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "flats", label: "Flats", category: "shoes", questions: [variationQuestion("flat_style", "Style", options(["ballet", "Ballet"], ["mary_jane", "Mary Jane"], ["slingback", "Slingback"])), variationQuestion("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "heels", label: "Heels", category: "shoes", questions: [variationQuestion("heel_height", "Heel height", options(["low", "Low"], ["mid", "Mid"], ["high", "High"])), variationQuestion("heel_style", "Heel style", options(["block", "Block"], ["stiletto", "Stiletto"], ["wedge", "Wedge"], ["kitten", "Kitten"])), variationQuestion("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"], ["open", "Open"]))]},
  { key: "sandals", label: "Sandals", category: "shoes", questions: [variationQuestion("sandal_style", "Style", options(["flat", "Flat"], ["heeled", "Heeled"], ["platform", "Platform"])), variationQuestion("shoe_closure", "Closure", options(["slip_on", "Slip-on"], ["ankle_strap", "Ankle strap"], ["back_strap", "Back strap"]))]},
  { key: "slides", label: "Slides", category: "shoes", questions: [variationQuestion("sole", "Sole", options(["flat", "Flat"], ["platform", "Platform"]))]},
  { key: "clogs", label: "Clogs", category: "shoes", questions: [variationQuestion("heel_height", "Heel", options(["flat", "Flat"], ["low", "Low"], ["mid", "Mid"], ["high", "High"])), variationQuestion("clog_back", "Back", options(["open", "Open"], ["strap", "Strap"], ["closed", "Closed"]))]},
];

export const GARMENT_TYPE_BY_KEY = new Map(GARMENT_TYPES.map((type) => [type.key, type]));

// The current owner-audited V1 taxonomy has no descriptive-only or cosmetic structured questions.
// Size and Color live outside these Type questions and never participate in tracked variation identity.
export const GARMENT_VARIATION_DEFINITION_MAP: ReadonlyMap<string, readonly string[]> = new Map(
  GARMENT_TYPES.map((type) => [
    type.key,
    type.questions.filter((item) => item.classification === "variation-defining").map((item) => item.key),
  ]),
);

export function questionsForGarmentType(key: string): readonly GarmentQuestion[] {
  return GARMENT_TYPE_BY_KEY.get(key)?.questions ?? [];
}

export function variationQuestionsForGarmentType(key: string): readonly GarmentQuestion[] {
  return questionsForGarmentType(key).filter((item) => item.classification === "variation-defining");
}

export function isVariationDefiningGarmentQuestion(typeKey: string, questionKey: string): boolean {
  return GARMENT_VARIATION_DEFINITION_MAP.get(typeKey)?.includes(questionKey) ?? false;
}

export function isAllowedGarmentAnswer(typeKey: string, questionKey: string, optionKey: string): boolean {
  return questionsForGarmentType(typeKey).some(
    (item) => item.key === questionKey && item.options.some((option) => option.value === optionKey),
  );
}
