import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ——————————————————————————————————————————————
// Users
// ——————————————————————————————————————————————

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for OAuth users
  image: text("image"),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  role: text("role", { enum: ["customer", "admin"] })
    .notNull()
    .default("customer"),
  locale: text("locale", { enum: ["pt", "en"] })
    .notNull()
    .default("pt"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// OAuth Accounts (Google, etc.)
// ——————————————————————————————————————————————

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "google", "credentials"
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Sessions
// ——————————————————————————————————————————————

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Categories (hierarchical: gender → subcategory)
// ——————————————————————————————————————————————

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: text("parent_id"),
  gender: text("gender"), // "women", "men", "boys", "girls" or null for top-level
  position: integer("position").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Products
// ——————————————————————————————————————————————

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: real("price").notNull(), // e.g. 24.99
  compareAtPrice: real("compare_at_price"), // original price for discounts
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  gender: text("gender"), // "women", "men", "boys", "girls"
  color: text("color"),
  material: text("material"),
  designType: text("design_type"),
  style: text("style"),
  length: text("length"),
  sleeveLength: text("sleeve_length"),
  fit: text("fit"),
  composition: text("composition"),
  details: text("details"),
  fabricElasticity: text("fabric_elasticity"),
  ageGroup: text("age_group"), // for children products
  salesCount: integer("sales_count").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Product Images
// ——————————————————————————————————————————————

export const productImages = sqliteTable("product_images", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").notNull().default(0),
});

// ——————————————————————————————————————————————
// Product Variants (size + stock)
// ——————————————————————————————————————————————

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
});

// ——————————————————————————————————————————————
// Addresses
// ——————————————————————————————————————————————

export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("PT"),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Cart Items
// ——————————————————————————————————————————————

export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: text("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Orders
// ——————————————————————————————————————————————

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressId: text("address_id").references(() => addresses.id),
  status: text("status", {
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
  })
    .notNull()
    .default("pending"),
  total: real("total").notNull(),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Order Items
// ——————————————————————————————————————————————

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  variantId: text("variant_id")
    .notNull()
    .references(() => productVariants.id),
  name: text("name").notNull(), // snapshot at time of purchase
  size: text("size").notNull(),
  price: real("price").notNull(), // snapshot at time of purchase
  quantity: integer("quantity").notNull(),
});

// ——————————————————————————————————————————————
// Wishlist
// ——————————————————————————————————————————————

export const wishlistItems = sqliteTable("wishlist_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Verification Codes (email MFA)
// ——————————————————————————————————————————————

// ——————————————————————————————————————————————
// Admin Chat (shared multi-admin chat with AI @luny)
// ——————————————————————————————————————————————

export const adminChatMessages = sqliteTable("admin_chat_messages", {
  id: text("id").primaryKey(),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }), // null for AI
  authorRole: text("author_role", { enum: ["admin", "ai"] }).notNull(),
  /** Snapshot of author name/image at send time (so deleted users still render). */
  authorName: text("author_name").notNull(),
  authorImage: text("author_image"),
  content: text("content").notNull(),
  /** JSON array of { name, mime, size, dataUrl } for files/images. */
  attachments: text("attachments"),
  replyTo: text("reply_to"),
  editedAt: text("edited_at"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const verificationCodes = sqliteTable("verification_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type", { enum: ["login", "register", "password_reset"] }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  expiresAt: text("expires_at").notNull(),
  pendingName: text("pending_name"),          // stored during register, used after verify
  pendingPasswordHash: text("pending_password_hash"), // stored during register, used after verify
  pendingImage: text("pending_image"),          // Google profile picture URL, stored during register
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Newsletter Subscribers (public footer widget)
// ——————————————————————————————————————————————

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  /** Preferred language for outgoing newsletters. */
  locale: text("locale", { enum: ["pt", "en"] })
    .notNull()
    .default("pt"),
  /** Soft-unsubscribe — keep row to honour opt-out, but skip sends. */
  unsubscribedAt: text("unsubscribed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Support Tickets — fed by /contact form + admin replies
// ——————————————————————————————————————————————

export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  /** Snapshot of sender contact details (form is anonymous-friendly). */
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  subject: text("subject").notNull(),
  /** Preview/initial body — kept for fast list rendering. */
  preview: text("preview").notNull(),
  status: text("status", { enum: ["open", "answered", "closed"] })
    .notNull()
    .default("open"),
  /** Admin-side unread flag (resets when admin opens the ticket). */
  unread: integer("unread", { mode: "boolean" }).notNull().default(true),
  /** Owning user, if the sender was logged in. Null for guest submissions. */
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const supportMessages = sqliteTable("support_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  /** "customer" = original sender / "admin" = admin reply. */
  authorRole: text("author_role", { enum: ["customer", "admin"] }).notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ——————————————————————————————————————————————
// Newsletter — Banned emails (anti-spam / opt-out enforcement)
// ——————————————————————————————————————————————

export const newsletterBannedEmails = sqliteTable("newsletter_banned_emails", {
  email: text("email").primaryKey(),
  reason: text("reason"),
  bannedAt: text("banned_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
