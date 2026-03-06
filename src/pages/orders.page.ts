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
    await this.navigateTo(`https://www.amazon.com/gp/your-account/order-details?orderID=${orderId}`);
    await this.checkAuth();
    await humanDelay(1000, 2000);

    // On detail page, parse differently - look for items in the detail layout
    const date = await this.getText(['.order-date-invoice-item span.a-color-secondary', '.order-info .value'] as string[], 3000);
    const total = await this.getText(['#od-subtotals .a-text-right .a-color-base', '.order-summary-total .a-color-price'] as string[], 3000);
    const status = await this.getText(SELECTORS.orders.orderStatus, 3000);

    const items = await this.parseItemTitles(this.page.locator('body'));

    // Extract tracking link
    const trackingLink = this.page.locator('a[href*="track"], a:has-text("Track package")').first();
    let trackingUrl: string | null = null;
    if ((await trackingLink.count()) > 0) {
      const href = await trackingLink.getAttribute('href').catch(() => null);
      if (href) {
        trackingUrl = href.startsWith('http') ? href : `https://www.amazon.com${href}`;
      }
    }

    // Extract estimated delivery
    const estimatedDelivery = await this.getText(
      ['#primaryDeliveryCountdown', '.delivery-box__primary-text', 'span:has-text("Arriving")'] as string[],
      3000,
    );

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

  private async parseOrders(): Promise<Order[]> {
    const cards = await this.findAll(SELECTORS.orders.orderCards, 5000);
    const orders: Order[] = [];

    for (const card of cards) {
      try {
        const orderId = await this.getLocatorText(card, SELECTORS.orders.orderId);
        if (!orderId) continue;

        // Date and total are in the order-header columns
        const headerValues = card.locator('.order-header .a-size-base.a-color-secondary.aok-break-word');
        const headerCount = await headerValues.count();

        let date: string | null = null;
        let total: string | null = null;

        if (headerCount >= 1) {
          date = (await headerValues.nth(0).textContent({ timeout: 1000 }).catch(() => null))?.trim() ?? null;
        }
        if (headerCount >= 2) {
          total = (await headerValues.nth(1).textContent({ timeout: 1000 }).catch(() => null))?.trim() ?? null;
        }

        const status = await this.getLocatorText(card, SELECTORS.orders.orderStatus);
        const items = await this.parseItemTitles(card);

        // Extract tracking link from order card
        const trackingLink = card.locator('a[href*="track"], a:has-text("Track package")').first();
        let trackingUrl: string | null = null;
        if ((await trackingLink.count()) > 0) {
          const href = await trackingLink.getAttribute('href').catch(() => null);
          if (href) {
            trackingUrl = href.startsWith('http') ? href : `https://www.amazon.com${href}`;
          }
        }

        // Extract estimated delivery from card
        const estimatedDelivery = await this.getLocatorText(card, [
          '.delivery-box__primary-text',
          'span.a-size-medium.a-color-success',
        ]);

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

  async getOrderItems(orderId: string): Promise<{ title: string; asin: string | null }[]> {
    await this.navigateTo(`https://www.amazon.com/gp/your-account/order-details?orderID=${orderId}`);
    await this.checkAuth();
    await humanDelay(1000, 2000);

    const items: { title: string; asin: string | null }[] = [];
    // Look for product links with ASINs
    const links = this.page.locator('a[href*="/dp/"], a[href*="/gp/product/"]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      try {
        const href = await links.nth(i).getAttribute('href');
        const text = await links.nth(i).textContent({ timeout: 1000 });
        if (!href || !text || text.trim().length < 3) continue;
        // Skip non-product links
        if (text.trim().startsWith('View') || text.trim().startsWith('Write')) continue;

        let asin: string | null = null;
        const dpMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        const gpMatch = href.match(/\/gp\/product\/([A-Z0-9]{10})/);
        asin = dpMatch?.[1] ?? gpMatch?.[1] ?? null;

        // Avoid duplicates
        if (asin && items.some((item) => item.asin === asin)) continue;

        items.push({ title: text.trim(), asin });
      } catch {
        continue;
      }
    }

    return items;
  }

  private async parseItemTitles(container: import('playwright').Locator) {
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
