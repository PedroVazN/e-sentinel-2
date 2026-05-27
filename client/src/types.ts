export interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;
  sku?: string;
  name: string;
  description: string;
  fragrance: string;
  format: string;
  netWeight: string;
  color: string;
  category: Category | string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  images: ProductImage[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  product: { _id: string; name: string; sku?: string; images?: ProductImage[] } | string;
  type: 'entrada' | 'saida' | 'ajuste' | 'fabricacao';
  quantity: number;
  reason: string;
  reference: string;
  previousStock: number;
  newStock: number;
  user: string;
  createdAt: string;
}

export interface Manufacturing {
  _id: string;
  product: { _id: string; name: string; sku?: string; images?: ProductImage[] } | string;
  quantity: number;
  batchCode: string;
  productionDate: string;
  expirationDate?: string | null;
  notes: string;
  cost: number;
  operator: string;
  createdAt: string;
}

export interface DashboardData {
  totals: {
    products: number;
    categories: number;
    stockUnits: number;
    stockValue: number;
    stockCost: number;
    lowStock: number;
    outOfStock: number;
  };
  recentMovements: StockMovement[];
  recentManufacturings: Manufacturing[];
  topProducts: Product[];
  movementsByDay: { _id: { d: string; type: string }; total: number }[];
  manufacturingByDay: { _id: string; total: number }[];
  productsByCategory: { categoryId: string; name: string; color: string; count: number; stock: number }[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderItem {
  product: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderCustomer {
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';

export interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
