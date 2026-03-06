import type { Page, Locator } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { CartItem } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

export interface CartContents {
  items: CartItem[];
  subtotal: number | null;
  groceryItems: CartItem[];
  grocerySubtotal: number | null;
}

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToCart(): Promise<void> {
    await this.navigateTo('https://www.amazon.com/cart');
    await humanDelay(500, 1500);
  }

  async listItems(): Promise<CartContents> {
    await this.navigateToCart();

    // Parse regular Amazon cart items
    const regularItems = await this.parseCartItems();
    const subtotalText = await this.getText(SELECTORS.cart.cartSubtotal, 3000);

    // Check for Whole Foods / Amazon Fresh collapsed cart section
    const almSection = await this.tryFindFirst(['[id*="sc-localmarket-cart"]'], 2000);
    let groceryItems: CartItem[] = [];
    let grocerySubtotal: number | null = null;

    if (almSection) {
      // Get the brand ID from the ALM section
      const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
      const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;

      if (brandId) {
        // Navigate to the localmarket cart to get WF/Fresh items
        await this.navigateTo(`https://www.amazon.com/cart/localmarket?almBrandId=${brandId}`);
        await humanDelay(500, 1500);
        groceryItems = await this.parseCartItems();
        const grocerySubtotalText = await this.getText(SELECTORS.cart.cartSubtotal, 3000);
        grocerySubtotal = this.parsePrice(grocerySubtotalText);
      }
    }

    return {
      items: regularItems,
      subtotal: this.parsePrice(subtotalText),
      groceryItems,
      grocerySubtotal,
    };
  }

  private async parseCartItems(): Promise<CartItem[]> {
    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 5000);
    const items: CartItem[] = [];

    for (const loc of itemLocators) {
      try {
        const asin = await loc.getAttribute('data-asin');
        if (!asin) continue;

        const title = await this.getLocatorText(loc, SELECTORS.cart.cartItemTitle);
        if (!title) continue;

        const priceText = await this.getLocatorText(loc, SELECTORS.cart.cartItemPrice);
        const qtyVal = await this.getLocatorInputValue(loc, SELECTORS.cart.cartItemQuantity);
        const imageUrl = await this.getLocatorAttr(loc, SELECTORS.cart.cartItemImage, 'src');

        items.push({
          asin,
          title,
          price: this.parsePrice(priceText),
          quantity: parseInt(qtyVal ?? '1') || 1,
          imageUrl,
        });
      } catch {
        continue;
      }
    }

    return items;
  }

  async updateQuantity(asin: string, quantity: number): Promise<boolean> {
    await this.navigateToCart();
    if (await this.updateQtyOnCurrentPage(asin, quantity)) return true;

    // Try WF/Fresh cart
    const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
    const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;
    if (brandId) {
      await this.navigateTo(`https://www.amazon.com/cart/localmarket?almBrandId=${brandId}`);
      await humanDelay(500, 1500);
      if (await this.updateQtyOnCurrentPage(asin, quantity)) return true;
    }

    return false;
  }

  private async updateQtyOnCurrentPage(asin: string, quantity: number): Promise<boolean> {
    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
    for (const loc of itemLocators) {
      const itemAsin = await loc.getAttribute('data-asin');
      if (itemAsin === asin) {
        for (const sel of SELECTORS.cart.cartItemQuantity) {
          try {
            const qtyEl = loc.locator(sel).first();
            if ((await qtyEl.count()) > 0) {
              await qtyEl.selectOption(String(quantity));
              await humanDelay(1500, 2500);
              const actual = await qtyEl.inputValue({ timeout: 2000 }).catch(() => null);
              return actual === null || parseInt(actual) === quantity;
            }
          } catch {
            continue;
          }
        }
        return false;
      }
    }
    return false;
  }

  async removeItem(asin: string): Promise<boolean> {
    // Try regular cart first
    await this.navigateToCart();
    if (await this.removeFromCurrentPage(asin)) return true;

    // Try WF/Fresh cart
    const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
    const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;
    if (brandId) {
      await this.navigateTo(`https://www.amazon.com/cart/localmarket?almBrandId=${brandId}`);
      await humanDelay(500, 1500);
      if (await this.removeFromCurrentPage(asin)) return true;
    }

    return false;
  }

  private async removeFromCurrentPage(asin: string): Promise<boolean> {
    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
    for (const loc of itemLocators) {
      const itemAsin = await loc.getAttribute('data-asin');
      if (itemAsin === asin) {
        await this.clickFirstMatch(loc, SELECTORS.cart.cartItemDelete);
        await humanDelay(1000, 2000);
        return true;
      }
    }
    return false;
  }

  async clearCart(): Promise<number> {
    let totalRemoved = 0;

    // Clear regular cart
    await this.navigateToCart();
    totalRemoved += await this.clearCurrentPage();

    // Clear WF/Fresh cart if present
    const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
    const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;
    if (brandId) {
      await this.navigateTo(`https://www.amazon.com/cart/localmarket?almBrandId=${brandId}`);
      await humanDelay(500, 1500);
      totalRemoved += await this.clearCurrentPage();
    }

    return totalRemoved;
  }

  private async clearCurrentPage(): Promise<number> {
    let removed = 0;
    while (true) {
      const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
      if (itemLocators.length === 0) break;
      const countBefore = itemLocators.length;
      await this.clickFirstMatch(itemLocators[0], SELECTORS.cart.cartItemDelete);
      await humanDelay(1500, 2500);
      const afterLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
      if (afterLocators.length < countBefore) {
        removed++;
      } else {
        break; // delete didn't work, stop to avoid infinite loop
      }
    }
    return removed;
  }

  private async getLocatorText(parent: Locator, chain: readonly string[]): Promise<string | null> {
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

  private async getLocatorInputValue(parent: Locator, chain: readonly string[]): Promise<string | null> {
    for (const sel of chain) {
      try {
        const val = await parent.locator(sel).first().inputValue({ timeout: 1000 });
        if (val) return val;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async getLocatorAttr(parent: Locator, chain: readonly string[], attr: string): Promise<string | null> {
    for (const sel of chain) {
      try {
        const val = await parent.locator(sel).first().getAttribute(attr, { timeout: 1000 });
        if (val) return val;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async clickFirstMatch(parent: Locator, chain: readonly string[]): Promise<void> {
    for (const sel of chain) {
      try {
        const el = parent.locator(sel).first();
        if ((await el.count()) > 0) {
          await el.click({ timeout: 3000 });
          return;
        }
      } catch {
        continue;
      }
    }
  }
}
