export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryId: string | null;
  gender: string | null;
  color: string | null;
  material: string | null;
  designType: string | null;
  style: string | null;
  length: string | null;
  sleeveLength: string | null;
  fit: string | null;
  composition: string | null;
  details: string | null;
  fabricElasticity: string | null;
  ageGroup: string | null;
  salesCount: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  stock: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  } | null;
  variant: ProductVariant | null;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string | null;
  status: string;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  gender: string | null;
  position: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  gender: string | null;
  price: number;
  salesCount: number;
  image: string | null;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
  gender: string | null;
}
