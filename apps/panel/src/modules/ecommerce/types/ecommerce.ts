export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockQty: number;
  sku: string;
  image: string;
  images?: string[];
  description: string;
  features?: string[];
  colors?: string[];
  sizes?: string[];
  status: 'published' | 'draft' | 'low_stock' | 'out_of_stock';
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  balance: number;
  totalVolume: number;
  status: 'active' | 'pending' | 'maintenance';
  icon: string;
  feePercent: number;
}

export interface RecentTransaction {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
  gateway: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  itemsCount: number;
}

export interface ProductPerformance {
  id: string;
  title: string;
  category: string;
  image: string;
  salesVolume: number;
  revenue: number;
  growth: number;
  priority: 'high' | 'medium' | 'low';
}
