import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { CartItem } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToCart(): Promise<void> {
    await this.navigateTo('https://www.amazon.com/cart');
    await humanDelay(500, 1500);
  }

  async listItems(): Promise<{ items: CartItem[]; subtotal: number | null }> {
    await this.navigateToCart();

    const empty = await this.tryFindFirst(SELECTORS.cart.emptyCart, 2000);
    if (empty) return { items: [], subtotal: null };

    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 5000);
    const items: CartItem[] = [];

    for (const loc of itemLocators) {
      try {
        const asin = await loc.getAttribute('data-asin');
        if (!asin) continue;

        const titleEl = loc.locator(SELECTORS.cart.cartItemTitle[0]).first();
        const title = (await titleEl.textContent().catch(() => null))?.trim();
        if (!title) continue;

        const priceText = await this.getLocatorText(loc, SELECTORS.cart.cartItemPrice);
        const qtyEl = loc.locator(SELECTORS.cart.cartItemQuantity[0]).first();
        const qtyVal = await qtyEl.inputValue().catch(() => '1');
        const imgEl = loc.locator(SELECTORS.cart.cartItemImage[0]).first();
        const imageUrl = await imgEl.getAttribute('src').catch(() => null);

        items.push({
          asin,
          title,
          price: this.parsePrice(priceText),
          quantity: parseInt(qtyVal) || 1,
          imageUrl,
        });
      } catch {
        continue;
      }
    }

    const subtotalText = await this.getText(SELECTORS.cart.cartSubtotal, 3000);
    return { items, subtotal: this.parsePrice(subtotalText) };
  }

  async removeItem(asin: string): Promise<boolean> {
    await this.navigateToCart();
    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 5000);

    for (const loc of itemLocators) {
      const itemAsin = await loc.getAttribute('data-asin');
      if (itemAsin === asin) {
        const deleteBtn = loc.locator(SELECTORS.cart.cartItemDelete[0]).first();
        await deleteBtn.click();
        await humanDelay(1000, 2000);
        return true;
      }
    }
    return false;
  }

  async clearCart(): Promise<number> {
    await this.navigateToCart();
    let removed = 0;

    while (true) {
      const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
      if (itemLocators.length === 0) break;

      const deleteBtn = itemLocators[0].locator(SELECTORS.cart.cartItemDelete[0]).first();
      await deleteBtn.click();
      await humanDelay(1500, 2500);
      removed++;
    }

    return removed;
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
