/**
 * Hand-maintained synonym groups for catalog search.
 *
 * Every member of a group is treated as a synonym of every other member, in
 * both directions. Searching any one of them will also match the others.
 *
 * This complements the `keywords` lists in prisma/category-data.ts, which are
 * organised *by category* and so only relate terms that share a category.
 * Relationships that cut across categories (paper/tissue, ladies/womens,
 * grey/gray) have to live here.
 *
 * Synonym matches deliberately score at half weight (see SYNONYM_FACTOR in
 * catalog-search.ts), so a literal match always outranks a synonym match.
 *
 * Maintenance notes:
 *  - Prefer single words. The query is split on whitespace before lookup, so a
 *    multi-word entry can be *matched* against product text but can never be
 *    looked up from a typed query.
 *  - Keep groups tight. Every term you add pulls in every other term in the
 *    group, so one loose entry ("green" for "sustainable") quietly broadens a
 *    lot of unrelated searches.
 *  - Word-start matching already covers plurals and simple suffixes: "mug"
 *    finds "mugs", "sneaker" finds "sneakers". Don't add those.
 *  - This cannot rescue a product whose text never mentions the concept at
 *    all. Those need better names, descriptions or tags.
 */
export const SYNONYM_GROUPS: string[][] = [
  // --- Apparel audience -----------------------------------------------------
  // The catalog labels garments "Ladies ...", "Mens ...", "Youth ...", so a
  // shopper typing "womens" or "kids" needs these to find anything.
  ["womens", "women", "ladies", "lady", "female", "womans"],
  ["mens", "men", "male", "gents", "guys"],
  ["kids", "youth", "children", "childrens", "child", "junior", "toddler"],

  // --- Garments -------------------------------------------------------------
  ["tshirt", "t-shirt", "tee", "shirt"],
  ["hoodie", "hoody", "hooded", "sweatshirt"],
  ["sweater", "jumper", "pullover"],
  ["pants", "trousers", "slacks"],
  ["sneakers", "trainers", "shoes", "kicks", "footwear"],
  ["beanie", "hat", "cap", "toque"],

  // --- Bags -----------------------------------------------------------------
  ["handbag", "pocketbook", "satchel", "purse", "bag"],
  ["tote", "shopper", "carryall"],
  ["backpack", "rucksack", "knapsack"],

  // --- Paper goods ----------------------------------------------------------
  // "toilet paper" vs "toilet tissue" was the case that prompted this file.
  ["paper", "tissue"],
  ["toilet", "bathroom", "restroom", "lavatory"],

  // --- Home & kitchen -------------------------------------------------------
  ["mug", "cup", "tumbler", "drinkware"],
  ["candle", "votive"],

  // --- Stationery -----------------------------------------------------------
  ["journal", "notebook", "diary", "planner", "sketchbook"],

  // --- Bath & beauty --------------------------------------------------------
  ["moisturizer", "moisturiser", "lotion", "cream", "balm", "salve"],
  ["fragrance", "perfume", "cologne", "scent"],
  ["cleanser", "soap", "facewash"],

  // --- Values language ------------------------------------------------------
  // Central to how this marketplace describes itself, and shoppers use these
  // words interchangeably.
  ["upcycled", "recycled", "repurposed", "reclaimed", "salvaged"],
  ["handmade", "handcrafted", "artisan", "artisanal"],
  ["sustainable", "ecofriendly", "eco-friendly"],

  // --- Spelling variants ----------------------------------------------------
  ["jewelry", "jewellery", "jewelery"],
  ["gray", "grey"],
  ["color", "colour"],
  ["organizer", "organiser"],

  // --- Services -------------------------------------------------------------
  ["class", "workshop", "lesson", "course", "session", "training"],
  ["consulting", "consultation", "consultancy", "advisory"],
  ["custom", "bespoke", "commission", "madetoorder"],
];
