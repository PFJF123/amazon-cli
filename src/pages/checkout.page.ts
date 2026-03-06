import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import type { DeliverySlot } from '../models/product.js';
import { humanDelay } from '../browser/humanize.js';

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
  }

  async getSummary(): Promise<CheckoutSummary> {
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
