import { Measurements, fitMatchScore } from "./fit";

export const currentUser: Measurements = {
  heightIn: 70,
  weightLb: 194,
  chestIn: 43,
  waistIn: 35,
  hipsIn: 41,
  inseamIn: 30,
  shouldersIn: 19,
  torsoIn: 25,
};

const rawPeople = [
  { id: "p1", name: "Marcus", handle: "@marcuswears", measurements: { heightIn: 70, weightLb: 198, chestIn: 43, waistIn: 35.5, hipsIn: 41, inseamIn: 30, shouldersIn: 19, torsoIn: 25 }, style: "Workwear", item: "Carhartt Detroit Jacket", size: "L", fit: "Just right" },
  { id: "p2", name: "Drew", handle: "@drewdaily", measurements: { heightIn: 71, weightLb: 190, chestIn: 42, waistIn: 34, hipsIn: 40, inseamIn: 31, shouldersIn: 18.5, torsoIn: 25 }, style: "Casual", item: "Nike Tech Fleece Hoodie", size: "XL", fit: "Relaxed" },
  { id: "p3", name: "Andre", handle: "@andreknowsfit", measurements: { heightIn: 69, weightLb: 201, chestIn: 44, waistIn: 36, hipsIn: 42, inseamIn: 30, shouldersIn: 19.5, torsoIn: 24.5 }, style: "Streetwear", item: "Levi's 541 Athletic Taper", size: "36×30", fit: "Just right" },
  { id: "p4", name: "Cam", handle: "@camcloset", measurements: { heightIn: 72, weightLb: 186, chestIn: 41, waistIn: 33, hipsIn: 39, inseamIn: 32, shouldersIn: 18, torsoIn: 26 }, style: "Minimal", item: "Uniqlo Oversized Tee", size: "L", fit: "Relaxed" },
];

export const people = rawPeople.map((person) => ({
  ...person,
  overallMatch: fitMatchScore(currentUser, person.measurements, "overall"),
  topMatch: fitMatchScore(currentUser, person.measurements, "tops"),
  bottomMatch: fitMatchScore(currentUser, person.measurements, "bottoms"),
}));

export const closet = [
  { brand: "Levi's", item: "541 Athletic Taper", size: "36×30", fit: "Just right", category: "Bottoms", wears: 17 },
  { brand: "Carhartt", item: "Detroit Jacket", size: "L", fit: "Just right", category: "Tops", wears: 12 },
  { brand: "Nike", item: "Club Fleece Hoodie", size: "XL", fit: "Relaxed", category: "Tops", wears: 21 },
];
