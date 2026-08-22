export type GarmentCategoryKey = "tops" | "bottoms" | "dresses" | "outerwear" | "swimwear" | "intimates" | "shoes";

export type ControlledOption = { value: string; label: string };
export type GarmentQuestion = { key: string; label: string; options: readonly ControlledOption[] };
export type GarmentTypeDefinition = {
  key: string;
  label: string;
  category: GarmentCategoryKey;
  questions: readonly GarmentQuestion[];
};

const options = (...pairs: readonly (readonly [string, string])[]): readonly ControlledOption[] =>
  pairs.map(([value, label]) => ({ value, label }));
const question = (key: string, label: string, values: readonly ControlledOption[]): GarmentQuestion => ({ key, label, options: values });

export const GARMENT_CATEGORIES: ReadonlyArray<{ value: GarmentCategoryKey; label: string }> = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses & One-Pieces" },
  { value: "outerwear", label: "Outerwear" },
  { value: "swimwear", label: "Swimwear" },
  { value: "intimates", label: "Intimates" },
  { value: "shoes", label: "Shoes" },
];

export const COLOR_FAMILIES = options(
  ["black", "Black"], ["white", "White"], ["gray", "Gray"], ["silver", "Silver"],
  ["brown", "Brown"], ["tan_beige", "Tan / Beige"], ["cream_ivory", "Cream / Ivory"],
  ["red", "Red"], ["orange", "Orange"], ["yellow", "Yellow"], ["green", "Green"],
  ["blue", "Blue"], ["purple", "Purple"], ["pink", "Pink"], ["gold", "Gold"],
  ["multicolor", "Multicolor"],
);

const FIT_FITTED = options(["fitted", "Fitted"], ["regular", "Regular"], ["oversized", "Oversized"]);
const FIT_SLIM = options(["slim", "Slim"], ["regular", "Regular"], ["relaxed", "Relaxed"]);
const FIT_LOOSE = options(["fitted", "Fitted"], ["regular", "Regular"], ["loose", "Loose"]);
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
    question("intended_fit", "Intended fit", FIT_FITTED), question("cropped", "Cropped", YES_NO),
    question("sleeve_length", "Sleeve", SLEEVE_STANDARD), question("neckline", "Neckline", NECKLINE_FULL),
  ]},
  { key: "polo", label: "Polo", category: "tops", questions: [
    question("intended_fit", "Intended fit", FIT_SLIM), question("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    question("opening", "Opening", options(["button_placket", "Button placket"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"])),
  ]},
  { key: "dress_shirt", label: "Dress shirt", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "work_shirt", label: "Work shirt", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "casual_button_down", label: "Casual button-down", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "flannel_shirt", label: "Flannel shirt", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_FITTED), question("sleeve_length", "Sleeve", SLEEVE_STANDARD)]},
  { key: "blouse", label: "Blouse", category: "tops", questions: [
    question("intended_fit", "Intended fit", FIT_FITTED), question("cropped", "Cropped", YES_NO),
    question("sleeve_length", "Sleeve", SLEEVE_WITH_NONE),
    question("neckline", "Neckline", options(...NECKLINE_FULL.map(({value,label}) => [value,label] as const), ["cowl", "Cowl"], ["boat", "Boat neck"])),
  ]},
  { key: "tank", label: "Tank top", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_LOOSE), question("cropped", "Cropped", YES_NO), question("neckline", "Neckline", options(["crew", "Crew"], ["v_neck", "V-neck"], ["scoop", "Scoop"], ["square", "Square"]))]},
  { key: "camisole", label: "Camisole", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_LOOSE), question("cropped", "Cropped", YES_NO), question("neckline", "Neckline", options(["v_neck", "V-neck"], ["scoop", "Scoop"], ["square", "Square"]))]},
  { key: "strapless_top", label: "Strapless top", category: "tops", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("cropped", "Cropped", YES_NO)]},
  { key: "halter_top", label: "Halter top", category: "tops", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("cropped", "Cropped", YES_NO), question("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "sweater", label: "Sweater", category: "tops", questions: [
    question("intended_fit", "Intended fit", FIT_FITTED), question("cropped", "Cropped", YES_NO), question("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    question("neck_opening", "Neck / opening", options(["crew", "Crew"], ["v_neck", "V-neck"], ["turtleneck", "Turtleneck"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"])),
  ]},
  { key: "cardigan", label: "Cardigan", category: "tops", questions: [
    question("intended_fit", "Intended fit", FIT_FITTED), question("length_profile", "Length", CROPPED_REGULAR_LONG), question("sleeve_length", "Sleeve", SLEEVE_STANDARD),
    question("closure", "Closure", options(["open_front", "Open-front"], ["button", "Button"], ["zip", "Zip"], ["tie", "Tie"])),
  ]},
  { key: "sweatshirt", label: "Sweatshirt", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_FITTED), question("cropped", "Cropped", YES_NO), question("sleeve_length", "Sleeve", SLEEVE_STANDARD), question("closure", "Closure", options(["pullover", "Pullover"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"]))]},
  { key: "hoodie", label: "Hoodie", category: "tops", questions: [question("intended_fit", "Intended fit", FIT_FITTED), question("cropped", "Cropped", YES_NO), question("closure", "Closure", options(["pullover", "Pullover"], ["quarter_zip", "Quarter-zip"], ["full_zip", "Full-zip"]))]},

  { key: "jeans", label: "Jeans", category: "bottoms", questions: [question("cut", "Cut", options(["skinny", "Skinny"], ["slim", "Slim"], ["straight", "Straight"], ["relaxed", "Relaxed"], ["wide", "Wide"], ["bootcut", "Bootcut"], ["flare", "Flare"])), question("rise", "Rise", RISE), question("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "chinos", label: "Chinos", category: "bottoms", questions: [question("cut", "Cut", options(["slim", "Slim"], ["tapered", "Tapered"], ["straight", "Straight"], ["relaxed", "Relaxed"])), question("rise", "Rise", RISE), question("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "dress_pants", label: "Dress pants", category: "bottoms", questions: [question("cut", "Cut", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), question("rise", "Rise", RISE), question("length_profile", "Length", BOTTOM_LENGTH), question("pleated", "Pleated", YES_NO)]},
  { key: "trousers", label: "Trousers", category: "bottoms", questions: [question("cut", "Cut", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["relaxed", "Relaxed"])), question("rise", "Rise", RISE), question("length_profile", "Length", BOTTOM_LENGTH), question("pleated", "Pleated", YES_NO)]},
  { key: "cargo_pants", label: "Cargo pants", category: "bottoms", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("rise", "Rise", RISE), question("length_profile", "Length", BOTTOM_LENGTH)]},
  { key: "shorts", label: "Shorts", category: "bottoms", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("rise", "Rise", RISE), question("length_profile", "Length", options(["short", "Short"], ["mid", "Mid"], ["long", "Long"]))]},
  { key: "joggers", label: "Joggers", category: "bottoms", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("rise", "Rise", RISE), question("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"]))]},
  { key: "sweatpants", label: "Sweatpants", category: "bottoms", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("rise", "Rise", RISE), question("leg_opening", "Leg opening", options(["cuffed", "Cuffed"], ["open", "Open"]))]},
  { key: "leggings", label: "Leggings", category: "bottoms", questions: [question("rise", "Rise", RISE), question("length_profile", "Length", options(["capri", "Capri"], ["seven_eighths", "7/8"], ["full", "Full"])), question("leg_shape", "Leg shape", options(["fitted", "Fitted"], ["bootcut", "Bootcut"], ["flare", "Flare"]))]},
  { key: "skirt", label: "Skirt", category: "bottoms", questions: [question("shape", "Shape", options(["straight", "Straight"], ["a_line", "A-line"], ["pencil", "Pencil"], ["full", "Full"], ["pleated", "Pleated"], ["wrap", "Wrap"])), question("rise", "Rise", RISE), question("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"], ["midi", "Midi"], ["maxi", "Maxi"])), question("skort", "Skort", YES_NO)]},

  { key: "dress", label: "Dress", category: "dresses", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("length_profile", "Length", options(["mini", "Mini"], ["knee", "Knee"], ["midi", "Midi"], ["maxi", "Maxi"])), question("top_sleeve", "Top / sleeve", TOP_SLEEVE), question("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "jumpsuit", label: "Jumpsuit", category: "dresses", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("leg_shape", "Leg shape", options(["slim", "Slim"], ["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), question("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"])), question("top_sleeve", "Top / sleeve", TOP_SLEEVE)]},
  { key: "romper", label: "Romper", category: "dresses", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("top_sleeve", "Top / sleeve", TOP_SLEEVE), question("neckline_height", "Neckline", HIGH_LOW)]},
  { key: "bodysuit", label: "Bodysuit", category: "dresses", questions: [question("top_sleeve", "Top / sleeve", TOP_SLEEVE), question("neckline_height", "Neckline", HIGH_LOW), question("bottom_coverage", "Bottom coverage", options(["thong", "Thong"], ["brief", "Brief"]))]},
  { key: "overalls", label: "Overalls", category: "dresses", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("leg_shape", "Leg shape", options(["straight", "Straight"], ["wide", "Wide"], ["flare", "Flare"])), question("length_profile", "Length", options(["shorts", "Shorts"], ["cropped", "Cropped"], ["full", "Full"]))]},
  { key: "coveralls", label: "Coveralls", category: "dresses", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("sleeve_length", "Sleeve", SLEEVE_STANDARD), question("length_profile", "Length", options(["cropped", "Cropped"], ["full", "Full"]))]},

  { key: "suit_jacket", label: "Suit jacket", category: "outerwear", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("length_profile", "Length", CROPPED_REGULAR_LONG), question("front", "Front", options(["single_breasted", "Single-breasted"], ["double_breasted", "Double-breasted"]))]},
  { key: "blazer", label: "Blazer", category: "outerwear", questions: [question("intended_fit", "Intended fit", FIT_FITTED), question("length_profile", "Length", CROPPED_REGULAR_LONG), question("front", "Front", options(["single_breasted", "Single-breasted"], ["double_breasted", "Double-breasted"]))]},
  { key: "jacket_coat", label: "Jacket / coat", category: "outerwear", questions: [question("jacket_style", "Style", options(["denim", "Denim"], ["leather", "Leather"], ["bomber", "Bomber"], ["puffer", "Puffer"], ["rain", "Rain"], ["utility", "Utility"], ["trench", "Trench"], ["peacoat", "Peacoat"], ["overcoat", "Overcoat"])), question("intended_fit", "Intended fit", FIT_FITTED), question("length_profile", "Length", options(["cropped", "Cropped"], ["waist", "Waist"], ["hip", "Hip"], ["mid_thigh", "Mid-thigh"], ["knee", "Knee"], ["long", "Long"])), question("hooded", "Hooded", YES_NO)]},
  { key: "vest", label: "Vest", category: "outerwear", questions: [question("vest_style", "Style", options(["puffer", "Puffer"], ["tailored", "Tailored"], ["utility", "Utility"])), question("intended_fit", "Intended fit", FIT_FITTED), question("length_profile", "Length", CROPPED_REGULAR_LONG), question("hooded", "Hooded", YES_NO)]},
  { key: "wrap_shawl", label: "Wrap / shawl", category: "outerwear", questions: [question("length_profile", "Length", options(["short", "Short"], ["regular", "Regular"], ["long", "Long"])), question("closure", "Closure", options(["open", "Open"], ["fastened", "Fastened"], ["belted", "Belted"]))]},

  { key: "one_piece_swimsuit", label: "One-piece swimsuit", category: "swimwear", questions: [question("swim_top", "Top", options(["strapless", "Strapless"], ["halter", "Halter"], ["straps", "Straps"])), question("neckline_height", "Neckline", HIGH_LOW), question("leg_cut", "Leg cut", options(["low", "Low"], ["regular", "Regular"], ["high", "High"])), question("coverage", "Coverage", COVERAGE)]},
  { key: "bikini_top", label: "Bikini top", category: "swimwear", questions: [question("bikini_top_style", "Style", options(["bandeau", "Bandeau"], ["halter", "Halter"], ["triangle", "Triangle"], ["bra_style", "Bra-style"])), question("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"])), question("coverage", "Coverage", COVERAGE), question("underwire", "Underwire", YES_NO)]},
  { key: "bikini_bottom", label: "Bikini bottom", category: "swimwear", questions: [question("rise", "Rise", RISE), question("coverage", "Coverage", COVERAGE), question("leg_cut", "Leg cut", options(["low", "Low"], ["regular", "Regular"], ["high", "High"])), question("skirted", "Skirted", YES_NO)]},
  { key: "tankini_top", label: "Tankini top", category: "swimwear", questions: [question("shape", "Shape", options(["fitted", "Fitted"], ["flowy", "Flowy"])), question("length_profile", "Length", CROPPED_REGULAR_LONG), question("swim_top", "Top", options(["strapless", "Strapless"], ["halter", "Halter"], ["straps", "Straps"])), question("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"]))]},
  { key: "swim_trunks", label: "Swim trunks", category: "swimwear", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("length_profile", "Length", options(["short", "Short"], ["mid", "Mid"], ["long", "Long"])), question("liner", "Liner", YES_NO)]},
  { key: "board_shorts", label: "Board shorts", category: "swimwear", questions: [question("intended_fit", "Intended fit", FIT_SLIM), question("length_profile", "Length", options(["mid", "Mid"], ["long", "Long"])), question("closure", "Closure", options(["pull_on", "Pull-on"], ["drawstring", "Drawstring"], ["fly", "Fly"]))]},

  { key: "bra", label: "Bra", category: "intimates", questions: [question("bra_style", "Style", options(["t_shirt", "T-shirt"], ["balconette", "Balconette"], ["plunge", "Plunge"], ["push_up", "Push-up"], ["strapless", "Strapless"], ["minimizer", "Minimizer"])), question("underwire", "Underwire", YES_NO), question("padding", "Padding", options(["none", "None"], ["light", "Light"], ["padded", "Padded"])), question("coverage", "Coverage", COVERAGE)]},
  { key: "bralette", label: "Bralette", category: "intimates", questions: [question("bralette_style", "Style", options(["triangle", "Triangle"], ["standard", "Standard"], ["longline", "Longline"])), question("padding", "Padding", YES_NO), question("closure", "Closure", options(["pull_on", "Pull-on"], ["hook", "Hook"])), question("coverage", "Coverage", COVERAGE)]},
  { key: "sports_bra", label: "Sports bra", category: "intimates", questions: [question("support", "Support", options(["light", "Light"], ["medium", "Medium"], ["high", "High"])), question("padding", "Padding", YES_NO), question("closure", "Closure", options(["pull_on", "Pull-on"], ["hook", "Hook"], ["zip", "Zip"])), question("coverage", "Coverage", COVERAGE)]},
  { key: "underwear", label: "Underwear", category: "intimates", questions: [question("underwear_cut", "Cut", options(["brief", "Brief"], ["bikini", "Bikini"], ["hipster", "Hipster"], ["boyshort", "Boyshort"], ["thong", "Thong"], ["boxer", "Boxer"], ["boxer_brief", "Boxer brief"], ["trunk", "Trunk"])), question("rise", "Rise", RISE), question("coverage", "Coverage", COVERAGE)]},
  { key: "shapewear", label: "Shapewear", category: "intimates", questions: [question("shapewear_form", "Form", options(["brief", "Brief"], ["shorts", "Shorts"], ["cami", "Cami"], ["bodysuit", "Bodysuit"])), question("target_area", "Target area", options(["waist", "Waist"], ["hips", "Hips"], ["thighs", "Thighs"], ["full_body", "Full body"])), question("compression", "Compression", options(["light", "Light"], ["medium", "Medium"], ["firm", "Firm"]))]},

  { key: "sneakers", label: "Sneakers", category: "shoes", questions: [question("shoe_height", "Height", options(["low", "Low"], ["mid", "Mid"], ["high", "High"])), question("shoe_use", "Use", options(["casual", "Casual"], ["running", "Running"], ["training", "Training"], ["court", "Court"])), question("shoe_closure", "Closure", options(["lace", "Lace"], ["slip_on", "Slip-on"], ["hook_loop", "Hook-and-loop"]))]},
  { key: "boots", label: "Boots", category: "shoes", questions: [question("boot_style", "Style", options(["casual", "Casual"], ["work", "Work"], ["hiking", "Hiking"], ["combat", "Combat"], ["cowboy", "Cowboy"], ["dress", "Dress"], ["rain", "Rain"], ["snow", "Snow"])), question("boot_height", "Height", options(["ankle", "Ankle"], ["mid_calf", "Mid-calf"], ["knee", "Knee"], ["over_knee", "Over-the-knee"])), question("heel_height", "Heel", options(["flat", "Flat"], ["low", "Low"], ["mid", "Mid"], ["high", "High"])), question("shoe_closure", "Closure", options(["pull_on", "Pull-on"], ["zip", "Zip"], ["lace", "Lace"]))]},
  { key: "dress_shoes", label: "Dress shoes", category: "shoes", questions: [question("dress_shoe_style", "Style", options(["oxford", "Oxford"], ["derby", "Derby"], ["monk_strap", "Monk-strap"])), question("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "loafers", label: "Loafers", category: "shoes", questions: [question("loafer_style", "Style", options(["penny", "Penny"], ["tassel", "Tassel"], ["bit", "Bit"])), question("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "flats", label: "Flats", category: "shoes", questions: [question("flat_style", "Style", options(["ballet", "Ballet"], ["mary_jane", "Mary Jane"], ["slingback", "Slingback"])), question("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"]))]},
  { key: "heels", label: "Heels", category: "shoes", questions: [question("heel_height", "Heel height", options(["low", "Low"], ["mid", "Mid"], ["high", "High"])), question("heel_style", "Heel style", options(["block", "Block"], ["stiletto", "Stiletto"], ["wedge", "Wedge"], ["kitten", "Kitten"])), question("toe_shape", "Toe", options(["round", "Round"], ["pointed", "Pointed"], ["square", "Square"], ["open", "Open"]))]},
  { key: "sandals", label: "Sandals", category: "shoes", questions: [question("sandal_style", "Style", options(["flat", "Flat"], ["heeled", "Heeled"], ["platform", "Platform"])), question("shoe_closure", "Closure", options(["slip_on", "Slip-on"], ["ankle_strap", "Ankle strap"], ["back_strap", "Back strap"]))]},
  { key: "slides", label: "Slides", category: "shoes", questions: [question("sole", "Sole", options(["flat", "Flat"], ["platform", "Platform"]))]},
  { key: "clogs", label: "Clogs", category: "shoes", questions: [question("heel_height", "Heel", options(["flat", "Flat"], ["low", "Low"], ["mid", "Mid"], ["high", "High"])), question("clog_back", "Back", options(["open", "Open"], ["strap", "Strap"], ["closed", "Closed"]))]},
];

export const GARMENT_TYPE_BY_KEY = new Map(GARMENT_TYPES.map((type) => [type.key, type]));

export function questionsForGarmentType(key: string): readonly GarmentQuestion[] {
  return GARMENT_TYPE_BY_KEY.get(key)?.questions ?? [];
}

export function isAllowedGarmentAnswer(typeKey: string, questionKey: string, optionKey: string): boolean {
  return questionsForGarmentType(typeKey).some(
    (item) => item.key === questionKey && item.options.some((option) => option.value === optionKey),
  );
}
