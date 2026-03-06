import pc from 'picocolors';
import { withSession, type SessionOptions } from '../browser/session.js';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';
import { GroceryCheckoutPage } from '../pages/grocery-checkout.page.js';
import { formatCart } from '../ui/formatters.js';
import { confirmAction } from '../ui/prompts.js';

interface CheckoutCommandOpts extends SessionOptions {
  dryRun?: boolean;
  slot?: number;
  grocery?: boolean;
}

export async function checkoutCommand(opts: CheckoutCommandOpts): Promise<void> {
  await withSession(opts, async (page) => {
    // Show cart first
    const cartPage = new CartPage(page);
    const { items, subtotal, groceryItems, grocerySubtotal } = await cartPage.listItems();

    const hasRegular = items.length > 0;
    const hasGrocery = groceryItems.length > 0;

    if (!hasRegular && !hasGrocery) {
      console.log(pc.yellow('\n  Cart is empty. Nothing to checkout.\n'));
      return;
    }

    console.log(pc.bold('\n  Cart Summary:'));
    if (hasRegular) {
      console.log(pc.bold('  Amazon Cart'));
      console.log(formatCart(items, subtotal));
    }
    if (hasGrocery) {
      console.log(pc.bold('  Whole Foods / Fresh Cart'));
      console.log(formatCart(groceryItems, grocerySubtotal));
    }

    if (opts.dryRun) {
      console.log(pc.cyan('  [Dry run] Would proceed to checkout with the above items.\n'));
      return;
    }

    // Determine checkout type
    const isGroceryCheckout = opts.grocery || (hasGrocery && !hasRegular);

    if (isGroceryCheckout && hasGrocery) {
      await groceryCheckoutFlow(page, opts);
    } else if (hasRegular) {
      await regularCheckoutFlow(page, opts);
      if (hasGrocery) {
        console.log(pc.dim('  Note: Grocery items require separate checkout. Run `amz checkout --grocery` next.\n'));
      }
    } else {
      // Only grocery items but --grocery not set
      await groceryCheckoutFlow(page, opts);
    }
  });
}

async function regularCheckoutFlow(page: import('playwright').Page, opts: CheckoutCommandOpts): Promise<void> {
  const proceed = await confirmAction('Proceed to checkout?');
  if (!proceed) return;

  const checkoutPage = new CheckoutPage(page);
  await checkoutPage.startCheckout();

  const summary = await checkoutPage.getSummary();
  console.log(pc.bold('\n  Checkout Summary:'));
  if (summary.address) console.log(`  ${pc.dim('Address:')} ${summary.address}`);
  if (summary.total) console.log(`  ${pc.dim('Total:')}   ${pc.green(summary.total)}`);

  if (summary.deliverySlots.length > 0) {
    console.log(`  ${pc.dim('Delivery options:')}`);
    for (const slot of summary.deliverySlots) {
      console.log(`    ${slot.index + 1}. ${slot.description}${slot.isFree ? pc.green(' (FREE)') : ''}`);
    }
  }
  console.log('');

  if (opts.slot !== undefined && summary.deliverySlots.length > 0) {
    const slotIndex = opts.slot - 1;
    if (slotIndex >= 0 && slotIndex < summary.deliverySlots.length) {
      console.log(pc.dim(`  Selecting delivery slot ${opts.slot}...`));
      await checkoutPage.selectDeliverySlot(slotIndex);
    } else {
      console.log(pc.yellow(`  Invalid slot ${opts.slot}. Available: 1-${summary.deliverySlots.length}`));
    }
  }

  const confirmOrder = await confirmAction(pc.bold('Place this order?'));
  if (!confirmOrder) {
    console.log(pc.dim('  Order cancelled.\n'));
    return;
  }

  const success = await checkoutPage.placeOrder();
  if (success) {
    console.log(pc.green('\n  Order placed successfully!\n'));
  } else {
    console.log(pc.yellow('\n  Order may not have completed. Please check your Amazon account.\n'));
  }
}

async function groceryCheckoutFlow(page: import('playwright').Page, opts: CheckoutCommandOpts): Promise<void> {
  const proceed = await confirmAction('Proceed to grocery checkout?');
  if (!proceed) return;

  const checkoutPage = new GroceryCheckoutPage(page);
  await checkoutPage.startGroceryCheckout();

  const summary = await checkoutPage.getSummary();
  console.log(pc.bold('\n  Grocery Checkout:'));
  if (summary.total) console.log(`  ${pc.dim('Total:')} ${pc.green(summary.total)}`);

  // Show delivery days
  if (summary.deliveryDays.length > 0) {
    console.log(`\n  ${pc.dim('Delivery days:')}`);
    for (const day of summary.deliveryDays) {
      console.log(`    ${day.index + 1}. ${day.label}`);
    }
  }

  // Show time slots for current day
  if (summary.deliverySlots.length > 0) {
    console.log(`\n  ${pc.dim('Available time slots:')}`);
    for (const slot of summary.deliverySlots) {
      const cost = slot.cost ? ` ${pc.dim(`(${slot.cost})`)}` : pc.green(' (FREE)');
      console.log(`    ${slot.slotIndex + 1}. ${slot.time}${cost}`);
    }
  }
  console.log('');

  // Select delivery slot if specified
  if (opts.slot !== undefined && summary.deliverySlots.length > 0) {
    const slotIndex = opts.slot - 1;
    if (slotIndex >= 0 && slotIndex < summary.deliverySlots.length) {
      console.log(pc.dim(`  Selecting time slot ${opts.slot}...`));
      await checkoutPage.selectTimeSlot(slotIndex);
    } else {
      console.log(pc.yellow(`  Invalid slot ${opts.slot}. Available: 1-${summary.deliverySlots.length}`));
    }
  }

  // Continue to review page
  await checkoutPage.continueToReview();

  const confirmOrder = await confirmAction(pc.bold('Place this grocery order?'));
  if (!confirmOrder) {
    console.log(pc.dim('  Order cancelled.\n'));
    return;
  }

  const success = await checkoutPage.placeOrder();
  if (success) {
    console.log(pc.green('\n  Grocery order placed successfully!\n'));
  } else {
    console.log(pc.yellow('\n  Order may not have completed. Please check your Amazon account.\n'));
  }
}
