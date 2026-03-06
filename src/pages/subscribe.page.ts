import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import { humanDelay } from '../browser/humanize.js';

export interface Subscription {
  title: string;
  frequency: string | null;
  nextDelivery: string | null;
  price: string | null;
  index: number;
}

export interface SnsProductInfo {
  available: boolean;
  price: string | null;
  frequencies: string[];
}

export class SubscribePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async listSubscriptions(): Promise<Subscription[]> {
    await this.navigateTo('https://www.amazon.com/auto-deliveries');
    await this.checkAuth();
    await humanDelay(1000, 2000);

    const items = await this.findAll(SELECTORS.subscribeAndSave.snsSubscriptionsPage, 5000);
    const subscriptions: Subscription[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const title = await this.getLocatorText(items[i], SELECTORS.subscribeAndSave.snsItemTitle);
        if (!title) continue;

        const frequency = await this.getLocatorText(items[i], SELECTORS.subscribeAndSave.snsItemFrequency);
        const nextDelivery = await this.getLocatorText(items[i], SELECTORS.subscribeAndSave.snsItemNextDelivery);
        const price = await this.getLocatorText(items[i], SELECTORS.subscribeAndSave.snsItemPrice);

        subscriptions.push({ title, frequency, nextDelivery, price, index: i });
      } catch {
        continue;
      }
    }

    return subscriptions;
  }

  async getProductSnsInfo(asin: string): Promise<SnsProductInfo> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(500, 1000);

    const snsBadge = await this.tryFindFirst(SELECTORS.subscribeAndSave.snsBadge, 3000);
    if (!snsBadge) {
      return { available: false, price: null, frequencies: [] };
    }

    const priceText = await this.getText(SELECTORS.subscribeAndSave.snsPrice, 3000);

    // Get frequency options
    const frequencies: string[] = [];
    const freqSelect = await this.tryFindFirst(SELECTORS.subscribeAndSave.snsFrequencySelect, 3000);
    if (freqSelect) {
      const options = freqSelect.locator('option');
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent({ timeout: 1000 }).catch(() => null);
        if (text && text.trim()) frequencies.push(text.trim());
      }
    }

    return { available: true, price: priceText, frequencies };
  }

  async subscribeToProduct(asin: string, frequencyIndex = 0): Promise<boolean> {
    await this.navigateTo(`https://www.amazon.com/dp/${asin}`);
    await humanDelay(500, 1000);

    // Check the S&S checkbox
    const checkbox = await this.tryFindFirst(SELECTORS.subscribeAndSave.snsCheckbox, 3000);
    if (!checkbox) return false;

    const isChecked = await checkbox.isChecked().catch(() => false);
    if (!isChecked) {
      await checkbox.click();
      await humanDelay(500, 1000);
    }

    // Select frequency if available
    if (frequencyIndex > 0) {
      const freqSelect = await this.tryFindFirst(SELECTORS.subscribeAndSave.snsFrequencySelect, 3000);
      if (freqSelect) {
        const options = freqSelect.locator('option');
        const count = await options.count();
        if (frequencyIndex < count) {
          const value = await options.nth(frequencyIndex).getAttribute('value');
          if (value) {
            await freqSelect.selectOption(value);
            await humanDelay(500, 1000);
          }
        }
      }
    }

    // Click add to cart (which subscribes)
    const addBtn = await this.tryFindFirst(SELECTORS.product.addToCartButton, 5000);
    if (!addBtn) return false;

    await addBtn.click();
    await humanDelay(1500, 3000);
    return true;
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
