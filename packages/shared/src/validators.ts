import { z } from "zod";
import { LOCALES, PRODUCT_SIZES, ORDER_STATUS } from "./constants";

// ——— Auth ———
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ——— Products ———
export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  size: z.enum(PRODUCT_SIZES).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductFilter = z.infer<typeof productFilterSchema>;

// ——— Cart ———
export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  size: z.enum(PRODUCT_SIZES),
  quantity: z.number().int().min(1).max(10),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

// ——— Contact ———
export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
  turnstileToken: z.string().min(1),
});
export type ContactInput = z.infer<typeof contactSchema>;
