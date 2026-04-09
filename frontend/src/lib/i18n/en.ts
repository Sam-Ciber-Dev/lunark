export const en = {
  // Navbar
  nav: {
    home: "Home",
    shop: "Shop",
    about: "About",
    contact: "Contact",
    cart: "Cart",
    orders: "Orders",
    admin: "Admin",
    signOut: "Sign out",
    account: "Account",
    search: "Search",
    menu: "Menu",
  },

  // Homepage
  hero: {
    badge: "New Collection",
    title: "Elevate Your Style",
    subtitle:
      "Discover curated collections of modern fashion — designed for those who dare to stand out.",
    cta: "Explore Collection",
  },
  featured: {
    title: "Featured",
    viewAll: "View all",
    empty: "New arrivals coming soon.",
  },
  values: {
    title: "The Lunark Experience",
    quality: { title: "Premium Quality", desc: "Every piece is carefully selected for fabric, fit, and finish." },
    shipping: { title: "Free Shipping", desc: "Complimentary delivery on all orders over €50." },
    returns: { title: "Easy Returns", desc: "30-day hassle-free returns on all purchases." },
  },

  // Shop
  shop: {
    title: "Shop",
    all: "All",
    searchResults: "Results for",
    noProducts: "No products found.",
    prevPage: "Previous",
    nextPage: "Next",
    pageOf: "Page {page} of {total}",
  },

  // Product detail
  product: {
    notFound: "Product not found",
    noImage: "No image",
    size: "Size",
    soldOut: "Sold out",
    addToCart: "Add to Cart",
    adding: "Adding…",
    added: "Added to cart!",
  },

  // Cart
  cart: {
    title: "Shopping Cart",
    empty: "Your cart is empty",
    startShopping: "Start Shopping",
    loginRequired: "Sign in to view your cart.",
    signIn: "Sign In",
    remove: "Remove",
    summary: "Order Summary",
    total: "Total",
    checkout: "Place Order",
    placing: "Placing order…",
    orderSuccess: "Order placed successfully!",
    viewOrders: "View Orders",
  },

  // Orders
  orders: {
    title: "My Orders",
    empty: "No orders yet.",
    order: "Order",
    status: "Status",
    total: "Total",
    date: "Date",
    items: "items",
  },

  // About
  about: {
    title: "About Lunark",
    description:
      "Lunark was born with the mission of bringing modern, accessible fashion to everyone. Each piece is selected with quality, style, and comfort in mind.",
    mission: "Our Mission",
    missionText:
      "We believe that great style shouldn't come at an unreasonable price. Lunark bridges the gap between high-end aesthetics and everyday affordability.",
    story: "Our Story",
    storyText:
      "Founded by fashion enthusiasts who were tired of choosing between style and budget, Lunark curates collections that make you feel confident without breaking the bank.",
  },

  // Contact
  contact: {
    title: "Get in Touch",
    subtitle: "Have a question or feedback? We'd love to hear from you.",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    send: "Send Message",
    sending: "Sending…",
    success: "Message sent successfully!",
  },

  // Auth
  auth: {
    login: "Sign In",
    register: "Create Account",
    email: "Email",
    password: "Password",
    name: "Name",
    loggingIn: "Signing in…",
    registering: "Creating…",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    createAccount: "Create Account",
    signIn: "Sign In",
  },

  // Footer
  footer: {
    tagline: "Elevate your style.",
    rights: "All rights reserved.",
  },

  // Admin
  admin: {
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    orders: "Orders",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders",
    totalProducts: "Total Products",
    totalCustomers: "Total Customers",
  },

  // Common
  common: {
    loading: "Loading…",
    error: "An error occurred",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    back: "Back",
  },
} as const;

// Recursive type that widens string literals to string
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Dictionary = DeepStringify<typeof en>;
