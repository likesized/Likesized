import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";

export type ExploreFixtureProduct = {
  id: string; name: string; slug: string; category: string; garment_type_key: string;
  image_url: null; brand_id: string; brand: { name: string }; catalog_status: "verified" | "corroborated" | "provisional";
  color_family_key: string; attributes: Record<string, string>; score: number; report_count: number; wearer_id: string; size: string; fit: string; fixture: true;
};
export type ExploreFixturePerson = { id: string; username: string; display_name: string; avatar_url: null; fixture: true };
export type ExploreFixtureOutfit = { id: string; user_id: string; caption: string; photo_url: string; created_at: string; profile: { username: string; display_name: string }; fixture: true };

const PEOPLE: ExploreFixturePerson[] = [
  ["preview-alex", "alex_fits", "Alex"], ["preview-jordan", "jordan_wears", "Jordan"],
  ["preview-sam", "sam_in_denim", "Sam"], ["preview-riley", "riley_layers", "Riley"],
  ["preview-morgan", "morgan_moves", "Morgan"], ["preview-casey", "casey_styles", "Casey"],
  ["preview-taylor", "taylor_tried_it", "Taylor"], ["preview-devon", "devon_daily", "Devon"],
  ["preview-avery", "avery_finds", "Avery"], ["preview-quinn", "quinn_closet", "Quinn"],
  ["preview-cameron", "cameron_casual", "Cameron"], ["preview-drew", "drew_dresses", "Drew"],
  ["preview-parker", "parker_picks", "Parker"], ["preview-reese", "reese_repeats", "Reese"],
].map(([id, username, display_name]) => ({ id, username, display_name, avatar_url: null, fixture: true }));

const PRODUCT_SEEDS: Array<[string,string,string,string,string,Record<string,string>]> = [
  ["Levi's","541 Athletic Taper","jeans","blue","32 × 30",{cut:"straight",rise:"mid",length_profile:"regular"}],
  ["Madewell","Perfect Vintage Jean","jeans","blue","29",{cut:"straight",rise:"high",length_profile:"ankle"}],
  ["Everlane","Organic Cotton Polo","polo","green","M",{intended_fit:"regular",sleeve_length:"short",opening:"button_placket"}],
  ["Nike","Everyday T-shirt","t_shirt","white","L",{intended_fit:"regular",cropped:"no",sleeve_length:"short",neckline:"crew"}],
  ["Aritzia","Contour Crew Bodysuit","bodysuit","black","M",{top_sleeve:"long",neckline_height:"high",bottom_coverage:"thong"}],
  ["Old Navy","High-Waisted Cargo Pants","cargo_pants","tan_beige","8",{intended_fit:"relaxed",rise:"high",length_profile:"regular"}],
  ["Gap","VintageSoft Hoodie","hoodie","gray","M",{intended_fit:"oversized",cropped:"no",closure:"pullover"}],
  ["J.Crew","Boatneck Blouse","blouse","cream_ivory","6",{intended_fit:"regular",cropped:"no",sleeve_length:"three_quarter",neckline:"boat"}],
  ["Patagonia","Nano Puff Jacket","jacket_coat","blue","M",{jacket_style:"puffer",intended_fit:"regular",length_profile:"hip",hooded:"no"}],
  ["Lululemon","Align Leggings","leggings","black","8",{rise:"high",length_profile:"seven_eighths",leg_shape:"fitted"}],
  ["Free People","Coastal Cardigan","cardigan","brown","M",{intended_fit:"oversized",length_profile:"long",sleeve_length:"long",closure:"open_front"}],
  ["Banana Republic","Siena Dress","dress","red","8",{shape:"flowy",length_profile:"midi",top_sleeve:"sleeveless",neckline_height:"low"}],
  ["Athleta","Retreat Jumpsuit","jumpsuit","green","M",{shape:"flowy",leg_shape:"wide",length_profile:"full",top_sleeve:"sleeveless"}],
  ["Skims","Fits Everybody Bralette","bralette","tan_beige","M",{bralette_style:"standard",padding:"no",closure:"pull_on",coverage:"moderate"}],
  ["Aerie","Triangle Bikini Top","bikini_top","pink","M",{bikini_top_style:"triangle",support:"light",coverage:"moderate",underwire:"no"}],
  ["Birkenstock","Arizona Sandal","sandals","brown","39",{sandal_style:"flat",shoe_closure:"slip_on"}],
  ["Adidas","Samba Sneaker","sneakers","white","8",{shoe_height:"low",shoe_use:"casual",shoe_closure:"lace"}],
  ["Dr. Martens","1460 Boot","boots","black","8",{boot_style:"combat",boot_height:"ankle",heel_height:"low",shoe_closure:"lace"}],
  ["Universal Standard","Elbe Shirt","casual_button_down","blue","M",{intended_fit:"relaxed",sleeve_length:"long"}],
  ["Ralph Lauren","Cable-Knit Quarter-Zip","sweater","cream_ivory","L",{intended_fit:"regular",cropped:"no",sleeve_length:"long",neck_opening:"quarter_zip"}],
  ["Abercrombie","Sloane Tailored Pant","dress_pants","black","8",{cut:"wide",rise:"high",length_profile:"regular",pleated:"yes"}],
  ["Vuori","Performance Jogger","joggers","gray","M",{intended_fit:"regular",rise:"mid",length_profile:"full"}],
  ["Reformation","Mason Skirt","skirt","green","8",{shape:"a_line",rise:"high",length_profile:"midi",skort:"no"}],
  ["Lands' End","Chlorine Resistant Swimsuit","one_piece_swimsuit","blue","10",{swim_top:"straps",neckline_height:"high",leg_cut:"regular",coverage:"full"}],
  ["Spanx","OnCore Shapewear","shapewear","black","M",{shapewear_form:"bodysuit",target_area:"full_body",compression:"firm"}],
  ["Coach","Slingback Flat","flats","black","8",{flat_style:"slingback",toe_shape:"pointed"}],
  ["Uniqlo","AIRism Cotton T-shirt","t_shirt","blue","M",{intended_fit:"oversized",cropped:"no",sleeve_length:"short",neckline:"crew"}],
  ["American Eagle","Curvy Mom Jean","jeans","blue","10",{cut:"straight",rise:"high",length_profile:"regular"}],
  ["Champion","Reverse Weave Hoodie","hoodie","gray","L",{intended_fit:"regular",cropped:"no",closure:"pullover"}],
  ["Tommy Hilfiger","Classic Fit Polo","polo","blue","M",{intended_fit:"regular",sleeve_length:"short",opening:"button_placket"}],
  ["New Balance","574 Sneaker","sneakers","gray","9",{shoe_height:"low",shoe_use:"casual",shoe_closure:"lace"}],
  ["Mango","Pleated Midi Skirt","skirt","black","M",{shape:"a_line",rise:"high",length_profile:"midi",skort:"no"}],
  ["Outdoor Voices","CloudKnit Jogger","joggers","blue","M",{intended_fit:"relaxed",rise:"mid",length_profile:"full"}],
  ["Anthropologie","Somerset Maxi Dress","dress","green","M",{shape:"flowy",length_profile:"maxi",top_sleeve:"short",neckline_height:"low"}],
];

export const EXPLORE_FIXTURE_PEOPLE = PEOPLE;
export const EXPLORE_FIXTURE_PRODUCTS: ExploreFixtureProduct[] = PRODUCT_SEEDS.map(([brand,name,type,color,size,attributes], index) => ({
  id:`preview-product-${index+1}`, name, slug:`preview-${index+1}`, category:GARMENT_TYPE_BY_KEY.get(type)?.category ?? "tops", garment_type_key:type,
  image_url:null, brand_id:`preview-brand-${brand.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, brand:{name}, catalog_status:index%7===0?"provisional":index%4===0?"corroborated":"verified",
  color_family_key:color, attributes, score:96-(index%29), report_count:1+(index%11), wearer_id:PEOPLE[index%PEOPLE.length].id, size, fit:index%7===0?"too_big":index%5===0?"snug":"just_right", fixture:true,
}));
export const EXPLORE_FIXTURE_OUTFITS: ExploreFixtureOutfit[] = Array.from({length:16},(_,index)=>{
  const person=PEOPLE[index%PEOPLE.length];
  return {id:`preview-outfit-${index+1}`,user_id:person.id,caption:["Weekend layers","Denim that finally fits","Workday outfit","Easy travel look","Dinner outfit","Everyday basics","Rainy-day layers","Airport uniform","Coffee run","Date-night simple"][index%10],photo_url:"",created_at:new Date(Date.UTC(2026,7,27-index)).toISOString(),profile:{username:person.username,display_name:person.display_name},fixture:true};
});

export function allowExploreFixtures(requested: boolean) {
  return requested && (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development");
}
