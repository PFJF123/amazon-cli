export interface Product {
  asin: string;
  title: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  isPrime: boolean;
  imageUrl: string | null;
  url: string;
}

export interface CartItem {
  asin: string;
  title: string;
  price: number | null;
  quantity: number;
  imageUrl: string | null;
}

export interface DeliverySlot {
  date: string;
  description: string;
  isFree: boolean;
  index: number;
}

export interface Order {
  orderId: string;
  date: string;
  total: number | null;
  status: string;
  items: OrderItem[];
  trackingUrl: string | null;
  estimatedDelivery: string | null;
}

export interface OrderItem {
  title: string;
  asin: string | null;
  price: number | null;
  quantity: number;
  imageUrl: string | null;
}

export interface Staple {
  asin: string;
  title: string;
  quantity: number;
  category: string;
  addedAt: string;
}
