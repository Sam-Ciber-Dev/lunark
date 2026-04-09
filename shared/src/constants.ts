export const APP_NAME = "Lunark";
export const APP_VERSION = "0.1.0";

export const DEFAULT_LOCALE = "pt" as const;
export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];
