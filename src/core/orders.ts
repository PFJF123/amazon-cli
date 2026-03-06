import type { Page } from 'playwright';
import { OrdersPage } from '../pages/orders.page.js';
import { ProductPage } from '../pages/product.page.js';
import type { Order } from '../models/product.js';

export async function listOrders(page: Page, period = '3m'): Promise<Order[]> {
  const ordersPage = new OrdersPage(page);
  return ordersPage.getOrders(period);
}

export async function getOrder(page: Page, orderId: string): Promise<Order | null> {
  const ordersPage = new OrdersPage(page);
  return ordersPage.getOrderDetail(orderId);
}

export async function trackOrder(page: Page, orderId: string): Promise<{
  status: string;
  estimatedDelivery: string | null;
  trackingUrl: string | null;
} | null> {
  const ordersPage = new OrdersPage(page);
  const order = await ordersPage.getOrderDetail(orderId);
  if (!order) return null;
  return {
    status: order.status,
    estimatedDelivery: order.estimatedDelivery,
    trackingUrl: order.trackingUrl,
  };
}

export async function reorderItems(page: Page, orderId: string): Promise<{
  succeeded: number;
  failed: number;
  items: { title: string; asin: string | null }[];
}> {
  const ordersPage = new OrdersPage(page);
  const items = await ordersPage.getOrderItems(orderId);
  const reorderableItems = items.filter((i) => i.asin);

  const productPage = new ProductPage(page);
  let succeeded = 0;
  let failed = 0;

  for (const item of reorderableItems) {
    try {
      await productPage.addToCart(item.asin!);
      succeeded++;
    } catch {
      failed++;
    }
  }

  return { succeeded, failed, items };
}

export async function cancelOrder(page: Page, orderId: string): Promise<boolean> {
  const ordersPage = new OrdersPage(page);
  return ordersPage.cancelOrder(orderId);
}

export async function returnOrder(page: Page, orderId: string): Promise<boolean> {
  const ordersPage = new OrdersPage(page);
  return ordersPage.initiateReturn(orderId);
}
