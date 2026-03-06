import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { Order } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

export class OrdersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async getOrders(period = '3m'): Promise<Order[]> {
    const periodMap: Record<string, string> = {
      '3m': 'last30',
      '6m': 'months-6',
      '1y': 'year-2026',
      'all': 'archived',
    };

    let url = 'https://www.amazon.com/gp/your-account/order-history';
    const filterVal = periodMap[period];
    if (filterVal) url += `?timeFilter=${filterVal}`;

    await this.navigateTo(url);
    await this.checkAuth();
    await humanDelay(1000, 2000);

    return this.parseOrders();
  }

  async getOrderDetail(orderId: string): Promise<Order | null> {
    await this.navigateTo(`https://www.amazon.com/gp/your-account/order-details?orderID=${orderId}`);
    await this.checkAuth();
    await humanDelay(1000, 2000);

    const orders = await this.parseOrders();
    return orders[0] ?? null;
  }

  private async parseOrders(): Promise<Order[]> {
    const cards = await this.findAll(SELECTORS.orders.orderCards, 5000);
    const orders: Order[] = [];

    for (const card of cards) {
      try {
        const date = await this.getLocatorText(card, SELECTORS.orders.orderDate);
        const total = await this.getLocatorText(card, SELECTORS.orders.orderTotal);
        const orderId = await this.getLocatorText(card, SELECTORS.orders.orderId);
        const status = await this.getLocatorText(card, SELECTORS.orders.orderStatus);

        if (!orderId) continue;

        const itemTitles = card.locator(SELECTORS.orders.orderItemTitle[0]);
        const count = await itemTitles.count();
        const items = [];
        for (let i = 0; i < count; i++) {
          const title = await itemTitles.nth(i).textContent();
          if (title) {
            items.push({
              title: title.trim(),
              asin: null,
              price: null,
              quantity: 1,
              imageUrl: null,
            });
          }
        }

        orders.push({
          orderId: orderId.trim(),
          date: date?.trim() ?? '',
          total: this.parsePrice(total),
          status: status?.trim() ?? 'Unknown',
          items,
        });
      } catch {
        continue;
      }
    }

    return orders;
  }

  private async getLocatorText(parent: import('playwright').Locator, chain: readonly string[]): Promise<string | null> {
    for (const sel of chain) {
      try {
        const text = await parent.locator(sel).first().textContent({ timeout: 1000 });
        if (text) return text.trim();
      } catch {
        continue;
      }
    }
    return null;
  }
}
