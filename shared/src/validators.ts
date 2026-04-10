import { z } from "zod";
import { LOCALES, PRODUCT_SIZES, ORDER_STATUS, GENDERS, COLORS, MATERIALS, DESIGN_TYPES, STYLES, LENGTHS, SLEEVE_LENGTHS, FIT_TYPES, DETAILS, FABRIC_ELASTICITY, AGE_GROUPS, SORT_OPTIONS } from "./constants";

// â€”â€”â€” Auth â€”â€”â€”
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  turnstileToken: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  turnstileToken: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// â€”â€”â€” Products â€”â€”â€”
export const productFilterSchema = z.object({
  category: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  designType: z.string().optional(),
  style: z.string().optional(),
  length: z.string().optional(),
  sleeveLength: z.string().optional(),
  fit: z.string().optional(),
  details: z.string().optional(),
  fabricElasticity: z.string().optional(),
  ageGroup: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(SORT_OPTIONS).optional().default("recommended"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  onSale: z.coerce.boolean().optional(),
});
export type ProductFilter = z.infer<typeof productFilterSchema>;

// â€”â€”â€” Cart â€”â€”â€”
export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

// â€”â€”â€” Contact â€”â€”â€”
export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
  turnstileToken: z.string().min(1),
});
export type ContactInput = z.infer<typeof contactSchema>;
