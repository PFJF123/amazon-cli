import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { DeliverySlot } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';
import { AmzError } from '../errors/index.js';

export interface CheckoutSummary {
  address: string | null;
  total: string | null;
  deliverySlots: DeliverySlot[];
}

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async startCheckout(): Promise<void> {
    await this.navigateTo('https://www.amazon.com/cart');
    await humanDelay(500, 1000);

    const ptcBtn = await this.findFirst(SELECTORS.cart.proceedToCheckout);
    await ptcBtn.click();
    await humanDelay(2000, 4000);
    await this.checkAuth();

    // Detect payment method issues
    const url = this.page.url();
    if (url.includes('/payment-select') || url.includes('payment-method') || url.includes('/pp/payselect')) {
      throw new AmzError('Payment method requires attention — please update it on Amazon.com before checking out.');
    }
  }

  async getSummary(): Promise<CheckoutSummary> {
    // Detect items that became unavailable during checkout
    const oosItems = await this.findAll(
      ['.sc-item-unavailable-msg', '[class*="item-unavailable"]', ':has-text("currently unavailable")'] as string[],
      2000,
    );
    if (oosItems.length > 0) {
      const titles: string[] = [];
      for (const item of oosItems) {
        const text = await item.textContent().catch(() => null);
        if (text && text.trim()) titles.push(text.trim().slice(0, 80));
      }
      throw new AmzError(`Some cart items became unavailable: ${titles.join('; ')}`);
    }

    // Detect address confirmation modal and auto-confirm
    const unconfirmed = await this.tryFindFirst(
      ['[class*="ship-to-address-unconfirmed"]', '.ship-to-address-change', '[id*="address-book-entry"]'] as string[],
      2000,
    );
    if (unconfirmed) {
      const confirmBtn = await this.tryFindFirst(
        ['input[type="submit"]', '.a-button-primary input', '#continue-top', 'input[name="continue"]'] as string[],
        3000,
      );
      if (confirmBtn) {
        await confirmBtn.click();
        await humanDelay(2000, 3000);
      }
    }

    const address = await this.getText(SELECTORS.checkout.deliveryAddress, 5000);
    const total = await this.getText(SELECTORS.checkout.orderTotal, 5000);

    const slotLocators = await this.findAll(SELECTORS.checkout.deliverySlots, 5000);
    const deliverySlots: DeliverySlot[] = [];

    for (let i = 0; i < slotLocators.length; i++) {
      try {
        const label = await this.getLocatorText(slotLocators[i], SELECTORS.checkout.deliverySlotLabel);
        if (label) {
          deliverySlots.push({
            date: label,
            description: label,
            isFree: label.toLowerCase().includes('free'),
            index: i,
          });
        }
      } catch {
        continue;
      }
    }

    return { address, total, deliverySlots };
  }

  async selectDeliverySlot(index: number): Promise<void> {
    const slots = await this.findAll(SELECTORS.checkout.deliverySlots, 5000);
    if (index >= 0 && index < slots.length) {
      await slots[index].click();
      await humanDelay(1000, 2000);
    }
  }

  async placeOrder(): Promise<boolean> {
    const placeBtn = await this.findFirst(SELECTORS.checkout.placeOrderButton, 10000);
    await placeBtn.click();
    await humanDelay(3000, 5000);

    const confirmation = await this.tryFindFirst(SELECTORS.checkout.confirmationPage, 15000);
    return !!confirmation;
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
