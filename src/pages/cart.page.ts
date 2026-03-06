import type { Page } from 'playwright';
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
    const groceryCartUrl = await this.getGroceryCartUrl();
    let groceryItems: CartItem[] = [];
    let grocerySubtotal: number | null = null;

    if (groceryCartUrl) {
      await this.navigateTo(groceryCartUrl);
      await humanDelay(500, 1500);
      groceryItems = await this.parseCartItems();
      const grocerySubtotalText = await this.getText(SELECTORS.cart.cartSubtotal, 3000);
      grocerySubtotal = this.parsePrice(grocerySubtotalText);
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

        const title = await this.getChildText(loc, SELECTORS.cart.cartItemTitle);
        if (!title) continue;

        const priceText = await this.getChildText(loc, SELECTORS.cart.cartItemPrice);
        const qtyVal = await this.getChildInputValue(loc, SELECTORS.cart.cartItemQuantity);
        const imageUrl = await this.getChildAttr(loc, SELECTORS.cart.cartItemImage, 'src');

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
    if (await this.navigateToGroceryCart()) {
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
              return true;
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
    if (await this.navigateToGroceryCart()) {
      if (await this.removeFromCurrentPage(asin)) return true;
    }

    return false;
  }

  private async removeFromCurrentPage(asin: string): Promise<boolean> {
    const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
    for (const loc of itemLocators) {
      const itemAsin = await loc.getAttribute('data-asin');
      if (itemAsin === asin) {
        await this.clickFirstChildMatch(loc, SELECTORS.cart.cartItemDelete);
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
    if (await this.navigateToGroceryCart()) {
      totalRemoved += await this.clearCurrentPage();
    }

    return totalRemoved;
  }

  private async clearCurrentPage(): Promise<number> {
    let removed = 0;
    while (true) {
      const itemLocators = await this.findAll(SELECTORS.cart.cartItems, 3000);
      if (itemLocators.length === 0) break;
      await this.clickFirstChildMatch(itemLocators[0], SELECTORS.cart.cartItemDelete);
      await humanDelay(1500, 2500);
      removed++;
    }
    return removed;
  }

  private async getGroceryCartUrl(): Promise<string | null> {
    const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
    const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;
    return brandId ? `https://www.amazon.com/cart/localmarket?almBrandId=${brandId}` : null;
  }

  private async navigateToGroceryCart(): Promise<boolean> {
    const url = await this.getGroceryCartUrl();
    if (!url) return false;
    await this.navigateTo(url);
    await humanDelay(500, 1500);
    return true;
  }
}
