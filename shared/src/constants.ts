export const APP_NAME = "Lunark";
export const APP_VERSION = "0.2.0";

export const DEFAULT_LOCALE = "en" as const;
export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

// ——— Sizes ———
export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] as const;
export const CHILDREN_SIZES = ["0-3M", "3-6M", "6-9M", "9-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y", "12-13Y", "13-14Y", "14-15Y", "15-16Y"] as const;
export const ALL_SIZES = [...PRODUCT_SIZES, ...CHILDREN_SIZES] as const;
export type ProductSize = (typeof ALL_SIZES)[number];

// ——— Order Status ———
export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

// ——— Genders ———
export const GENDERS = ["women", "men", "boys", "girls"] as const;
export type Gender = (typeof GENDERS)[number];

// ——— Age Groups (children) ———
export const AGE_GROUPS = ["0-9months", "0-3years", "4-7years", "8-12years", "13-16years"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

// ——— Sort Options ———
export const SORT_OPTIONS = ["recommended", "popular", "newest", "price-asc", "price-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// ——— Filter: Colors ———
export const COLORS = [
  "black", "white", "red", "blue", "navy", "green", "yellow", "orange",
  "pink", "purple", "brown", "beige", "grey", "gold", "silver",
  "multicolor", "khaki", "burgundy", "coral", "teal", "mint",
  "cream", "camel", "olive", "lavender",
] as const;
export type Color = (typeof COLORS)[number];

// ——— Filter: Materials ———
export const MATERIALS = [
  "polyester", "cotton", "nylon", "viscose", "acrylic", "velvet",
  "wool", "silk", "linen", "pu-leather", "satin", "lace", "chiffon",
  "denim", "knit", "mesh", "sequin", "tweed", "corduroy", "fleece",
  "spandex", "rayon",
] as const;
export type Material = (typeof MATERIALS)[number];

// ——— Filter: Design Types ———
export const DESIGN_TYPES = [
  "solid", "printed", "floral", "geometric", "striped", "plaid",
  "animal-print", "tie-dye", "embroidered", "graphic", "abstract",
  "polka-dot", "camo", "paisley", "colorblock",
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];

// ——— Filter: Styles ———
export const STYLES = [
  "casual", "elegant", "boho", "sexy", "streetwear", "sporty",
  "basic", "classic", "vintage", "minimalist", "romantic",
  "preppy", "grunge", "formal", "resort",
] as const;
export type Style = (typeof STYLES)[number];

// ——— Filter: Garment Lengths ———
export const LENGTHS = [
  "cropped", "short", "regular", "long", "mini", "midi", "maxi",
] as const;
export type GarmentLength = (typeof LENGTHS)[number];

// ——— Filter: Sleeve Lengths ———
export const SLEEVE_LENGTHS = [
  "sleeveless", "short-sleeve", "3/4-sleeve", "long-sleeve",
  "cap-sleeve", "strapless",
] as const;
export type SleeveLength = (typeof SLEEVE_LENGTHS)[number];

// ——— Filter: Fit Types ———
export const FIT_TYPES = [
  "slim", "regular", "loose", "oversized", "skinny", "relaxed",
  "tailored", "flared",
] as const;
export type FitType = (typeof FIT_TYPES)[number];

// ——— Filter: Details ———
export const DETAILS = [
  "pockets", "buttons", "zipper", "belt", "bow", "fringes",
  "pleats", "drawstring", "lace-up", "ruffle", "cutout",
  "wrap", "slit", "hood", "collar",
] as const;
export type Detail = (typeof DETAILS)[number];

// ——— Filter: Fabric Elasticity ———
export const FABRIC_ELASTICITY = [
  "no-stretch", "slight-stretch", "medium-stretch", "high-stretch",
] as const;
export type FabricElasticity = (typeof FABRIC_ELASTICITY)[number];

// ——— Women Subcategories ———
export const WOMEN_SUBCATEGORIES = [
  "blouses", "tops", "mini-dresses", "long-dresses", "jumpsuits",
  "suits", "beachwear", "hoodies-sweatshirts", "wedding",
  "maternity", "party", "outerwear", "jeans", "bottoms",
  "sets", "skirts", "knitwear", "lingerie", "sleepwear",
  "activewear", "t-shirts",
] as const;

// ——— Men Subcategories ———
export const MEN_SUBCATEGORIES = [
  "tops", "sets", "bottoms", "jeans", "suits-blazers",
  "swimwear", "plus-size", "hoodies-sweatshirts", "knitwear",
  "outerwear", "underwear", "sleepwear", "t-shirts",
  "activewear", "shirts",
] as const;

// ——— Children Subcategories ———
export const CHILDREN_SUBCATEGORIES = [
  "tops", "bottoms", "dresses", "sets", "outerwear",
  "swimwear", "sleepwear", "activewear", "jeans", "t-shirts",
  "hoodies-sweatshirts", "knitwear", "uniforms",
] as const;

// ——— Currencies ———
export const CURRENCIES = {
  EUR: { symbol: "€", rate: 1, name: "Euro" },
  USD: { symbol: "$", rate: 1.08, name: "US Dollar" },
  GBP: { symbol: "£", rate: 0.86, name: "British Pound" },
  BRL: { symbol: "R$", rate: 5.42, name: "Brazilian Real" },
  CHF: { symbol: "CHF", rate: 0.97, name: "Swiss Franc" },
  CAD: { symbol: "CA$", rate: 1.47, name: "Canadian Dollar" },
  AUD: { symbol: "A$", rate: 1.65, name: "Australian Dollar" },
  JPY: { symbol: "¥", rate: 163.5, name: "Japanese Yen" },
  CNY: { symbol: "¥", rate: 7.82, name: "Chinese Yuan" },
  INR: { symbol: "₹", rate: 90.5, name: "Indian Rupee" },
  KRW: { symbol: "₩", rate: 1420, name: "South Korean Won" },
  SEK: { symbol: "kr", rate: 11.2, name: "Swedish Krona" },
  NOK: { symbol: "kr", rate: 11.5, name: "Norwegian Krone" },
  DKK: { symbol: "kr", rate: 7.46, name: "Danish Krone" },
  PLN: { symbol: "zł", rate: 4.32, name: "Polish Zloty" },
  CZK: { symbol: "Kč", rate: 25.3, name: "Czech Koruna" },
  HUF: { symbol: "Ft", rate: 392, name: "Hungarian Forint" },
  RON: { symbol: "lei", rate: 4.97, name: "Romanian Leu" },
  TRY: { symbol: "₺", rate: 34.8, name: "Turkish Lira" },
  MXN: { symbol: "MX$", rate: 18.5, name: "Mexican Peso" },
  ARS: { symbol: "AR$", rate: 920, name: "Argentine Peso" },
  ZAR: { symbol: "R", rate: 19.8, name: "South African Rand" },
  THB: { symbol: "฿", rate: 37.5, name: "Thai Baht" },
  SGD: { symbol: "S$", rate: 1.45, name: "Singapore Dollar" },
  NZD: { symbol: "NZ$", rate: 1.78, name: "New Zealand Dollar" },
} as const;
export type CurrencyCode = keyof typeof CURRENCIES;
