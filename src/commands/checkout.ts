import pc from 'picocolors';
import { getPage, closeSession, type SessionOptions } from '../browser/session.js';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';
import { formatCart } from '../ui/formatters.js';
import { confirmAction } from '../ui/prompts.js';

interface CheckoutCommandOpts extends SessionOptions {
  dryRun?: boolean;
  slot?: number;
}

export async function checkoutCommand(opts: CheckoutCommandOpts): Promise<void> {
  const page = await getPage(opts);

  // Show cart first
  const cartPage = new CartPage(page);
  const { items, subtotal } = await cartPage.listItems();

  if (items.length === 0) {
    console.log(pc.yellow('\n  Cart is empty. Nothing to checkout.\n'));
    await closeSession();
    return;
  }

  console.log(pc.bold('\n  Cart Summary:'));
  console.log(formatCart(items, subtotal));

  if (opts.dryRun) {
    console.log(pc.cyan('  [Dry run] Would proceed to checkout with the above items.\n'));
    await closeSession();
    return;
  }

  const proceed = await confirmAction('Proceed to checkout?');
  if (!proceed) {
    await closeSession();
    return;
  }

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

  const confirmOrder = await confirmAction(pc.bold('Place this order?'));
  if (!confirmOrder) {
    console.log(pc.dim('  Order cancelled.\n'));
    await closeSession();
    return;
  }

  const success = await checkoutPage.placeOrder();
  if (success) {
    console.log(pc.green('\n  Order placed successfully!\n'));
  } else {
    console.log(pc.yellow('\n  Order may not have completed. Please check your Amazon account.\n'));
  }

  await closeSession();
}
