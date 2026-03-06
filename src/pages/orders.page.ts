import type { Page, Locator } from 'playwright';
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
      '1y': `year-${new Date().getFullYear()}`,
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
    await this.navigateToOrderDetail(orderId);

    const date = await this.getText(SELECTORS.orders.detailDate, 3000);
    const total = await this.getText(SELECTORS.orders.detailTotal, 3000);
    const status = await this.getText(SELECTORS.orders.orderStatus, 3000);

    const items = await this.parseItemTitles(this.page.locator('body'));
    const trackingUrl = await this.extractTrackingUrl(this.page.locator('body'));
    const estimatedDelivery = await this.getText(SELECTORS.orders.detailDeliveryEta, 3000);

    return {
      orderId,
      date: date ?? '',
      total: this.parsePrice(total),
      status: status ?? 'Unknown',
      items,
      trackingUrl,
      estimatedDelivery,
    };
  }

  async getOrderItems(orderId: string): Promise<{ title: string; asin: string | null }[]> {
    await this.navigateToOrderDetail(orderId);

    const items: { title: string; asin: string | null }[] = [];
    const links = this.page.locator(SELECTORS.orders.productLinks.join(', '));
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      try {
        const href = await links.nth(i).getAttribute('href');
        const text = await links.nth(i).textContent({ timeout: 1000 });
        if (!href || !text || text.trim().length < 3) continue;
        if (text.trim().startsWith('View') || text.trim().startsWith('Write')) continue;

        const dpMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        const gpMatch = href.match(/\/gp\/product\/([A-Z0-9]{10})/);
        const asin = dpMatch?.[1] ?? gpMatch?.[1] ?? null;

        // Avoid duplicates
        if (asin && items.some((item) => item.asin === asin)) continue;

        items.push({ title: text.trim(), asin });
      } catch {
        continue;
      }
    }

    return items;
  }

  private async navigateToOrderDetail(orderId: string): Promise<void> {
    await this.navigateTo(`https://www.amazon.com/gp/your-account/order-details?orderID=${orderId}`);
    await this.checkAuth();
    await humanDelay(1000, 2000);
  }

  private async parseOrders(): Promise<Order[]> {
    const cards = await this.findAll(SELECTORS.orders.orderCards, 5000);
    const orders: Order[] = [];

    for (const card of cards) {
      try {
        const orderId = await this.getChildText(card, SELECTORS.orders.orderId);
        if (!orderId) continue;

        // Date and total are in the order-header columns
        const headerValues = card.locator(SELECTORS.orders.headerValues[0]);
        const headerCount = await headerValues.count();

        let date: string | null = null;
        let total: string | null = null;

        if (headerCount >= 1) {
          date = (await headerValues.nth(0).textContent({ timeout: 1000 }).catch(() => null))?.trim() ?? null;
        }
        if (headerCount >= 2) {
          total = (await headerValues.nth(1).textContent({ timeout: 1000 }).catch(() => null))?.trim() ?? null;
        }

        const status = await this.getChildText(card, SELECTORS.orders.orderStatus);
        const items = await this.parseItemTitles(card);
        const trackingUrl = await this.extractTrackingUrl(card);
        const estimatedDelivery = await this.getChildText(card, SELECTORS.orders.estimatedDelivery);

        orders.push({
          orderId: orderId.trim(),
          date: date ?? '',
          total: this.parsePrice(total),
          status: status ?? 'Unknown',
          items,
          trackingUrl,
          estimatedDelivery,
        });
      } catch {
        continue;
      }
    }

    return orders;
  }

  private async extractTrackingUrl(container: Locator): Promise<string | null> {
    const trackingLink = container.locator(SELECTORS.orders.trackingLink.join(', ')).first();
    if ((await trackingLink.count()) > 0) {
      const href = await trackingLink.getAttribute('href').catch(() => null);
      if (href) {
        return href.startsWith('http') ? href : `https://www.amazon.com${href}`;
      }
    }
    return null;
  }

  private async parseItemTitles(container: Locator) {
    const items = [];
    for (const sel of SELECTORS.orders.orderItemTitle) {
      const elements = container.locator(sel);
      const count = await elements.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const title = await elements.nth(i).textContent({ timeout: 1000 }).catch(() => null);
          if (title && title.trim().length > 2 && !title.trim().startsWith('View')) {
            items.push({
              title: title.trim(),
              asin: null,
              price: null,
              quantity: 1,
              imageUrl: null,
            });
          }
        }
        if (items.length > 0) break;
      }
    }
    return items;
  }
}
