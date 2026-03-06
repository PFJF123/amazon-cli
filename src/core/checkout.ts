import type { Page } from 'playwright';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage, type CheckoutSummary } from '../pages/checkout.page.js';
import { GroceryCheckoutPage, type GroceryCheckoutSummary } from '../pages/grocery-checkout.page.js';

export async function getCheckoutSummary(page: Page): Promise<CheckoutSummary> {
  const checkoutPage = new CheckoutPage(page);
  await checkoutPage.startCheckout();
  return checkoutPage.getSummary();
}

export async function placeOrder(page: Page, opts: {
  dryRun?: boolean;
  grocery?: boolean;
  slot?: number;
} = {}): Promise<{
  success: boolean;
  summary: CheckoutSummary | GroceryCheckoutSummary | null;
}> {
  const cartPage = new CartPage(page);
  const { items, groceryItems } = await cartPage.listItems();

  const hasRegular = items.length > 0;
  const hasGrocery = groceryItems.length > 0;

  if (!hasRegular && !hasGrocery) {
    return { success: false, summary: null };
  }

  const isGroceryCheckout = opts.grocery || (hasGrocery && !hasRegular);

  if (isGroceryCheckout && hasGrocery) {
    const checkoutPage = new GroceryCheckoutPage(page);
    await checkoutPage.startGroceryCheckout();
    const summary = await checkoutPage.getSummary();

    if (opts.dryRun) {
      return { success: true, summary };
    }

    if (opts.slot !== undefined && summary.deliverySlots.length > 0) {
      const slotIndex = opts.slot - 1;
      if (slotIndex >= 0 && slotIndex < summary.deliverySlots.length) {
        await checkoutPage.selectTimeSlot(slotIndex);
      }
    }

    await checkoutPage.continueToReview();
    const success = await checkoutPage.placeOrder();
    return { success, summary };
  } else {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.startCheckout();
    const summary = await checkoutPage.getSummary();

    if (opts.dryRun) {
      return { success: true, summary };
    }

    if (opts.slot !== undefined && summary.deliverySlots.length > 0) {
      const slotIndex = opts.slot - 1;
      if (slotIndex >= 0 && slotIndex < summary.deliverySlots.length) {
        await checkoutPage.selectDeliverySlot(slotIndex);
      }
    }

    const success = await checkoutPage.placeOrder();
    return { success, summary };
  }
}
