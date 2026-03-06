import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { Product } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

export type GroceryStore = 'wholefoods' | 'fresh';
export type FulfillmentMode = 'delivery' | 'pickup';

const WHOLE_FOODS_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Deli',
  'Frozen',
  'Beverages',
  'Snacks',
  'Pantry Staples',
  'Breakfast',
  'Baby & Kids',
  'Household',
  'Health & Beauty',
  'Wine & Beer',
];

export interface GroceryCategory {
  name: string;
  url: string;
}

export interface DeliveryInfo {
  location: string | null;
  deliveryMessage: string | null;
  hasDelivery: boolean;
  hasPickup: boolean;
}

export class GroceryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async getDeliveryInfo(asin: string): Promise<DeliveryInfo> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(1000, 2000);

    const location = await this.getText(SELECTORS.grocery.locationText, 3000);
    const deliveryMessage = await this.getText(SELECTORS.grocery.deliveryMessage, 3000);
    const hasDelivery = !!(await this.tryFindFirst(SELECTORS.grocery.deliveryTab, 2000));
    const hasPickup = !!(await this.tryFindFirst(SELECTORS.grocery.pickupTab, 2000));

    return { location, deliveryMessage, hasDelivery, hasPickup };
  }

  async selectFulfillmentMode(mode: FulfillmentMode): Promise<void> {
    const tabSelector = mode === 'pickup' ? SELECTORS.grocery.pickupTab : SELECTORS.grocery.deliveryTab;
    const tab = await this.tryFindFirst(tabSelector, 3000);
    if (tab) {
      await tab.click();
      await humanDelay(1000, 2000);
    }
  }

  async search(query: string, store: GroceryStore = 'wholefoods', limit = 10): Promise<Product[]> {
    const storeIndex = store === 'wholefoods' ? 'wholefoods' : 'amazonfresh';
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=${storeIndex}`;
    await this.navigateTo(url);
    await humanDelay(1000, 2000);

    if (store === 'fresh') {
      const unavailable = await this.tryFindFirst(SELECTORS.grocery.freshUnavailable, 2000);
      if (unavailable) return [];
    }

    return this.parseSearchResults(limit);
  }

  async getCategories(store: GroceryStore = 'wholefoods'): Promise<GroceryCategory[]> {
    if (store === 'wholefoods') {
      return WHOLE_FOODS_CATEGORIES.map((name) => ({
        name,
        url: `https://www.amazon.com/s?k=${encodeURIComponent(name.toLowerCase())}&i=wholefoods`,
      }));
    }

    await this.navigateTo('https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo');
    await humanDelay(1000, 2000);

    const links = this.page.locator(SELECTORS.grocery.categoryLinks[0]);
    const count = await links.count();
    const categories: GroceryCategory[] = [];

    for (let i = 0; i < count; i++) {
      const name = await links.nth(i).textContent({ timeout: 1000 }).catch(() => null);
      const href = await links.nth(i).getAttribute('href').catch(() => null);
      if (name && name.trim() && href) {
        categories.push({
          name: name.trim(),
          url: href.startsWith('http') ? href : `https://www.amazon.com${href}`,
        });
      }
    }

    return categories;
  }

  async browseCategory(categoryUrl: string, limit = 10): Promise<Product[]> {
    await this.navigateTo(categoryUrl);
    await humanDelay(1000, 2000);
    return this.parseSearchResults(limit);
  }

  async addToCart(asin: string, quantity = 1, mode: FulfillmentMode = 'delivery'): Promise<boolean> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(500, 1000);

    // Select delivery or pickup tab
    await this.selectFulfillmentMode(mode);

    if (quantity > 1) {
      const qtySelect = await this.tryFindFirst(SELECTORS.product.quantity, 3000);
      if (qtySelect) {
        await qtySelect.selectOption(String(quantity));
        await humanDelay(300, 600);
      }
    }

    // Click the visible add-to-cart button
    for (const sel of SELECTORS.grocery.freshAddToCart) {
      try {
        const buttons = this.page.locator(sel);
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          const btn = buttons.nth(i);
          if (await btn.isVisible().catch(() => false)) {
            await btn.click({ timeout: 5000 });
            await humanDelay(2000, 4000);
            await this.dismissLocationPopup();
            return true;
          }
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  private async dismissLocationPopup(): Promise<void> {
    const confirmBtns = [
      '.a-popover-footer .a-button-primary',
      '.a-button-primary:has-text("Confirm")',
      '.a-button-primary:has-text("Yes")',
      '.a-popover .a-button-primary input',
    ];
    for (const sel of confirmBtns) {
      try {
        const btn = this.page.locator(sel).first();
        if ((await btn.count()) > 0 && (await btn.isVisible())) {
          await btn.click({ timeout: 3000 });
          await humanDelay(1000, 2000);
          return;
        }
      } catch {
        continue;
      }
    }
  }

  private async parseSearchResults(limit: number): Promise<Product[]> {
    const items = await this.findAll(SELECTORS.search.resultItems, 8000);
    const products: Product[] = [];

    for (const item of items.slice(0, limit + 5)) {
      if (products.length >= limit) break;

      try {
        const asin = await item.getAttribute('data-asin');
        if (!asin || asin === '') continue;

        const title = await this.getChildText(item, SELECTORS.search.resultTitle);
        if (!title) continue;

        const priceText = await this.getChildText(item, SELECTORS.search.resultPrice);
        const ratingText = await this.getChildText(item, SELECTORS.search.resultRating);
        const reviewText = await this.getChildText(item, SELECTORS.search.resultReviewCount);
        const imageUrl = await this.getChildAttr(item, SELECTORS.search.resultImage, 'src');
        const isPrime = await this.hasChildMatch(item, SELECTORS.search.resultPrimeBadge);

        products.push({
          asin,
          title: title.trim(),
          price: this.parsePrice(priceText),
          rating: ratingText ? parseFloat(ratingText.split(' ')[0]) : null,
          reviewCount: reviewText ? parseInt(reviewText.replace(/[^0-9]/g, '')) || null : null,
          isPrime,
          imageUrl,
          url: `https://www.amazon.com/dp/${asin}`,
        });
      } catch {
        continue;
      }
    }

    return products;
  }
}
