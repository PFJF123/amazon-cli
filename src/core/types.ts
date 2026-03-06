export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

// Re-export all model types for API consumers
export type { Product, CartItem, DeliverySlot, Order, OrderItem, Staple } from '../models/product.js';
export type { CartContents } from '../pages/cart.page.js';
export type { CheckoutSummary } from '../pages/checkout.page.js';
export type { GroceryCategory, DeliveryInfo } from '../pages/grocery.page.js';
export type { GroceryStore, FulfillmentMode } from '../pages/grocery.page.js';
export type { Subscription, SnsProductInfo } from '../pages/subscribe.page.js';
export type { GroceryCheckoutSummary, GroceryDeliveryDay, GroceryDeliverySlot } from '../pages/grocery-checkout.page.js';
export type { SearchOptions } from '../pages/search.page.js';
export type { AmzConfig } from '../store/config-store.js';
export type { SessionOptions } from '../browser/session.js';
