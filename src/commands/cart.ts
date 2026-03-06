import pc from 'picocolors';
import { getPage, closeSession, type SessionOptions } from '../browser/session.js';
import { CartPage } from '../pages/cart.page.js';
import { ProductPage } from '../pages/product.page.js';
import { formatCart } from '../ui/formatters.js';
import { confirmAction } from '../ui/prompts.js';

export async function cartListCommand(opts: SessionOptions): Promise<void> {
  const page = await getPage(opts);
  const cartPage = new CartPage(page);

  console.log(pc.dim('\n  Loading cart...\n'));
  const { items, subtotal } = await cartPage.listItems();
  console.log(formatCart(items, subtotal));
  await closeSession();
}

export async function cartAddCommand(asin: string, qty: string | undefined, opts: SessionOptions): Promise<void> {
  const page = await getPage(opts);
  const productPage = new ProductPage(page);
  const quantity = qty ? parseInt(qty) : 1;

  console.log(pc.dim(`\n  Adding ${asin} (qty: ${quantity}) to cart...\n`));
  await productPage.addToCart(asin, quantity);
  console.log(pc.green(`  Added to cart!\n`));
  await closeSession();
}

export async function cartRemoveCommand(asin: string, opts: SessionOptions): Promise<void> {
  const page = await getPage(opts);
  const cartPage = new CartPage(page);

  console.log(pc.dim(`\n  Removing ${asin} from cart...\n`));
  const removed = await cartPage.removeItem(asin);
  if (removed) {
    console.log(pc.green(`  Removed from cart.\n`));
  } else {
    console.log(pc.yellow(`  Item ${asin} not found in cart.\n`));
  }
  await closeSession();
}

export async function cartClearCommand(opts: SessionOptions): Promise<void> {
  const confirmed = await confirmAction('Clear all items from cart?');
  if (!confirmed) return;

  const page = await getPage(opts);
  const cartPage = new CartPage(page);

  console.log(pc.dim('\n  Clearing cart...\n'));
  const removed = await cartPage.clearCart();
  console.log(pc.green(`  Removed ${removed} item(s) from cart.\n`));
  await closeSession();
}
