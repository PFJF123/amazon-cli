import type { Page } from 'playwright';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/index.js';
import { humanDelay } from '../browser/humanize.js';

export interface GroceryDeliveryDay {
  label: string;
  index: number;
}

export interface GroceryDeliverySlot {
  time: string;
  cost: string | null;
  dayIndex: number;
  slotIndex: number;
}

export interface GroceryCheckoutSummary {
  total: string | null;
  deliveryDays: GroceryDeliveryDay[];
  deliverySlots: GroceryDeliverySlot[];
}

export class GroceryCheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async startGroceryCheckout(): Promise<void> {
    // Navigate to cart and click the ALM (grocery) checkout button
    await this.navigateTo('https://www.amazon.com/cart');
    await humanDelay(500, 1000);

    const checkoutBtn = await this.tryFindFirst(SELECTORS.groceryCheckout.checkoutButton, 5000);
    if (!checkoutBtn) {
      // Fallback: try the localmarket cart path
      const almBuyBox = await this.tryFindFirst(['#sc-alm-buy-box'], 2000);
      const brandId = almBuyBox ? await almBuyBox.getAttribute('data-brand-id') : null;
      if (brandId) {
        await this.navigateTo(`https://www.amazon.com/cart/localmarket?almBrandId=${brandId}`);
        await humanDelay(500, 1000);
        const btn = await this.findFirst(SELECTORS.groceryCheckout.checkoutButton, 5000);
        await btn.click();
      } else {
        throw new Error('No grocery items found in cart. Use `amz grocery add` first.');
      }
    } else {
      await checkoutBtn.click();
    }

    await humanDelay(3000, 5000);
    await this.checkAuth();
  }

  async getSummary(): Promise<GroceryCheckoutSummary> {
    const total = await this.getText(SELECTORS.groceryCheckout.orderTotal, 5000);

    // Parse delivery day tabs
    const dayTabs = await this.findAll(SELECTORS.groceryCheckout.deliveryDayTabs, 5000);
    const deliveryDays: GroceryDeliveryDay[] = [];

    for (let i = 0; i < dayTabs.length; i++) {
      const label = await this.getChildText(dayTabs[i], SELECTORS.groceryCheckout.deliveryDayLabel);
      if (label) {
        deliveryDays.push({ label, index: i });
      }
    }

    // Parse time slots for currently selected day
    const deliverySlots = await this.parseTimeSlots(0);

    return { total, deliveryDays, deliverySlots };
  }

  private async parseTimeSlots(dayIndex: number): Promise<GroceryDeliverySlot[]> {
    const slotElements = await this.findAll(SELECTORS.groceryCheckout.deliveryTimeSlots, 5000);
    const slots: GroceryDeliverySlot[] = [];

    for (let i = 0; i < slotElements.length; i++) {
      const time = await this.getChildText(slotElements[i], SELECTORS.groceryCheckout.deliveryTimeLabel);
      const cost = await this.getChildText(slotElements[i], SELECTORS.groceryCheckout.deliveryTimeCost);
      if (time) {
        slots.push({ time, cost, dayIndex, slotIndex: i });
      }
    }

    return slots;
  }

  async selectDeliveryDay(dayIndex: number): Promise<GroceryDeliverySlot[]> {
    const dayTabs = await this.findAll(SELECTORS.groceryCheckout.deliveryDayTabs, 5000);
    if (dayIndex >= 0 && dayIndex < dayTabs.length) {
      await dayTabs[dayIndex].click();
      await humanDelay(1500, 2500);
    }
    return this.parseTimeSlots(dayIndex);
  }

  async selectTimeSlot(slotIndex: number): Promise<void> {
    const slots = await this.findAll(SELECTORS.groceryCheckout.deliveryTimeSlots, 5000);
    if (slotIndex >= 0 && slotIndex < slots.length) {
      await slots[slotIndex].click();
      await humanDelay(1000, 2000);
    }
  }

  async continueToReview(): Promise<void> {
    const continueBtn = await this.findFirst(SELECTORS.groceryCheckout.continueButton, 5000);
    await continueBtn.click();
    await humanDelay(2000, 4000);
  }

  async placeOrder(): Promise<boolean> {
    const placeBtn = await this.findFirst(SELECTORS.groceryCheckout.placeOrderButton, 10000);
    await placeBtn.click();
    await humanDelay(3000, 5000);

    const confirmation = await this.tryFindFirst(SELECTORS.groceryCheckout.confirmationPage, 15000);
    return !!confirmation;
  }
}
